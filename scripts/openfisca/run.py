"""
Précalcul offline de la grille complète de cas-types avec OpenFisca-France (calcul vectorisé).

Usage (depuis la racine du projet) :
    npx tsx scripts/export-grid.ts                                   # liste des cases (source unique : src/domain/grid.ts)
    cd scripts/openfisca && uv run python run.py --data ../../data   # ou ../../tests/fixtures/valid

Écrit dans <data>/castypes/ :
    grid.json           hypothèses, valeurs représentatives, empreinte de la grille
    baseline.json       revenu disponible annuel par case (législation actuelle)
    bourse.json         montant annuel de la bourse sur critères sociaux par échelon
    <candidatId>.json   variation annuelle par case (ou par échelon) pour chaque mesure chiffrable

Une mesure n'est chiffrée que si ses `parametres` correspondent à une réforme codée ici (REFORMES).
Sinon le script échoue : on ne force jamais un chiffre.
"""
import argparse
import json
import time
from datetime import date
from importlib.metadata import version
from pathlib import Path

import numpy as np
from openfisca_core.reforms import Reform
from openfisca_core.simulation_builder import SimulationBuilder
from openfisca_france import FranceTaxBenefitSystem

from grid import (AGE_REPRESENTATIF, AGES_ENFANTS, CONJOINT_NET, HYPOTHESES_COMMUNES, REVENU_NET, REVENU_NET_R2_AUTRES,
                  SMIC_HORAIRE_STATUTS, SOURCES)

ANNEE = '2026'
ANNEES = ['2023', '2024', '2025', ANNEE]  # les aides dépendent des revenus passés : situation supposée stable
MOIS = [f'{a}-{m:02d}' for a in ['2020', '2021', '2022'] + ANNEES for m in range(1, 13)]  # marge : certaines aides lisent des mois antérieurs
OPENFISCA_VERSION = version('openfisca-france')
HERE = Path(__file__).parent

# Composantes exportées pour expliquer chaque variation (entité individu → sommées sur le ménage).
DETAIL = {
    'salaire_net': ('individu', 'Salaire net'),
    'rpns_auto_entrepreneur_revenus_net': ('individu', 'Revenu d’activité indépendante'),
    'retraite_nette': ('individu', 'Pension de retraite nette'),
    'chomage_net': ('individu', 'Allocation chômage nette'),
    'aah': ('individu', 'AAH'),
    'ppa': ('famille', 'Prime d’activité'),
    'rsa': ('famille', 'RSA'),
    'aide_logement': ('famille', 'Aide au logement'),
    'af': ('famille', 'Allocations familiales'),
    'aspa': ('famille', 'Minimum vieillesse (ASPA)'),
    'impot_revenu_restant_a_payer': ('foyer_fiscal', 'Impôt sur le revenu'),
}
ARRONDI = 10  # € : les montants sont indicatifs, une précision à l'euro serait trompeuse


# ---------------------------------------------------------------------------
# Construction vectorisée : une case = un ménage = une famille = un foyer fiscal
# ---------------------------------------------------------------------------

