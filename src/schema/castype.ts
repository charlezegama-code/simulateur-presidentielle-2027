import { z } from 'zod'
import { isoDate, slug } from './common'
import { parametresSchema } from './measure'
import { PROFILE_FIELDS, REVENU_TRANCHES, profileSchema, type ProfileField } from './profile'

const FIELD_NAMES = Object.keys(PROFILE_FIELDS) as [ProfileField, ...ProfileField[]]

const generation = {
  openfiscaFrance: z.string().min(1),
  legislation: z.string().regex(/^\d{4}$/),
  genereLe: isoDate,
}

export const castypeSchema = z
  .object({
    id: slug,
    libelle: z.string().min(5),
    profil: profileSchema.pick({
      statutPro: true,
      revenuTranche: true,
      couple: true,
      revenuConjointTranche: true,
      enfants: true,
      logement: true,
      zone: true,
      handicapAAH: true,
      boursier: true,
    }),
    valeurs: z.record(z.string(), z.unknown()),
  })
  .strict()

export type Castype = z.infer<typeof castypeSchema>

export const gridFileSchema = z
  .object({
    ...generation,
    dimensionsExactes: z.array(z.enum(FIELD_NAMES)),
    dimensionOrdonnee: z.literal('revenuTranche'),
    hypothesesCommunes: z.array(z.string().min(5)).min(1),
    castypes: z.array(castypeSchema),
  })
  .strict()

export type GridFile = z.infer<typeof gridFileSchema>

export const baselineFileSchema = z
  .object({ ...generation, resultats: z.record(slug, z.record(z.string(), z.number())) })
  .strict()

export const candidateCastypesFileSchema = z
  .object({
    ...generation,
    candidatId: slug,
    libellesDetail: z.record(z.string(), z.string()),
    mesures: z.record(
      slug,
      z
        .object({
          // Copie des paramètres utilisés au calcul : permet de détecter un précalcul obsolète.
          parametres: parametresSchema,
          parCastype: z.record(
            slug,
            z.object({ total: z.number(), detail: z.record(z.string(), z.number()) }).strict(),
          ),
        })
        .strict(),
    ),
  })
  .strict()

export type CandidateCastypesFile = z.infer<typeof candidateCastypesFileSchema>

export { REVENU_TRANCHES }
