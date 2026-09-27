"""
Valeurs représentatives des cases de la grille (la liste des cases vient de src/domain/grid.ts).
Ces valeurs sont des HYPOTHÈSES : elles sont exportées dans castypes/grid.json et affichées à l'utilisateur.
"""

# Revenu net mensuel représentatif par tranche (milieu de tranche). 'SMIC' = SMIC net temps plein de l'année
# simulée (salarié·e du privé uniquement ; pour les autres statuts, la tranche r2 vaut 1 250 €).
REVENU_NET = {'r0': 0, 'r1': 700, 'r2': 'SMIC', 'r3': 1750, 'r4': 2500, 'r5': 3800, 'r6': 6500}
REVENU_NET_R2_AUTRES = 1250

# Revenu net mensuel du ou de la conjoint·e (salarié·e du privé).
CONJOINT_NET = {'c0': 0, 'c1': 1200, 'c2': 2200, 'c3': 4000}

AGE_REPRESENTATIF = {}
for statut in ['etudiant', 'alternant', 'salarie_prive', 'fonctionnaire', 'independant', 'demandeur_emploi', 'sans_activite']:
    AGE_REPRESENTATIF[(statut, 'moins_25')] = 21 if statut != 'etudiant' else 20
    AGE_REPRESENTATIF[(statut, '25_plus')] = 26 if statut in ('etudiant', 'alternant') else 35
AGE_REPRESENTATIF[('retraite', 'retraite_moins_65')] = 62
AGE_REPRESENTATIF[('retraite', 'retraite_65_plus')] = 68

AGES_ENFANTS = [6, 10, 14]

# Cases dont la rémunération suit le SMIC horaire (hausse du SMIC appliquée au salaire) :
# temps partiel ou temps plein au SMIC (salarié·e du privé jusqu'à 1 500 €), jobs étudiants, apprenti·e·s.
SMIC_HORAIRE_STATUTS = {
    ('salarie_prive', 'r1'), ('salarie_prive', 'r2'),
    ('etudiant', 'r1'), ('etudiant', 'r2'),
    ('alternant', 'r1'), ('alternant', 'r2'), ('alternant', 'r3'),
}

HYPOTHESES_COMMUNES = [
    'Législation {annee} modélisée par OpenFisca-France {version}, à législation constante hors mesure',
    'Situation stable depuis 3 ans (mêmes revenus les années précédentes)',
    'Revenu net représentatif de ta tranche (milieu de tranche ; SMIC net temps plein pour un·e salarié·e entre 1 000 et 1 500 €)',
    'Locataires : loyer supérieur au plafond des aides au logement mais sous le seuil de dégressivité (cas-type de la DREES)',
    'Enfants de 6, 10 et 14 ans ; conjoint·e salarié·e du privé',
    'Fonctionnaire : titulaire de l’État ; indépendant·e : micro-entrepreneur·e en prestations de services (BNC)',
    'Montants annuels pour l’ensemble du foyer, arrondis à 10 €',
    'Aucun effet sur l’emploi, les prix ou les comportements',
]

SOURCES = [
    {
        'id': 'drees-ms2025-fiche34',
        'url': 'https://drees.solidarites-sante.gouv.fr/sites/default/files/2025-12/MS2025%20-%20Fiche%2034%20-%20Les%20aides%20au%20logement.pdf',
        'titre': 'Minima sociaux et prestations sociales, édition 2025 — Fiche 34 : les aides au logement',
        'editeur': 'DREES',
        'datePublication': '2025-12-01',
        'dateConsultation': '2026-09-27',
        'type': 'chiffrage_tiers',
        'archiveUrl': None,
    },
]
