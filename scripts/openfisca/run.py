"""
Précalcul offline des cas-types avec OpenFisca-France.

Usage (depuis scripts/openfisca) :
    uv run python run.py --data ../../data
    uv run python run.py --data ../../tests/fixtures/valid

Écrit dans <data>/castypes/ :
    grid.json            définition des cas-types + hypothèses (affichées dans l'UI)
    baseline.json        revenu disponible à législation constante
    <candidatId>.json    delta annuel (€) par mesure chiffrable et par cas-type

Une mesure n'est chiffrée que si ses `parametres` correspondent à une réforme codée ci-dessous (REFORMES).
Sinon le script échoue : on ne force jamais un chiffre.
"""
import argparse
import copy
import json
from datetime import date
from importlib.metadata import version
from pathlib import Path

from openfisca_core.reforms import Reform
from openfisca_core.simulation_builder import SimulationBuilder
from openfisca_france import FranceTaxBenefitSystem

from grid import DIMENSION_ORDONNEE, DIMENSIONS_EXACTES, HYPOTHESES_COMMUNES, build_grid

ANNEE = '2026'
HISTORIQUE = ['2023', '2024', '2025']  # les aides (APL, prime d'activité…) dépendent des revenus passés
OPENFISCA_VERSION = version('openfisca-france')

# Composantes du revenu disponible exportées pour expliquer chaque delta.
DETAIL = {
    'salaire_net': 'Salaire net',
    'retraite_nette': 'Pension de retraite nette',
    'chomage_net': 'Allocation chômage nette',
    'ppa': 'Prime d’activité',
    'rsa': 'RSA',
    'aide_logement': 'Aide au logement',
    'af': 'Allocations familiales',
    'aah': 'AAH',
    'impot_revenu_restant_a_payer': 'Impôt sur le revenu',
}


def months(year, value):
    return {f'{year}-{m:02d}': value for m in range(1, 13)}


# ---------------------------------------------------------------------------
# Construction d'une situation OpenFisca à partir d'un cas-type
# ---------------------------------------------------------------------------

def build_case(ct, brut_annuel, brut_conjoint_annuel, smic_bump=0.0):
    v, p = ct['valeurs'], ct['profil']
    years = HISTORIQUE + [ANNEE]
    moi = {'age': months(ANNEE, v['age'])}
    statut = p['statutPro']
    revenu = {y: brut_annuel for y in years}
    if statut == 'retraite':
        moi['retraite_brute'] = revenu
    elif statut == 'demandeur_emploi':
        moi['chomage_brut'] = revenu
    elif statut in ('salarie_prive', 'etudiant'):
        moi['salaire_de_base'] = {y: b * (1 + smic_bump) if y == ANNEE else b for y, b in revenu.items()}
        if statut == 'etudiant':
            moi['activite'] = months(ANNEE, 'etudiant')
    # sans_activite : aucun revenu

    individus = {'moi': moi}
    parents = ['moi']
    if p['couple']:
        individus['conjoint'] = {'age': months(ANNEE, v['age']),
                                 'salaire_de_base': {y: brut_conjoint_annuel for y in years}}
        parents.append('conjoint')
    enfants = []
    for i, age in enumerate(v['agesEnfants']):
        individus[f'enfant{i}'] = {'age': months(ANNEE, age)}
        enfants.append(f'enfant{i}')

    statut_logement = {
        'locataire_prive': 'locataire_vide',
        'locataire_social': 'locataire_hlm',
        'proprietaire': 'proprietaire',
        'heberge': 'loge_gratuitement',
    }[p['logement']]
    menage = {
        'personne_de_reference': ['moi'],
        'enfants': enfants,
        'statut_occupation_logement': months(ANNEE, statut_logement),
        'zone_apl': months(ANNEE, v['zoneApl']),
        'loyer': months(ANNEE, v['loyerMensuel']),
    }
    if p['couple']:
        menage['conjoint'] = ['conjoint']
    return {
        'individus': individus,
        'familles': {'famille': {'parents': parents, 'enfants': enfants}},
        'foyers_fiscaux': {'foyer': {'declarants': parents, 'personnes_a_charge': enfants}},
        'menages': {'menage': menage},
    }


def compute(tbs, case):
    sim = SimulationBuilder().build_from_entities(tbs, case)
    out = {'revenu_disponible': float(sim.calculate('revenu_disponible', ANNEE).sum())}
    for var in DETAIL:
        period_unit = tbs.variables[var].definition_period.name
        values = sim.calculate(var, ANNEE) if period_unit == 'YEAR' else sim.calculate_add(var, ANNEE)
        out[var] = float(values.sum())
    return out


