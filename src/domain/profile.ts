/**
 * Profil utilisateur : constantes, types et règles, SANS dépendance à Zod (embarqué dans le front).
 * Le schéma Zod (src/schema/profile.ts) est construit à partir de ces constantes.
 */

export const AGE_TRANCHES = ['18-24', '25-34', '35-49', '50-61', '62+'] as const
export const REVENU_TRANCHES = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6'] as const
export const ENFANTS = ['0', '1', '2', '3+'] as const
export const STATUTS_PRO = [
  'etudiant',
  'alternant',
  'salarie_prive',
  'fonctionnaire',
  'independant',
  'demandeur_emploi',
  'retraite',
  'sans_activite',
] as const
export const LOGEMENTS = ['locataire_prive', 'locataire_social', 'proprietaire', 'heberge'] as const
/** Zones des aides au logement (arrêté du 17 mars 1978, révisé le 27 mai 2020). */
export const ZONES_APL = ['zone_1', 'zone_2', 'zone_3'] as const
/** Échelons de bourse sur critères sociaux, dans l'ordre croissant de montant. */
export const ECHELONS = ['0bis', '1', '2', '3', '4', '5', '6', '7'] as const
export const ECHELON_BOURSE = ['non_boursier', ...ECHELONS, 'inconnu'] as const
/** Revenu du ou de la conjoint·e : 4 tranches suffisent (question secondaire, moins précise). */
export const CONJOINT_TRANCHES = ['c0', 'c1', 'c2', 'c3'] as const

export type AgeTranche = (typeof AGE_TRANCHES)[number]
export type RevenuTranche = (typeof REVENU_TRANCHES)[number]
export type StatutPro = (typeof STATUTS_PRO)[number]
export type Logement = (typeof LOGEMENTS)[number]
export type ZoneApl = (typeof ZONES_APL)[number]
export type EchelonBourse = (typeof ECHELON_BOURSE)[number]
export type ConjointTranche = (typeof CONJOINT_TRANCHES)[number]

export interface Profile {
  statutPro: StatutPro
  ageTranche: AgeTranche
  /** Étudiant·e uniquement (null sinon). « inconnu » = boursier·e sans échelon connu. */
  echelonBourse: EchelonBourse | null
  revenuTranche: RevenuTranche
  couple: boolean
  /** Si en couple uniquement (null sinon). */
  revenuConjointTranche: ConjointTranche | null
  enfants: (typeof ENFANTS)[number]
  logement: Logement
  zoneApl: ZoneApl
  handicapAAH: boolean
  vehicule: boolean
}

export const REVENU_LABELS: Record<RevenuTranche, string> = {
  r0: 'Aucun revenu',
  r1: 'Moins de 1 000 € net/mois',
  r2: '1 000 à 1 500 € net/mois',
  r3: '1 500 à 2 000 € net/mois',
  r4: '2 000 à 3 000 € net/mois',
  r5: '3 000 à 5 000 € net/mois',
  r6: 'Plus de 5 000 € net/mois',
}

export const CONJOINT_LABELS: Record<ConjointTranche, string> = {
  c0: 'Aucun revenu',
  c1: 'Moins de 1 500 € net/mois',
  c2: '1 500 à 3 000 € net/mois',
  c3: 'Plus de 3 000 € net/mois',
}

export const ZONE_APL_LABELS: Record<ZoneApl, { titre: string; detail: string }> = {
  zone_1: { titre: 'Paris et sa proche banlieue', detail: 'Par exemple Paris, Boulogne-Billancourt, Saint-Denis, Créteil, Nanterre' },
  zone_2: {
    titre: 'Une grande ville',
    detail: 'Par exemple Lyon, Marseille, Toulouse, Lille, Bordeaux, Nantes, Strasbourg… ou le reste de la région parisienne',
  },
  zone_3: { titre: 'Ailleurs', detail: 'Ville moyenne, petite ville, village, campagne, outre-mer' },
}

// ---------------------------------------------------------------------------
// Règles conditionnelles : valeurs proposées selon le statut. Le questionnaire (étape 5) en découle.
// ---------------------------------------------------------------------------

export const AGES_PAR_STATUT: Record<StatutPro, readonly AgeTranche[]> = {
  etudiant: ['18-24', '25-34'],
  alternant: ['18-24', '25-34'],
  retraite: ['50-61', '62+'],
  salarie_prive: AGE_TRANCHES,
  fonctionnaire: AGE_TRANCHES,
  independant: AGE_TRANCHES,
  demandeur_emploi: AGE_TRANCHES,
  sans_activite: AGE_TRANCHES,
}

/** Tranches proposées selon le statut ; le revenu désigne salaire, pension, allocation chômage ou revenu d'activité. */
export const REVENUS_PAR_STATUT: Record<StatutPro, readonly RevenuTranche[]> = {
  etudiant: ['r0', 'r1', 'r2', 'r3'],
  alternant: ['r1', 'r2', 'r3'],
  salarie_prive: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'],
  fonctionnaire: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'],
  independant: REVENU_TRANCHES,
  demandeur_emploi: ['r0', 'r1', 'r2', 'r3', 'r4'],
  retraite: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'],
  sans_activite: ['r0'],
}

/** Liste des incohérences d'un profil (vide si valide). */
export function profileIssues(p: Profile): string[] {
  const issues: string[] = []
  if (!AGES_PAR_STATUT[p.statutPro].includes(p.ageTranche)) issues.push(`âge ${p.ageTranche} non proposé pour ${p.statutPro}`)
  if (!REVENUS_PAR_STATUT[p.statutPro].includes(p.revenuTranche)) issues.push(`revenu ${p.revenuTranche} non proposé pour ${p.statutPro}`)
  if ((p.statutPro === 'etudiant') !== (p.echelonBourse !== null)) issues.push('echelonBourse renseigné si et seulement si étudiant·e')
  if (p.couple !== (p.revenuConjointTranche !== null)) issues.push('revenuConjointTranche renseigné si et seulement si en couple')
  return issues
}

/** Champs dérivés, calculés à partir du profil (jamais demandés). */
export function derive(p: Profile) {
  return { ...p, parentIsole: p.enfants !== '0' && !p.couple }
}
export type DerivedProfile = ReturnType<typeof derive>

/** Valeurs admises par champ (pour les conditions des effets). Ordre significatif pour gte/lte. */
export const PROFILE_FIELDS = {
  ageTranche: AGE_TRANCHES,
  statutPro: STATUTS_PRO,
  echelonBourse: ECHELON_BOURSE,
  revenuTranche: REVENU_TRANCHES,
  couple: [false, true],
  revenuConjointTranche: CONJOINT_TRANCHES,
  enfants: ENFANTS,
  logement: LOGEMENTS,
  zoneApl: ZONES_APL,
  handicapAAH: [false, true],
  vehicule: [false, true],
  parentIsole: [false, true],
} as const satisfies Record<keyof DerivedProfile, readonly (string | boolean)[]>

export type ProfileField = keyof typeof PROFILE_FIELDS

/** Champs comparables (gte/lte) et leur ordre ; une valeur hors de cet ordre ne satisfait aucune comparaison. */
export const ORDERS: Partial<Record<ProfileField, readonly string[]>> = {
  ageTranche: AGE_TRANCHES,
  revenuTranche: REVENU_TRANCHES,
  revenuConjointTranche: CONJOINT_TRANCHES,
  enfants: ENFANTS,
  echelonBourse: ECHELONS,
}
