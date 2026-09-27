import { z } from 'zod'

export const isoDate = z.iso.date({ message: 'date ISO attendue (AAAA-MM-JJ)' })

export const httpsUrl = z
  .url({ protocol: /^https$/, message: 'URL https valide attendue' })

export const slug = z
  .string()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'identifiant en minuscules-avec-tirets attendu')

export const SOURCE_TYPES = ['programme', 'declaration', 'chiffrage_tiers'] as const

export const sourceSchema = z
  .object({
    id: slug,
    url: httpsUrl,
    titre: z.string().min(3),
    editeur: z.string().min(2),
    datePublication: isoDate,
    dateConsultation: isoDate,
    type: z.enum(SOURCE_TYPES),
    archiveUrl: httpsUrl.nullable(),
  })
  .strict()
  .refine((s) => s.dateConsultation >= s.datePublication, {
    message: 'dateConsultation antérieure à datePublication',
    path: ['dateConsultation'],
  })

export type Source = z.infer<typeof sourceSchema>
