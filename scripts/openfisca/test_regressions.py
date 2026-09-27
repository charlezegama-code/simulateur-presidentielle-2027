"""
Tests de non-régression du précalcul OpenFisca (uv run pytest).

Pension de retraite : dans OpenFisca-France 176, calculer directement `retraite_nette` renvoie un montant sans CSG ;
le précalcul passe donc toujours par `revenu_disponible` d'abord (voir run.aggregate / run.resolve_bruts).
Ces tests échouent si la CSG disparaît du résultat d'un·e retraité·e.
"""
import numpy as np
from openfisca_france import FranceTaxBenefitSystem

from run import ANNEE, Situation, aggregate, resolve_bruts

TBS = FranceTaxBenefitSystem()
RETRAITE = {'statutPro': 'retraite', 'ageCalcul': 'retraite_65_plus', 'revenuTranche': 'r3', 'couple': False,
            'revenuConjointTranche': None, 'enfants': '0', 'logement': 'proprietaire', 'zoneApl': None,
            'handicapAAH': False}


def test_pension_nette_inferieure_a_la_brute():
    brut = 21000.0
    st = Situation([RETRAITE], np.array([brut]), np.zeros(1), np.zeros(1))
    r = aggregate(TBS, st.build(TBS), 1, st.owner)
    # Taux de CSG + CRDS + CASA sur les pensions : au moins 3,8 % + 0,5 % (taux réduit) pour ce niveau de revenu.
    assert r['retraite_nette'][0] < brut * 0.96, r['retraite_nette'][0]
    assert r['revenu_disponible'][0] < brut


def test_bisection_retrouve_le_net_vise_avec_csg():
    brut = resolve_bruts(TBS, [('retraite', 1750)])[0]
    assert brut > 1750 * 12 * 1.04, brut  # le brut doit dépasser le net d'au moins les prélèvements sociaux
    st = Situation([RETRAITE], np.array([brut]), np.zeros(1), np.zeros(1))
    r = aggregate(TBS, st.build(TBS), 1, st.owner)
    assert abs(r['retraite_nette'][0] - 1750 * 12) < 50


def test_salarie_au_smic():
    smic_brut = float(TBS.parameters(f'{ANNEE}-12-01').marche_travail.salaire_minimum.smic.smic_b_horaire) * 151.67 * 12
    cell = {**RETRAITE, 'statutPro': 'salarie_prive', 'ageCalcul': '25_plus', 'revenuTranche': 'r2'}
    st = Situation([cell], np.array([smic_brut]), np.zeros(1), np.zeros(1))
    r = aggregate(TBS, st.build(TBS), 1, st.owner)
    assert 0.76 < r['salaire_net'][0] / smic_brut < 0.82
    assert r['ppa'][0] > 0  # prime d'activité au SMIC pour une personne seule
