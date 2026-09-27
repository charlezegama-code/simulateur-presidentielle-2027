import { z } from 'zod'
import {
  AGE_TRANCHES,
  CONJOINT_TRANCHES,
  ECHELON_BOURSE,
  ENFANTS,
  LOGEMENTS,
  REVENU_TRANCHES,
  STATUTS_PRO,
  ZONES_APL,
  profileIssues,
  type Profile,
} from '../domain/profile'

export * from '../domain/profile'

export const profileSchema = z
  .object({
    statutPro: z.enum(STATUTS_PRO),
    ageTranche: z.enum(AGE_TRANCHES),
    echelonBourse: z.enum(ECHELON_BOURSE).nullable(),
    revenuTranche: z.enum(REVENU_TRANCHES),
    couple: z.boolean(),
    revenuConjointTranche: z.enum(CONJOINT_TRANCHES).nullable(),
    enfants: z.enum(ENFANTS),
    logement: z.enum(LOGEMENTS),
    zoneApl: z.enum(ZONES_APL),
    handicapAAH: z.boolean(),
    vehicule: z.boolean(),
  })
  .strict()
  .superRefine((p, ctx) => {
    for (const message of profileIssues(p)) ctx.addIssue({ code: 'custom', message })
  })

// Garde-fou : le schéma Zod et le type du domaine doivent rester identiques.
type Same<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
export const _profileTypeCheck: Same<z.infer<typeof profileSchema>, Profile> = true