class Situation:
    """Tableaux d'entrée OpenFisca pour une liste de cases (tous statuts confondus)."""

    def __init__(self, cells, revenus_bruts, conjoint_bruts, loyers):
        self.cells = cells
        persons, roles_fam, roles_ff, roles_men, owner = [], [], [], [], []
        for i, c in enumerate(cells):
            # Rôles à sous-rôles (parent, declarant) : il faut passer les sous-rôles au SimulationBuilder.
            members = [('moi', 'demandeur', 'declarant_principal', 'personne_de_reference')]
            if c['couple']:
                members.append(('conjoint', 'conjoint', 'conjoint', 'conjoint'))
            n = 3 if c['enfants'] == '3+' else int(c['enfants'])
            members += [(f'enfant{k}', 'enfant', 'personne_a_charge', 'enfant') for k in range(n)]
            for name, rf, rff, rm in members:
                persons.append(name)
                roles_fam.append(rf)
                roles_ff.append(rff)
                roles_men.append(rm)
                owner.append(i)
        self.kind = np.array(persons)
        self.owner = np.array(owner)
        self.roles = (roles_fam, roles_ff, roles_men)
        self.n_cells = len(cells)
        self.revenus_bruts = revenus_bruts
        self.conjoint_bruts = conjoint_bruts
        self.loyers = loyers

    def build(self, tbs, smic_bump=0.0):
        cells, kind, owner = self.cells, self.kind, self.owner
        n_p = len(kind)
        sb = SimulationBuilder()
        sb.create_entities(tbs)
        sb.declare_person_entity('individu', [f'p{k}' for k in range(n_p)])
        ids = [f'c{i}' for i in range(self.n_cells)]
        for entity, roles in zip(('famille', 'foyer_fiscal', 'menage'), self.roles):
            e = sb.declare_entity(entity, ids)
            sb.join_with_persons(e, [f'c{i}' for i in owner], roles)
        sim = sb.build(tbs)

        is_moi = kind == 'moi'
        is_conj = kind == 'conjoint'
        is_child = np.char.startswith(kind, 'enfant')
        statut = np.array([cells[i]['statutPro'] for i in owner])
        moi_statut = np.where(is_moi, statut, '')

        # Âges
        age = np.zeros(n_p)
        for k in range(n_p):
            c = cells[owner[k]]
            if kind[k] in ('moi', 'conjoint'):
                age[k] = AGE_REPRESENTATIF[(c['statutPro'], c['ageCalcul'])]
            else:
                age[k] = AGES_ENFANTS[int(kind[k][len('enfant'):])]
        # Revenus bruts annuels par personne
        brut = np.where(is_moi, self.revenus_bruts[owner], 0.0)
        brut_conj = np.where(is_conj, self.conjoint_bruts[owner], 0.0)
        bump = np.array([1 + smic_bump if (cells[i]['statutPro'], cells[i]['revenuTranche']) in SMIC_HORAIRE_STATUTS else 1.0
                         for i in owner])

        salarie = np.isin(moi_statut, ['salarie_prive', 'alternant', 'etudiant'])
        for a in ANNEES:
            b = bump if a == ANNEE else 1.0
            sim.set_input('salaire_de_base', a, np.where(salarie, brut * b, 0.0) + brut_conj)
            sim.set_input('chomage_brut', a, np.where(moi_statut == 'demandeur_emploi', brut, 0.0))
            sim.set_input('retraite_brute', a, np.where(moi_statut == 'retraite', brut, 0.0))
        fonct = moi_statut == 'fonctionnaire'
        indep = moi_statut == 'independant'
        categorie = np.where(fonct, 'public_titulaire_etat', 'prive_non_cadre')
        activite = np.full(n_p, 'actif', dtype=object)
        activite[moi_statut == 'etudiant'] = 'etudiant'
        activite[moi_statut == 'demandeur_emploi'] = 'chomeur'
        activite[moi_statut == 'retraite'] = 'retraite'
        activite[moi_statut == 'sans_activite'] = 'inactif'
        activite[is_child] = 'inactif'
        aah = np.array([cells[i]['handicapAAH'] for i in owner]) & is_moi
        statut_log = {'locataire_prive': 'locataire_vide', 'locataire_social': 'locataire_hlm',
                      'proprietaire': 'proprietaire', 'heberge': 'loge_gratuitement'}
        occ = np.array([statut_log[c['logement']] for c in cells])
        zone = np.array([c['zoneApl'] or 'zone_3' for c in cells])
        def enum(var, values):
            return tbs.variables[var].possible_values.encode(np.array(values, dtype=str))
        categorie = enum('categorie_salarie', categorie)
        activite = enum('activite', activite)
        occ = enum('statut_occupation_logement', occ)
        zone = enum('zone_apl', zone)
        for m in MOIS:
            sim.set_input('age', m, age)
            sim.set_input('categorie_salarie', m, categorie)
            sim.set_input('traitement_indiciaire_brut', m, np.where(fonct, brut / 12, 0.0))
            sim.set_input('rpns_auto_entrepreneur_CA_bnc', m, np.where(indep, brut / 12, 0.0))
            sim.set_input('apprenti', m, moi_statut == 'alternant')
            sim.set_input('activite', m, activite)
            sim.set_input('handicap', m, aah)
            sim.set_input('taux_incapacite', m, np.where(aah, 0.8, 0.0))
            sim.set_input('statut_occupation_logement', m, occ)
            sim.set_input('zone_apl', m, zone)
            sim.set_input('loyer', m, self.loyers)
        return sim