NET_VAR = {'retraite': 'retraite_nette', 'demandeur_emploi': 'chomage_net'}


def resolve_brut(tbs, ct, net_mensuel, conjoint=False):
    """Trouve par bisection le brut annuel qui donne le net mensuel visé (le cas-type est défini en net)."""
    if net_mensuel == 0:
        return 0.0
    statut = 'salarie_prive' if conjoint else ct['profil']['statutPro']
    var = NET_VAR.get(statut, 'salaire_net')
    target = net_mensuel * 12
    lo, hi = target, target * 1.6
    for _ in range(40):
        mid = (lo + hi) / 2
        c = copy.deepcopy(ct)
        c['profil'] = {**c['profil'], 'statutPro': statut, 'couple': False}
        c['valeurs'] = {**c['valeurs'], 'agesEnfants': []}
        # Passer par compute() (revenu_disponible calculé d'abord) : appeler directement retraite_nette
        # donne un résultat sans CSG dans OpenFisca-France 176 (ordre d'évaluation), on reste sur un seul chemin.
        net = compute(tbs, build_case(c, mid, 0))[var]
        lo, hi = (mid, hi) if net < target else (lo, mid)
    return (lo + hi) / 2


# ---------------------------------------------------------------------------
# Réformes : une fonction par `parametres.kind` (src/schema/measure.ts)
# ---------------------------------------------------------------------------

START = f'{ANNEE}-01-01'


def reforme_smic_pct(tbs, p):
    class R(Reform):
        def apply(self):
            def modify(params):
                node = params.marche_travail.salaire_minimum.smic.smic_b_horaire
                node.update(start=START, value=node(START) * (1 + p['variationPct'] / 100))
                return params
            self.modify_parameters(modifier_function=modify)
    # Hypothèse de scénario : les cas-types payés au SMIC voient leur salaire suivre la hausse.
    return R(tbs), p['variationPct'] / 100


def reforme_taux_csg(tbs, p):
    """Le taux global de CSG sur les revenus d'activité est porté à tauxPct ; l'écart porte sur la part déductible."""
    class R(Reform):
        def apply(self):
            def modify(params):
                csg = params.prelevements_sociaux.contributions_sociales.csg.activite
                ecart = csg.taux_global(START) - p['tauxPct'] / 100
                csg.deductible.update(start=START, value=csg.deductible(START) - ecart)
                csg.taux_global.update(start=START, value=p['tauxPct'] / 100)
                return params
            self.modify_parameters(modifier_function=modify)
    return R(tbs), 0.0


PARAM_PRESTATION = {
    'rsa': 'prestations_sociales.solidarite_insertion.minima_sociaux.rsa.rsa_m.montant_de_base_du_rsa',
    'aah': 'prestations_sociales.prestations_etat_de_sante.invalidite.aah.montant',
}
# Prestations sans paramètre de montant unique : on met à l'échelle la variable calculée.
VARIABLE_PRESTATION = {
    'apl': 'aide_logement_montant',
    'prime_activite': 'ppa',
    'allocations_familiales': 'af',
}


def reforme_montant_prestation(tbs, p):
    factor = 1 + p['variationPct'] / 100
    prestation = p['prestation']
    if prestation in PARAM_PRESTATION:
        path = PARAM_PRESTATION[prestation].split('.')

        class R(Reform):
            def apply(self):
                def modify(params):
                    node = params
                    for k in path:
                        node = getattr(node, k)
                    node.update(start=START, value=node(START) * factor)
                    return params
                self.modify_parameters(modifier_function=modify)
        return R(tbs), 0.0
    if prestation in VARIABLE_PRESTATION:
        name = VARIABLE_PRESTATION[prestation]
        original = tbs.variables[name]

        class R(Reform):
            def apply(self):
                class scaled(type(original)):
                    def formula(entity, period, parameters):
                        base = original.get_formula(period)
                        n_args = base.__code__.co_argcount
                        value = base(entity, period, parameters) if n_args == 3 else base(entity, period)
                        return value * factor
                scaled.__name__ = name
                self.update_variable(scaled)
        return R(tbs), 0.0
    raise NotImplementedError(f'prestation "{prestation}" non modélisée : la mesure doit rester qualitative')


def reforme_bareme_ir(tbs, p):
    class R(Reform):
        def apply(self):
            def modify(params):
                bareme = params.impot_revenu.bareme_ir_depuis_1945.bareme
                if len(bareme.brackets) != len(p['tranches']):
                    raise NotImplementedError('changement du nombre de tranches du barème IR non géré')
                for bracket, t in zip(bareme.brackets, p['tranches']):
                    bracket.threshold.update(start=START, value=t['seuil'])
                    bracket.rate.update(start=START, value=t['tauxPct'] / 100)
                return params
            self.modify_parameters(modifier_function=modify)
    return R(tbs), 0.0


