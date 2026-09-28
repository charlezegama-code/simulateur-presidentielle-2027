import { z } from 'zod'
import { httpsUrl, isoDate, slug, sourceSchema } from './common'

export const CANDIDATE_STATUTS = ['declare', 'pressenti', 'officiel', 'retire'] as const

export const candidateSchema = z
  .object({
    id: slug,
    prenom: z.string().min(1),
    nom: z.string().min(1),
    parti: z.string().min(1),
    fictif: z.boolean(),
    /** Programme analysé dans cette version (mesures dans measures/<id>.json). Sinon : listé, sans mesures. */
    analyse: z.boolean(),
    statut: z.enum(CANDIDATE_STATUTS),
    statutDate: isoDate,
    statutSourceIds: z.array(slug).min(1),
    historiqueStatut: z.array(
      z.object({ statut: z.enum(CANDIDATE_STATUTS), date: isoDate, sourceIds: z.array(slug).min(1) }).strict(),
    ),
    programme: z.object({ url: httpsUrl, datePublication: isoDate }).strict().nullable(),
    sources: z.array(sourceSchema).min(1),
    /** Précision factuelle affichée telle quelle (ex. procédure en cours, écart entre sources). */
    note: z.string().min(10).max(400).nullable(),
    dateMaj: isoDate,
  })
  .strict()

export type Candidate = z.infer<typeof candidateSchema>

export const candidatesFileSchema = z
  .object({
    dateMaj: isoDate,
    /** Règle objective (hors sondages) déterminant quels programmes sont analysés dans cette version. */
    critereAnalyse: z.string().min(20),
    sources: z.array(sourceSchema),
    candidats: z.array(candidateSchema),
  })
  .strict()

export type CandidatesFile = z.infer<typeof candidatesFileSchema>