def aggregate(tbs, sim, n_cells, owner):
    """Revenu disponible et composantes, par case (ménage), en €/an."""
    out = {'revenu_disponible': sim.calculate('revenu_disponible', ANNEE)}  # calculé en premier (voir resolve_bruts)
    for var, (entity, _) in DETAIL.items():
        unit = tbs.variables[var].definition_period.name
        values = sim.calculate(var, ANNEE) if unit == 'YEAR' else sim.calculate_add(var, ANNEE)
        out[var] = np.bincount(owner, weights=values, minlength=n_cells) if entity == 'individu' else values
    return out


# ---------------------------------------------------------------------------
# Revenus bruts : les tranches du questionnaire sont en net, OpenFisca attend du brut → bisection vectorisée
# ---------------------------------------------------------------------------

NET_VAR = {
    'salarie_prive': 'salaire_net', 'alternant': 'salaire_net', 'etudiant': 'salaire_net',
    'fonctionnaire': 'salaire_net', 'independant': 'rpns_auto_entrepreneur_revenus_net',
    'demandeur_emploi': 'chomage_net', 'retraite': 'retraite_nette',
}


def resolve_bruts(tbs, targets):
    """targets : liste de (statut, net_mensuel). Renvoie les bruts annuels correspondants."""
    fake = [{'statutPro': s, 'ageCalcul': 'retraite_65_plus' if s == 'retraite' else '25_plus', 'revenuTranche': 'r1',
             'couple': False, 'revenuConjointTranche': None, 'enfants': '0', 'logement': 'proprietaire',
             'zoneApl': None, 'handicapAAH': False} for s, _ in targets]
    target = np.array([net * 12 for _, net in targets], dtype=float)
    lo, hi = target.copy(), target * 1.8 + 1
    for _ in range(30):
        mid = (lo + hi) / 2
        st = Situation(fake, mid, np.zeros(len(fake)), np.zeros(len(fake)))
        sim = st.build(tbs)
        # Calculer revenu_disponible d'abord : appeler directement retraite_nette renvoie un montant sans CSG
        # dans OpenFisca-France 176 (ordre d'évaluation). Voir test_regressions.py.
        sim.calculate('revenu_disponible', ANNEE)
        net = np.zeros(len(fake))
        for s in set(s for s, _ in targets):
            mask = np.array([t[0] == s for t in targets])
            net[mask] = np.bincount(st.owner, weights=sim.calculate_add(NET_VAR[s], ANNEE), minlength=len(fake))[mask]
        below = net < target
        lo = np.where(below, mid, lo)
        hi = np.where(below, hi, mid)
    return (lo + hi) / 2


# ---------------------------------------------------------------------------
# Réformes : une fonction par `parametres.kind` (src/schema/measure.ts)
# ---------------------------------------------------------------------------

START = f'{ANNEE}-01-01'
FIN = f'{ANNEE}-12-01'  # les réformes partent du barème en vigueur en fin d'année, appliqué à toute l'année


def update_param(params, path, fn):
    node = params
    for k in path.split('.'):
        node = getattr(node, k)
    node.update(start=START, value=fn(node(FIN)))


def param_reform(tbs, path, fn):
    class R(Reform):
        def apply(self):
            def modify(params):
                update_param(params, path, fn)
                return params
            self.modify_parameters(modifier_function=modify)
    return R(tbs)


SMIC = 'marche_travail.salaire_minimum.smic.smic_b_horaire'


def reforme_smic_pct(tbs, p, ctx):
    k = p['variationPct'] / 100
    return param_reform(tbs, SMIC, lambda v: v * (1 + k)), k


def reforme_smic_net(tbs, p, ctx):
    k = p['montantNetMensuel'] / ctx['smic_net_mensuel'] - 1
    return param_reform(tbs, SMIC, lambda v: v * (1 + k)), k


def reforme_smic_brut(tbs, p, ctx):
    k = p['montantBrutMensuel'] / (ctx['smic_brut_annuel'] / 12) - 1
    return param_reform(tbs, SMIC, lambda v: v * (1 + k)), k


# Montant de référence (personne seule, €/mois) de chaque prestation : chemin du paramètre et conversion.
PRESTATION_REF = {
    'rsa': ('prestations_sociales.solidarite_insertion.minima_sociaux.rsa.rsa_m.montant_de_base_du_rsa', 1),
    'aah': ('prestations_sociales.prestations_etat_de_sante.invalidite.aah.montant', 1),
    'aspa': ('prestations_sociales.solidarite_insertion.minimum_vieillesse.aspa.montant_maximum_annuel.personnes_seules', 12),
}
ASPA_COUPLES = 'prestations_sociales.solidarite_insertion.minimum_vieillesse.aspa.montant_maximum_annuel.couples'


