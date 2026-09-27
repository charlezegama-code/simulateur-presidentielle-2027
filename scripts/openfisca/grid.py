"""
Grille de cas-types : profils représentatifs pour lesquels OpenFisca calcule les montants.

Chaque cas-type correspond à une combinaison de champs du profil (src/schema/profile.ts) et fixe des valeurs
représentatives (revenu, loyer, âges). Ces valeurs sont des HYPOTHÈSES : elles sont exportées dans grid.json
et affichées à l'utilisateur à côté de chaque montant.

Étape 3 : seuls les cas-types de référence sont générés. La grille complète viendra avec les vraies mesures.
"""

# Revenu net mensuel représentatif par tranche (milieu de tranche). "SMIC" = SMIC net temps plein de l'année simulée.
REVENU_REPRESENTATIF = {
    'r0': 0,
    'r1': 700,
    'r2': 'SMIC',
    'r3': 1750,
    'r4': 2500,
    'r5': 3800,
    'r6': 6500,
}

# Loyer mensuel hors charges supposé (€), selon le logement, la zone et la taille du foyer.
LOYER_SUPPOSE = {
    ('locataire_prive', 'grande_ville'): (700, 900),
    ('locataire_prive', 'ville_moyenne'): (550, 750),
    ('locataire_prive', 'rural'): (480, 650),
    ('locataire_social', 'grande_ville'): (420, 520),
    ('locataire_social', 'ville_moyenne'): (380, 480),
    ('locataire_social', 'rural'): (350, 450),
}

# Correspondance approximative type de commune -> zone APL (la zone 1 = agglomération parisienne n'est pas couverte).
ZONE_APL = {'grande_ville': 'zone_2', 'ville_moyenne': 'zone_3', 'rural': 'zone_3'}

# Statuts pour lesquels un cas-type peut être calculé. Les autres (fonctionnaire, indépendant, alternant) n'ont pas
# de cas-type : leurs effets chiffrés s'affichent comme "non chiffré pour ton statut".
STATUTS_SIMULES = ['etudiant', 'salarie_prive', 'demandeur_emploi', 'retraite', 'sans_activite']

AGES_ENFANTS = [6, 10, 14]


def castype(id, libelle, *, statutPro, revenuTranche, couple=False, revenuConjointTranche=None, enfants='0',
            logement, zone, handicapAAH=False, boursier=False, age=35):
    n_enfants = 3 if enfants == '3+' else int(enfants)
    loyer = 0
    if logement in ('locataire_prive', 'locataire_social'):
        seul, famille = LOYER_SUPPOSE[(logement, zone)]
        loyer = famille if (couple or n_enfants > 0) else seul
    return {
        'id': id,
        'libelle': libelle,
        'profil': {
            'statutPro': statutPro,
            'revenuTranche': revenuTranche,
            'couple': couple,
            'revenuConjointTranche': revenuConjointTranche,
            'enfants': enfants,
            'logement': logement,
            'zone': zone,
            'handicapAAH': handicapAAH,
            'boursier': boursier,
        },
        'valeurs': {
            'age': age,
            'revenuNetMensuel': REVENU_REPRESENTATIF[revenuTranche],
            'revenuConjointNetMensuel': REVENU_REPRESENTATIF[revenuConjointTranche] if revenuConjointTranche else None,
            'loyerMensuel': loyer,
            'zoneApl': ZONE_APL[zone],
            'agesEnfants': AGES_ENFANTS[:n_enfants],
        },
    }


REFERENCE = [
    castype('etudiant-boursier', 'Étudiant·e boursier·e, job de 700 €/mois, seul·e, locataire en grande ville',
            statutPro='etudiant', revenuTranche='r1', logement='locataire_prive', zone='grande_ville',
            boursier=True, age=20),
    castype('salarie-smic', 'Salarié·e au SMIC temps plein, seul·e, locataire en ville moyenne',
            statutPro='salarie_prive', revenuTranche='r2', logement='locataire_prive', zone='ville_moyenne', age=30),
    castype('cadre', 'Cadre à 3 800 €/mois, seul·e, propriétaire en grande ville',
            statutPro='salarie_prive', revenuTranche='r5', logement='proprietaire', zone='grande_ville', age=40),
    castype('retraite', 'Retraité·e, pension de 1 750 €/mois, seul·e, propriétaire en zone rurale',
            statutPro='retraite', revenuTranche='r3', logement='proprietaire', zone='rural', age=70),
    castype('parent-isole-locataire', 'Parent isolé au SMIC, 2 enfants, locataire HLM en grande ville',
            statutPro='salarie_prive', revenuTranche='r2', enfants='2', logement='locataire_social',
            zone='grande_ville', age=35),
]


def build_grid(full=False):
    if full:
        raise NotImplementedError('Grille complète : à générer quand les vraies mesures seront collectées.')
    return REFERENCE


# Dimensions du profil qui doivent correspondre exactement ; revenuTranche est choisie au plus proche.
DIMENSIONS_EXACTES = ['statutPro', 'couple', 'revenuConjointTranche', 'enfants', 'logement', 'zone', 'handicapAAH']
DIMENSION_ORDONNEE = 'revenuTranche'

HYPOTHESES_COMMUNES = [
    'Législation {annee} modélisée par OpenFisca-France {version}, à législation constante hors mesure',
    'Situation stable depuis 3 ans (mêmes revenus les années précédentes)',
    'Revenu net mensuel représentatif de la tranche (milieu de tranche ; SMIC net temps plein pour 1 000–1 500 €)',
    'Loyer hors charges supposé selon le logement et le type de commune',
    'Zone APL approximée à partir du type de commune (agglomération parisienne non couverte)',
    'Montants annuels pour l’ensemble du ménage',
    'Aucun effet sur l’emploi, les prix ou les comportements',
]
