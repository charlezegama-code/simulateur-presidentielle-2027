import { z } from 'zod'
import { ORDERED_FIELDS, PROFILE_FIELDS, type ProfileField } from './profile'

const FIELD_NAMES = Object.keys(PROFILE_FIELDS) as [ProfileField, ...ProfileField[]]
const scalar = z.union([z.string(), z.boolean()])

export const predicateSchema = z
  .object({
    champ: z.enum(FIELD_NAMES),
    op: z.enum(['eq', 'neq', 'in', 'gte', 'lte']),
    valeur: z.union([scalar, z.array(scalar).min(1)]),
  })
  .strict()
  .superRefine((p, ctx) => {
    const allowed: readonly (string | boolean)[] = PROFILE_FIELDS[p.champ]
    const values = Array.isArray(p.valeur) ? p.valeur : [p.valeur]
    if ((p.op === 'in') !== Array.isArray(p.valeur)) {
      ctx.addIssue({ code: 'custom', message: `op "${p.op}" : valeur ${p.op === 'in' ? 'tableau' : 'scalaire'} attendue` })
    }
    if ((p.op === 'gte' || p.op === 'lte') && !ORDERED_FIELDS.includes(p.champ)) {
      ctx.addIssue({ code: 'custom', message: `op "${p.op}" interdit sur le champ non ordonné "${p.champ}"` })
    }
    for (const v of values) {
      if (!allowed.includes(v)) {
        ctx.addIssue({ code: 'custom', message: `valeur "${String(v)}" invalide pour "${p.champ}"` })
      }
    }
  })

export type Predicate = z.infer<typeof predicateSchema>

// Exactement une clé parmi all / any / tous (objet unique plutôt qu'une union : messages d'erreur plus lisibles).
export const conditionSchema = z
  .object({
    all: z.array(predicateSchema).min(1).optional(),
    any: z.array(predicateSchema).min(1).optional(),
    tous: z.literal(true).optional(), // effet qui concerne tous les profils
  })
  .strict()
  .refine((c) => [c.all, c.any, c.tous].filter((x) => x !== undefined).length === 1, {
    message: 'condition : exactement une clé parmi "all", "any", "tous"',
  })

export type Condition = z.infer<typeof conditionSchema>