def montant_mensuel_actuel(tbs, prestation):
    path, par_an = PRESTATION_REF[prestation]
    node = tbs.parameters
    for k in path.split('.'):
        node = getattr(node, k)
    return float(node(FIN)) / par_an


def prestation_factor_reform(tbs, prestation, factor):
    """Applique un même facteur au montant de référence (et au montant couple pour l'ASPA)."""
    path, _ = PRESTATION_REF[prestation]

    class R(Reform):
        def apply(self):
            def modify(params):
                update_param(params, path, lambda v: v * factor)
                if prestation == 'aspa':
                    update_param(params, ASPA_COUPLES, lambda v: v * factor)
                return params
            self.modify_parameters(modifier_function=modify)
    return R(tbs)


def reforme_prestation_cible(tbs, p, ctx):
    return prestation_factor_reform(tbs, p['prestation'], p['montantMensuel'] / montant_mensuel_actuel(tbs, p['prestation'])), 0.0


def reforme_prestation_cible_smic(tbs, p, ctx):
    cible = ctx['smic_net_mensuel'] * p['pctSmicNet'] / 100
    return prestation_factor_reform(tbs, p['prestation'], cible / montant_mensuel_actuel(tbs, p['prestation'])), 0.0


def reforme_prestation_ajout(tbs, p, ctx):
    actuel = montant_mensuel_actuel(tbs, p['prestation'])
    return prestation_factor_reform(tbs, p['prestation'], (actuel + p['montantMensuel']) / actuel), 0.0


def reforme_rsa_age(tbs, p, ctx):
    path = 'prestations_sociales.solidarite_insertion.minima_sociaux.rsa.rsa_cond.age_minimum_allocataire'
    return param_reform(tbs, path, lambda v: p['ageMinimum']), 0.0


def reforme_quotient_familial(tbs, p, ctx):
    path = f"impot_revenu.calcul_impot_revenu.plaf_qf.quotient_familial.cas_general.{p['rang']}"
    return param_reform(tbs, path, lambda v: p['parts']), 0.0


def reforme_taux_csg(tbs, p, ctx):
    """Taux global de CSG sur les revenus d'activité porté à tauxPct ; l'écart porte sur la part déductible."""
    class R(Reform):
        def apply(self):
            def modify(params):
                csg = params.prelevements_sociaux.contributions_sociales.csg.activite
                ecart = csg.taux_global(FIN) - p['tauxPct'] / 100
                csg.deductible.update(start=START, value=csg.deductible(FIN) - ecart)
                csg.taux_global.update(start=START, value=p['tauxPct'] / 100)
                return params
            self.modify_parameters(modifier_function=modify)
    return R(tbs), 0.0


PARAM_PRESTATION = {
    'rsa': 'prestations_sociales.solidarite_insertion.minima_sociaux.rsa.rsa_m.montant_de_base_du_rsa',
    'aah': 'prestations_sociales.prestations_etat_de_sante.invalidite.aah.montant',
}
VARIABLE_PRESTATION = {'apl': 'aide_logement_montant', 'prime_activite': 'ppa', 'allocations_familiales': 'af'}


def reforme_montant_prestation(tbs, p, ctx):
    factor = 1 + p['variationPct'] / 100
    prestation = p['prestation']
    if prestation in PARAM_PRESTATION:
        return param_reform(tbs, PARAM_PRESTATION[prestation], lambda v: v * factor), 0.0
    if prestation in VARIABLE_PRESTATION:
        name = VARIABLE_PRESTATION[prestation]
        original = tbs.variables[name]

        class R(Reform):
            def apply(self):
                class scaled(type(original)):
                    def formula(entity, period, parameters):
                        base = original.get_formula(period)
                        value = base(entity, period, parameters) if base.__code__.co_argcount == 3 else base(entity, period)
                        return value * factor
                scaled.__name__ = name
                self.update_variable(scaled)
        return R(tbs), 0.0
    raise NotImplementedError(f'prestation "{prestation}" : chiffrage par case non prévu (bourse : par échelon)')


def reforme_bareme_ir(tbs, p, ctx):
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
    'smic_net': reforme_smic_net,
    'smic_brut': reforme_smic_brut,
    'prestation_cible': reforme_prestation_cible,
    'prestation_cible_smic': reforme_prestation_cible_smic,
    'prestation_ajout': reforme_prestation_ajout,
    'rsa_age': reforme_rsa_age,
    'quotient_familial': reforme_quotient_familial,
    'taux_csg': reforme_taux_csg,
    'montant_prestation': reforme_montant_prestation,
    'bareme_ir': reforme_bareme_ir,
}

