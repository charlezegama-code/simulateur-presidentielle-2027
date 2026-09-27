import { z } from 'zod'

// Ordres utilisés par les opérateurs gte/lte des conditions.
export const AGE_TRANCHES = ['18-24', '25-34', '35-49', '50-61', '62+'] as const
export const REVENU_TRANCHES = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6'] as const
export const ENFANTS = ['0', '1', '2', '3+'] as const

export const REVENU_LABELS: Record<(typeof REVENU_TRANCHES)[number], string> = {
  r0: 'Aucun revenu d’activité',
  r1: 'Moins de 1 000 € net/mois',
  r2: '1 000 à 1 500 € net/mois',
  r3: '1 500 à 2 000 € net/mois',
  r4: '2 000 à 3 000 € net/mois',
  r5: '3 000 à 5 000 € net/mois',
  r6: 'Plus de 5 000 € net/mois',
}

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
export const ZONES = ['grande_ville', 'ville_moyenne', 'rural'] as const

export const profileSchema = z
  .object({
    ageTranche: z.enum(AGE_TRANCHES),
    statutPro: z.enum(STATUTS_PRO),
    boursier: z.boolean(),
    revenuTranche: z.enum(REVENU_TRANCHES),
    couple: z.boolean(),
    revenuConjointTranche: z.enum(REVENU_TRANCHES).nullable(),
    enfants: z.enum(ENFANTS),
    logement: z.enum(LOGEMENTS),
    zone: z.enum(ZONES),
    handicapAAH: z.boolean(),
    vehicule: z.boolean(),
  })
  .strict()

export type Profile = z.infer<typeof profileSchema>

/** Champs dérivés, calculés à partir du profil (jamais demandés). */
export function derive(p: Profile) {
  return {
    ...p,
    parentIsole: p.enfants !== '0' && !p.couple,
  }
}
export type DerivedProfile = ReturnType<typeof derive>

/** Valeurs admises par champ, dans l'ordre (utilisé par la validation des conditions et par gte/lte). */
export const PROFILE_FIELDS = {
  ageTranche: AGE_TRANCHES,
  statutPro: STATUTS_PRO,
  boursier: [false, true],
  revenuTranche: REVENU_TRANCHES,
  couple: [false, true],
  revenuConjointTranche: REVENU_TRANCHES,
  enfants: ENFANTS,
  logement: LOGEMENTS,
  zone: ZONES,
  handicapAAH: [false, true],
  vehicule: [false, true],
  parentIsole: [false, true],
} as const satisfies Record<keyof DerivedProfile, readonly (string | boolean)[]>

export type ProfileField = keyof typeof PROFILE_FIELDS
export const ORDERED_FIELDS: readonly ProfileField[] = ['ageTranche', 'revenuTranche', 'revenuConjointTranche', 'enfants']
