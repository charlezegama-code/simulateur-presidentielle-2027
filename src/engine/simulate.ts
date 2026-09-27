import type { Candidate } from '../schema/candidate'
import type { Source } from '../schema/common'
import type { Effect, Measure } from '../schema/measure'
import { derive, type Profile } from '../schema/profile'
import { THEMES, type Theme } from '../schema/theme'
import type { Dataset } from '../schema/validate'
import { findCastype } from './castype'
import { matches } from './condition'

/** Nombre maximal d'effets affichés par sens, identique pour tous les candidats (« voir tout » au-delà). */
export const MAX_ITEMS_PAR_SENS = 5

export type Montant =
  | {
      kind: 'castype'
      /** Variation annuelle du revenu disponible du ménage, en euros. */
      annuel: number
      detail: { libelle: string; montant: number }[]
      castype: { id: string; libelle: string; approche: boolean }
      hypothesesCommunes: string[]
      openfisca: { version: string; legislation: string }
    }
  | { kind: 'fourchette'; min: number; max: number; unite: 'eur_an' | 'eur_mois' | 'pct'; sources: Source[] }

export type Financement = { nonPrecise: true } | { texte: string; sources: Source[] }

export interface EffectView {
  effetId: string
  mesureId: string
  theme: Theme
  intituleMesure: string
  libelle: string
  /** Type affiché : un effet "chiffre" sans cas-type compatible devient "qualitatif". */
  type: Effect['type']
  sens: Effect['sens']
  /** Sens déclaré dans les données, s'il diffère du sens calculé. */
  sensDeclare: Effect['sens'] | null
  montant: Montant | null
  /** Raison pour laquelle un effet prévu comme chiffré ne l'est pas pour ce profil. */
  nonChiffreCar: string | null
  hypotheses: string[]
  perimetreSimulation: string
  confiance: Effect['confiance']
  horizon: string
  sources: Source[]
  financement: Financement
}

export interface MeasureRef {
  mesureId: string
  theme: Theme
  intitule: string
  type: Measure['type']
  sources: Source[]
}

export interface CandidateResult {
  candidat: Candidate
  positifs: EffectView[]
  negatifs: EffectView[]
  /** Effets neutres ou au sens incertain. */
  autres: EffectView[]
  /** Mesures du programme sans effet identifié pour ce profil (« ce programme prévoit aussi… »). */
  autresMesures: MeasureRef[]
  compteurs: { chiffre: number; qualitatif: number; flou: number }
}

const CONFIANCE_RANG = { haute: 0, moyenne: 1, faible: 2 } as const
const TYPE_RANG = { chiffre: 0, qualitatif: 1, flou: 2 } as const

/** Ampleur annuelle en euros pour le tri, ou null si non comparable (pourcentage, non chiffré). */
function ampleurEuros(v: EffectView): number | null {
  const m = v.montant
  if (!m) return null
  if (m.kind === 'castype') return Math.abs(m.annuel)
  if (m.unite === 'pct') return null
  const k = m.unite === 'eur_mois' ? 12 : 1
  return Math.max(Math.abs(m.min), Math.abs(m.max)) * k
}

/** Tri : chiffrés par ampleur décroissante, puis qualitatifs par confiance, puis flous ; id en dernier recours. */
export function compareEffects(a: EffectView, b: EffectView): number {
  const ea = ampleurEuros(a)
  const eb = ampleurEuros(b)
  if (ea !== null && eb !== null && ea !== eb) return eb - ea
  if ((ea === null) !== (eb === null)) return ea === null ? 1 : -1
  if (a.type !== b.type) return TYPE_RANG[a.type] - TYPE_RANG[b.type]
  if (a.confiance !== b.confiance) return CONFIANCE_RANG[a.confiance] - CONFIANCE_RANG[b.confiance]
  return a.effetId < b.effetId ? -1 : a.effetId > b.effetId ? 1 : 0
}

function sensFromMontant(annuel: number): Effect['sens'] {
  return annuel > 0 ? 'positif' : annuel < 0 ? 'negatif' : 'neutre'
}