BOURSE = 'prestations_sociales.education.bourses.enseignement_superieur.criteres_sociaux.montants'
ECHELONS = ['0bis', '1', '2', '3', '4', '5', '6', '7']


def bourses_annuelles(tbs, factor=1.0):
    """Montant annuel par échelon (barème mensuel OpenFisca × 10 mensualités)."""
    scale = tbs.parameters(f'{ANNEE}-09-01').prestations_sociales.education.bourses.enseignement_superieur.criteres_sociaux.montants
    return {e: round(float(scale.calc(np.array([i]))[0]) * 10 * factor) for i, e in enumerate(ECHELONS)}


# ---------------------------------------------------------------------------

# Statuts dont OpenFisca-France ne calcule pas de revenu disponible fiable : pas de chiffre (null), jamais d'approximation.
# Micro-entrepreneur·e : le chiffre d'affaires mensuel déclaré n'alimente pas revenu_disponible dans la version 176.
STATUTS_NON_SIMULES = {'independant'}
MASK = None


def rounded(a):
    values = np.round(np.asarray(a, dtype=float) / ARRONDI) * ARRONDI
    return [None if (MASK is not None and MASK[i]) else int(x) for i, x in enumerate(values)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--data', required=True)
    ap.add_argument('--limit', type=int, default=0, help='nombre de cases (tests rapides uniquement)')
    args = ap.parse_args()
    data_dir = Path(args.data).resolve()
    out_dir = data_dir / 'castypes'
    out_dir.mkdir(exist_ok=True)
    grid = json.loads((HERE / 'cells.generated.json').read_text())
    cells = grid['cells'][: args.limit or None]
    t0 = time.time()
    global MASK
    MASK = np.array([c['statutPro'] in STATUTS_NON_SIMULES for c in cells])

    tbs = FranceTaxBenefitSystem()
    smic_brut = float(tbs.parameters(f'{ANNEE}-12-01').marche_travail.salaire_minimum.smic.smic_b_horaire) * 151.67 * 12

    # 1. Revenus bruts représentatifs (bisection vectorisée sur les couples statut × net distincts)
    pairs = sorted({(c['statutPro'], c['revenuTranche']) for c in cells})
    targets = []
    for s, t in pairs:
        v = REVENU_NET[t]
        if s in ('sans_activite',) or s in STATUTS_NON_SIMULES or v == 0:
            continue
        if v == 'SMIC' and s == 'salarie_prive':
            continue
        # Fonctionnaire au niveau du SMIC : même net que le SMIC ; autres statuts : 1 250 € en tranche r2.
        targets.append((s, 'SMIC' if v == 'SMIC' and s == 'fonctionnaire' else (REVENU_NET_R2_AUTRES if v == 'SMIC' else v)))
    # SMIC net : calculé une fois sur un salarié au SMIC brut
    st = Situation([{'statutPro': 'salarie_prive', 'ageCalcul': '25_plus', 'revenuTranche': 'r2', 'couple': False,
                     'revenuConjointTranche': None, 'enfants': '0', 'logement': 'proprietaire', 'zoneApl': None,
                     'handicapAAH': False}], np.array([smic_brut]), np.zeros(1), np.zeros(1))
    sim = st.build(tbs)
    sim.calculate('revenu_disponible', ANNEE)
    smic_net = float(sim.calculate_add('salaire_net', ANNEE)[0]) / 12
    resolved = resolve_bruts(tbs, [(s, smic_net if v == 'SMIC' else v) for s, v in targets])
    brut_by_pair = {(s, t): 0.0 for s, t in pairs}
    brut_by_pair[('salarie_prive', 'r2')] = smic_brut
    k = 0
    for s, t in pairs:
        v = REVENU_NET[t]
        if s == 'sans_activite' or s in STATUTS_NON_SIMULES or v == 0 or (v == 'SMIC' and s == 'salarie_prive'):
            continue
        brut_by_pair[(s, t)] = float(resolved[k])
        k += 1
    conj_bruts = dict(zip(CONJOINT_NET, resolve_bruts(tbs, [('salarie_prive', v) for v in CONJOINT_NET.values()])))
    conj_bruts = {c: (0.0 if CONJOINT_NET[c] == 0 else b) for c, b in conj_bruts.items()}
    print(f'bruts résolus en {time.time() - t0:.0f} s ; SMIC net = {smic_net:.0f} €/mois', flush=True)

    revenus = np.array([brut_by_pair[(c['statutPro'], c['revenuTranche'])] for c in cells])
    conjoints = np.array([conj_bruts[c['revenuConjointTranche']] if c['couple'] else 0.0 for c in cells])

    # 2. Loyers : cas-type DREES (loyer ≥ plafond et < seuil de dégressivité) → 1,3 × plafond calculé par OpenFisca
    loyers = np.zeros(len(cells))
    locataire = np.array([c['logement'] in ('locataire_prive', 'locataire_social') for c in cells])
    situation = Situation(cells, revenus, conjoints, np.where(locataire, 1.0, 0.0))
    sim = situation.build(tbs)
    plafond = sim.calculate('aide_logement_loyer_plafond', f'{ANNEE}-01')
    loyers = np.where(locataire, np.round(plafond * 1.3), 0.0)
    situation = Situation(cells, revenus, conjoints, loyers)

    # 3. Situation actuelle
    base = aggregate(tbs, situation.build(tbs), len(cells), situation.owner)
    print(f'baseline : {len(cells)} cases en {time.time() - t0:.0f} s', flush=True)
    bourses = bourses_annuelles(tbs)

    meta = {'openfiscaFrance': OPENFISCA_VERSION, 'legislation': ANNEE, 'genereLe': date.today().isoformat(),
            'gridHash': grid['gridHash'], 'nCells': len(cells)}
    write(out_dir / 'grid.json', {
        **meta,
        'hypothesesCommunes': [h.format(annee=ANNEE, version=OPENFISCA_VERSION) for h in HYPOTHESES_COMMUNES],
        'smicNetMensuel': round(smic_net),
        'statutsNonSimules': sorted(STATUTS_NON_SIMULES),
        'revenusNetsMensuels': {t: (round(smic_net) if v == 'SMIC' else v) for t, v in REVENU_NET.items()},
        'conjointsNetsMensuels': CONJOINT_NET,
        'sources': SOURCES,
    })
    write(out_dir / 'baseline.json', {**meta, 'revenuDisponible': rounded(base['revenu_disponible'])})
    write(out_dir / 'bourse.json', {**meta, 'montantsAnnuels': bourses})

    # 4. Réformes par candidat
    ctx = {'smic_net_mensuel': smic_net, 'smic_brut_annuel': smic_brut}
    for f in sorted((data_dir / 'measures').glob('*.json')):
        mf = json.loads(f.read_text())
        mesures = {}
        for m in mf['mesures']:
            if not any((e.get('ampleur') or {}).get('kind') == 'castype' for e in m['effets']):
                continue
            p = m['parametres']
            if p['kind'] == 'montant_prestation' and p['prestation'] == 'bourse':
                apres = bourses_annuelles(tbs, 1 + p['variationPct'] / 100)
                mesures[m['id']] = {'parametres': p, 'parEchelon': {e: apres[e] - bourses[e] for e in ECHELONS}}
                continue
            if p['kind'] not in REFORMES:
                raise NotImplementedError(f"{m['id']} : paramètres \"{p['kind']}\" non modélisables par OpenFisca")
            reform_tbs, bump = REFORMES[p['kind']](tbs, p, ctx)
            r = aggregate(reform_tbs, situation.build(reform_tbs, smic_bump=bump), len(cells), situation.owner)
            detail = {}
            for var in DETAIL:
                d = rounded(r[var] - base[var])
                if any(x for x in d if x):
                    detail[var] = d
            mesures[m['id']] = {'parametres': p, 'total': rounded(r['revenu_disponible'] - base['revenu_disponible']),
                                'detail': detail}
            print(f"  {m['id']} ({time.time() - t0:.0f} s)", flush=True)
        write(out_dir / f"{mf['candidatId']}.json", {
            **meta, 'candidatId': mf['candidatId'],
            'libellesDetail': {k: v[1] for k, v in DETAIL.items()}, 'mesures': mesures,
        })
    print(f'OK -> {out_dir} ({time.time() - t0:.0f} s)')


def write(path, obj):
    path.write_text(json.dumps(obj, ensure_ascii=False, separators=(',', ':')) + '\n')


if __name__ == '__main__':
    main()
