import { z } from 'zod'
import { sourceSchema } from './common'

/** Données de consommation INSEE (scripts/conso/build_bdf.py). */
export const consoFileSchema = z
  .object({
    genereLe: z.iso.date(),
    annee: z.literal(2017),
    decilesNiveauDeVie2017: z.array(z.number()).length(9),
    ipc: z.object({ serie: z.string(), moyenne2017: z.number(), moyenne2025: z.number() }).strict(),
    typesMenage: z.record(z.string(), z.string()),
    depensesParDecile: z.record(z.string(), z.array(z.number().nullable()).length(10)),
    ratiosTypeMenage: z.record(z.string(), z.record(z.string(), z.number().nullable())),
    sources: z.array(sourceSchema).min(1),
  })
  .strict()

export type ConsoFile = z.infer<typeof consoFileSchema>