REFORMES = {
    'smic_pct': reforme_smic_pct,
    'taux_csg': reforme_taux_csg,
    'montant_prestation': reforme_montant_prestation,
    'bareme_ir': reforme_bareme_ir,
    # 'age_retraite' : OpenFisca ne simule pas les carrières -> non chiffrable.
}


# ---------------------------------------------------------------------------

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--data', required=True, help='dossier de données (contient candidates.json et measures/)')
    args = ap.parse_args()
    data_dir = Path(args.data).resolve()
    out_dir = data_dir / 'castypes'
    out_dir.mkdir(exist_ok=True)

    tbs = FranceTaxBenefitSystem()
    grid = build_grid()
    smic_brut_annuel = float(tbs.parameters(f'{ANNEE}-12-01').marche_travail.salaire_minimum.smic.smic_b_horaire) * 151.67 * 12

    # 1. Résolution des revenus bruts de chaque cas-type
    bruts = {}
    for ct in grid:
        net = ct['valeurs']['revenuNetMensuel']
        if net == 'SMIC':
            brut = smic_brut_annuel if ct['profil']['statutPro'] in ('salarie_prive', 'etudiant') else None
            if brut is None:
                raise ValueError(f"{ct['id']} : tranche SMIC réservée aux salariés")
            ct['valeurs']['auSmic'] = True
        else:
            brut = resolve_brut(tbs, ct, net)
            ct['valeurs']['auSmic'] = False
        conj = ct['valeurs']['revenuConjointNetMensuel']
        brut_conj = (smic_brut_annuel if conj == 'SMIC' else resolve_brut(tbs, ct, conj, conjoint=True)) if conj is not None else 0
        bruts[ct['id']] = (brut, brut_conj)

    # 2. Baseline
    baseline = {}
    for ct in grid:
        b, bc = bruts[ct['id']]
        r = compute(tbs, build_case(ct, b, bc))
        ct['valeurs']['revenuNetMensuelCalcule'] = round(
            (r['salaire_net'] + r['retraite_nette'] + r['chomage_net']) / 12 if not ct['profil']['couple'] else 0)
        baseline[ct['id']] = {k: round(v) for k, v in r.items()}

    meta = {'openfiscaFrance': OPENFISCA_VERSION, 'legislation': ANNEE, 'genereLe': date.today().isoformat()}
    hypotheses = [h.format(annee=ANNEE, version=OPENFISCA_VERSION) for h in HYPOTHESES_COMMUNES]
    write(out_dir / 'grid.json', {
        **meta,
        'dimensionsExactes': DIMENSIONS_EXACTES,
        'dimensionOrdonnee': DIMENSION_ORDONNEE,
        'hypothesesCommunes': hypotheses,
        'castypes': grid,
    })
    write(out_dir / 'baseline.json', {**meta, 'resultats': baseline})

    # 3. Réformes par candidat
    for f in sorted((data_dir / 'measures').glob('*.json')):
        mf = json.loads(f.read_text())
        deltas = {}
        for m in mf['mesures']:
            if not any((e.get('ampleur') or {}).get('kind') == 'castype' for e in m['effets']):
                continue
            kind = m['parametres']['kind']
            if kind not in REFORMES:
                raise NotImplementedError(f"{m['id']} : paramètres \"{kind}\" non modélisables, l'effet doit rester qualitatif")
            reform_tbs, smic_bump = REFORMES[kind](tbs, m['parametres'])
            par_castype = {}
            for ct in grid:
                b, bc = bruts[ct['id']]
                bump = smic_bump if ct['valeurs']['auSmic'] else 0.0
                r = compute(reform_tbs, build_case(ct, b, bc, smic_bump=bump))
                base = baseline[ct['id']]
                par_castype[ct['id']] = {
                    'total': round(r['revenu_disponible'] - base['revenu_disponible']),
                    'detail': {k: round(r[k] - base[k]) for k in DETAIL if round(r[k] - base[k]) != 0},
                }
            deltas[m['id']] = {'parametres': m['parametres'], 'parCastype': par_castype}
            print(f"  {m['id']}: " + ', '.join(f"{k}={v['total']:+}" for k, v in par_castype.items()))
        write(out_dir / f"{mf['candidatId']}.json", {**meta, 'candidatId': mf['candidatId'], 'libellesDetail': DETAIL, 'mesures': deltas})
    print(f'OK -> {out_dir}')


def write(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    main()
