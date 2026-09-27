import { z } from 'zod'
import { ECHELONS } from '../domain/profile'
import { isoDate, slug, sourceSchema } from './common'
import { parametresSchema } from './measure'

const meta = {
  openfiscaFrance: z.string().min(1),
  legislation: z.string().regex(/^\d{4}$/),
  genereLe: isoDate,
  /** Empreinte de la grille (src/domain/grid.ts) utilisée pour le calcul. */
  gridHash: z.string().regex(/^[0-9a-f]{8}$/),
  nCells: z.number().int().positive(),
}

/** Valeur par case, dans l'ordre d'enumerateCells() ; null = case non simulable (ex. micro-entrepreneur·e). */
const parCase = z.array(z.number().int().nullable())

export const gridFileSchema = z
  .object({
    ...meta,
    hypothesesCommunes: z.array(z.string().min(5)).min(1),
    smicNetMensuel: z.number(),
    statutsNonSimules: z.array(z.string()),
    revenusNetsMensuels: z.record(z.string(), z.number()),
    conjointsNetsMensuels: z.record(z.string(), z.number()),
    sources: z.array(sourceSchema),
  })
  .strict()

export const baselineFileSchema = z.object({ ...meta, revenuDisponible: parCase }).strict()

export const bourseFileSchema = z
  .object({ ...meta, montantsAnnuels: z.record(z.enum(ECHELONS), z.number()) })
  .strict()

export const castypeMeasureSchema = z.union([
  z.object({ parametres: parametresSchema, total: parCase, detail: z.record(z.string(), parCase) }).strict(),
  z.object({ parametres: parametresSchema, parEchelon: z.record(z.enum(ECHELONS), z.number()) }).strict(),
])

export const candidateCastypesFileSchema = z
  .object({
    ...meta,
    candidatId: slug,
    libellesDetail: z.record(z.string(), z.string()),
    mesures: z.record(slug, castypeMeasureSchema),
  })
  .strict()

export type GridFile = z.infer<typeof gridFileSchema>
export type BaselineFile = z.infer<typeof baselineFileSchema>
export type BourseFile = z.infer<typeof bourseFileSchema>
export type CandidateCastypesFile = z.infer<typeof candidateCastypesFileSchema>
