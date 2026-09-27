import { z } from 'zod'
import { isoDate, slug, sourceSchema } from './common'
import { conditionSchema } from './condition'
import { THEMES } from './theme'

const PRESTATIONS = ['rsa', 'apl', 'aah', 'allocations_familiales', 'prime_activite', 'bourse'] as const

/** Paramètres qu'un script OpenFisca (scripts/openfisca) sait traduire en réforme. */
export const parametresSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('smic_pct'), variationPct: z.number() }).strict(),
  z.object({ kind: z.literal('montant_prestation'), prestation: z.enum(PRESTATIONS), variationPct: z.number() }).strict(),
  z.object({ kind: z.literal('taux_csg'), tauxPct: z.number().min(0).max(100) }).strict(),
  z
    .object({
      kind: z.literal('bareme_ir'),
      tranches: z.array(z.object({ seuil: z.number().min(0), tauxPct: z.number().min(0).max(100) }).strict()).min(1),
    })
    .strict(),
  z.object({ kind: z.literal('age_retraite'), age: z.number().min(55).max(70) }).strict(),
])

export const EFFECT_TYPES = ['chiffre', 'qualitatif', 'flou'] as const
export const SENS = ['positif', 'negatif', 'neutre', 'incertain'] as const

export const ampleurSchema = z.discriminatedUnion('kind', [
  // Montant précalculé par OpenFisca pour le cas-type le plus proche du profil.
  z.object({ kind: z.literal('castype') }).strict(),
  // Fourchette issue d'un chiffrage tiers sourcé.
  z
    .object({
      kind: z.literal('fourchette'),
      min: z.number(),
      max: z.number(),
      unite: z.enum(['eur_an', 'eur_mois', 'pct']),
      sourceIds: z.array(slug).min(1),
    })
    .strict()
    .refine((f) => f.min <= f.max, { message: 'min > max' }),
])

export const effectSchema = z
  .object({
    id: slug,
    cible: conditionSchema,
    sens: z.enum(SENS),
    type: z.enum(EFFECT_TYPES),
    libelle: z.string().min(10).max(200),
    ampleur: ampleurSchema.nullable(),
    hypotheses: z.array(z.string().min(5)).min(1),
    perimetreSimulation: z.string().min(10),
    confiance: z.enum(['haute', 'moyenne', 'faible']),
    horizon: z.string().min(2),
    sourceIds: z.array(slug).min(1),
  })
  .strict()
  .superRefine((e, ctx) => {
    if (e.type === 'chiffre' && e.ampleur === null) {
      ctx.addIssue({ code: 'custom', path: ['ampleur'], message: 'effet "chiffre" sans ampleur' })
    }
    if (e.type !== 'chiffre' && e.ampleur !== null) {
      ctx.addIssue({ code: 'custom', path: ['ampleur'], message: `effet "${e.type}" ne doit pas avoir d'ampleur` })
    }
  })

export type Effect = z.infer<typeof effectSchema>

export const financementSchema = z.union([
  z.object({ nonPrecise: z.literal(true) }).strict(),
  z.object({ texte: z.string().min(10).max(400), sourceIds: z.array(slug).min(1) }).strict(),
])

export const measureSchema = z
  .object({
    id: slug,
    candidatId: slug,
    theme: z.enum(THEMES),
    intitule: z.string().min(5).max(120),
    description: z.string().min(10).max(600),
    type: z.enum(['chiffrable', 'qualitatif', 'flou']),
    parametres: parametresSchema.nullable(),
    financement: financementSchema,
    sourceIds: z.array(slug).min(1),
    statut: z.enum(['active', 'modifiee', 'abandonnee']),
    historique: z.array(z.object({ date: isoDate, changement: z.string().min(5), sourceIds: z.array(slug).min(1) }).strict()),
    contradictions: z.array(z.object({ description: z.string().min(10), sourceIds: z.array(slug).min(2) }).strict()),
    effets: z.array(effectSchema),
    dateMaj: isoDate,
  })
  .strict()
  .superRefine((m, ctx) => {
    if (m.type === 'chiffrable' && m.parametres === null) {
      ctx.addIssue({ code: 'custom', path: ['parametres'], message: 'mesure "chiffrable" sans parametres' })
    }
    if (m.type !== 'chiffrable' && m.parametres !== null) {
      ctx.addIssue({ code: 'custom', path: ['parametres'], message: `mesure "${m.type}" ne doit pas avoir de parametres` })
    }
    if (m.type === 'flou' && m.effets.some((e) => e.type === 'chiffre')) {
      ctx.addIssue({ code: 'custom', path: ['effets'], message: 'mesure "flou" avec un effet chiffré' })
    }
    if (m.effets.some((e) => e.ampleur?.kind === 'castype') && m.type !== 'chiffrable') {
      ctx.addIssue({ code: 'custom', path: ['effets'], message: 'ampleur "castype" réservée aux mesures chiffrables' })
    }
  })

export type Measure = z.infer<typeof measureSchema>

export const measuresFileSchema = z
  .object({
    candidatId: slug,
    dateMaj: isoDate,
    sources: z.array(sourceSchema).min(1),
    mesures: z.array(measureSchema),
    // Thèmes pour lesquels aucune position n'a été trouvée : explicite, pour éviter un biais de sélection silencieux.
    sansPosition: z.array(z.object({ theme: z.enum(THEMES), dateRecherche: isoDate }).strict()),
  })
  .strict()

export type MeasuresFile = z.infer<typeof measuresFileSchema>