export function simulate(profile: Profile, dataset: Dataset): CandidateResult[] {
  const derived = derive(profile)
  const castypeMatch = dataset.castypes ? findCastype(profile, dataset.castypes.grid) : null

  return dataset.candidates.candidats.map((candidat) => {
    const mf = dataset.measures[`${candidat.id}.json`]
    const sourceById = new Map(mf.sources.map((s) => [s.id, s]))
    const resolve = (ids: string[]) => ids.map((id) => sourceById.get(id)!)
    const precalc = dataset.castypes?.candidats[candidat.id]

    const views: EffectView[] = []
    const autresMesures: MeasureRef[] = []

    for (const m of mf.mesures) {
      if (m.statut === 'abandonnee') continue
      const financement: Financement =
        'nonPrecise' in m.financement ? { nonPrecise: true } : { texte: m.financement.texte, sources: resolve(m.financement.sourceIds) }

      const matched = m.effets.filter((e) => matches(e.cible, derived))
      if (matched.length === 0) {
        autresMesures.push({ mesureId: m.id, theme: m.theme, intitule: m.intitule, type: m.type, sources: resolve(m.sourceIds) })
        continue
      }

      for (const e of matched) {
        const view: EffectView = {
          effetId: e.id,
          mesureId: m.id,
          theme: m.theme,
          intituleMesure: m.intitule,
          libelle: e.libelle,
          type: e.type,
          sens: e.sens,
          sensDeclare: null,
          montant: null,
          nonChiffreCar: null,
          hypotheses: e.hypotheses,
          perimetreSimulation: e.perimetreSimulation,
          confiance: e.confiance,
          horizon: e.horizon,
          sources: resolve(e.sourceIds),
          financement,
        }

        if (e.ampleur?.kind === 'fourchette') {
          view.montant = { kind: 'fourchette', min: e.ampleur.min, max: e.ampleur.max, unite: e.ampleur.unite, sources: resolve(e.ampleur.sourceIds) }
        } else if (e.ampleur?.kind === 'castype') {
          const delta = castypeMatch && precalc?.mesures[m.id]?.parCastype[castypeMatch.castype.id]
          if (!castypeMatch || !delta || !dataset.castypes) {
            view.type = 'qualitatif'
            view.nonChiffreCar = 'Aucun cas-type proche de ton profil : effet non chiffré.'
          } else {
            const grid = dataset.castypes.grid
            view.montant = {
              kind: 'castype',
              annuel: delta.total,
              detail: Object.entries(delta.detail).map(([k, montant]) => ({ libelle: precalc!.libellesDetail[k] ?? k, montant })),
              castype: { id: castypeMatch.castype.id, libelle: castypeMatch.castype.libelle, approche: castypeMatch.approche },
              hypothesesCommunes: grid.hypothesesCommunes,
              openfisca: { version: grid.openfiscaFrance, legislation: grid.legislation },
            }
            // Le sens affiché est celui du calcul ; l'écart avec le sens déclaré reste visible.
            const computed = sensFromMontant(delta.total)
            if (computed !== e.sens) {
              view.sensDeclare = e.sens
              view.sens = computed
            }
          }
        }
        views.push(view)
      }
    }

    views.sort(compareEffects)
    // Ordre fixe des thèmes (THEMES), puis id : identique pour tous les candidats.
    autresMesures.sort((a, b) => THEMES.indexOf(a.theme) - THEMES.indexOf(b.theme) || (a.mesureId < b.mesureId ? -1 : 1))

    return {
      candidat,
      positifs: views.filter((v) => v.sens === 'positif'),
      negatifs: views.filter((v) => v.sens === 'negatif'),
      autres: views.filter((v) => v.sens === 'neutre' || v.sens === 'incertain'),
      autresMesures,
      compteurs: {
        chiffre: views.filter((v) => v.type === 'chiffre').length,
        qualitatif: views.filter((v) => v.type === 'qualitatif').length,
        flou: views.filter((v) => v.type === 'flou').length,
      },
    }
  })
}
