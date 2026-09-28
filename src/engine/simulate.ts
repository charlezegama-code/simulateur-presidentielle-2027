import { cellIndex, cellOf, type Cell } from '../domain/grid'
import { derive, type Profile } from '../domain/profile'
import { THEMES, type Theme } from '../domain/theme'
import type { Candidate } from '../schema/candidate'
import type { Source } from '../schema/common'
import type { Effect, Measure } from '../schema/measure'
import type { Dataset } from '../schema/validate'
import { matches } from './condition'
import { estimateConso } from './conso'
import { perimetreStandard } from './perimetre'

/** Nombre maximal d'effets affichés par sens, identique pour tous les candidats (« voir tout » au-delà). */
export const MAX_ITEMS_PAR_SENS = 5

export type Montant =
  | {
      kind: 'castype'
      /** Variation annuelle du revenu disponible du foyer, en euros. */
      annuel: number
      detail: { libelle: string; montant: number }[]
      hypothesesCommunes: string[]
      openfisca: { version: string; legislation: string }
    }
  | { kind: 'bourse'; annuel: number; echelon: string }
  | {
      kind: 'consommation'
      annuel: number
      decile: number
      typeMenage: string
      depense: number
      revenuApproche: boolean
      sources: Source[]
    }
  | { kind: 'fourchette'; min: number; max: number; unite: 'eur_an' | 'eur_mois' | 'pct'; sources: Source[] }

export type Financement = { nonPrecise: true } | { texte: string; sources: Source[] }

export interface EffectView {
  effetId: string
  mesureId: string
  theme: Theme
  intituleMesure: string
  libelle: string
  /** Type affiché : un effet "chiffre" non calculable pour ce profil devient "qualitatif". */
  type: Effect['type']
  sens: Effect['sens']
  /** Sens déclaré dans les données, s'il diffère du sens calculé. */
  sensDeclare: Effect['sens'] | null
  montant: Montant | null
  /** Raison pour laquelle un effet prévu comme chiffré ne l'est pas pour ce profil. */
  nonChiffreCar: string | null
  hypotheses: string[]
  /** Périmètre propre à l'effet + mentions standard communes à toutes les mesures de la même famille. */
  perimetre: string[]
  confiance: Effect['confiance']
  horizon: string
  sources: Source[]
  financement: Financement
  statutMesure: Measure['statut']
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
  if (m.kind !== 'fourchette') return Math.abs(m.annuel)
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

export interface ProfileContext {
  cell: Cell
  index: number
  /** Revenu disponible annuel du foyer (législation actuelle, bourse comprise) ; null si statut non simulé. */
  revenuDisponible: number | null
  /** Revenu utilisé pour situer le foyer dans les déciles (repli sur les revenus d'activité si non simulé). */
  revenuPourDecile: number
  revenuApproche: boolean
}

export function profileContext(profile: Profile, dataset: Dataset): ProfileContext {
  const cell = cellOf(profile)
  const index = cellIndex(profile)
  const ct = dataset.castypes
  const bourse =
    ct && profile.echelonBourse && profile.echelonBourse !== 'non_boursier' && profile.echelonBourse !== 'inconnu'
      ? (ct.bourse.montantsAnnuels[profile.echelonBourse] ?? 0)
      : 0
  const rd = ct?.baseline.revenuDisponible[index] ?? null
  const revenuDisponible = rd === null ? null : rd + bourse
  let revenuPourDecile = revenuDisponible ?? 0
  let revenuApproche = false
  if (revenuDisponible === null && ct) {
    const nets = ct.grid.revenusNetsMensuels
    revenuPourDecile = 12 * ((nets[profile.revenuTranche] ?? 0) + (profile.revenuConjointTranche ? (ct.grid.conjointsNetsMensuels[profile.revenuConjointTranche] ?? 0) : 0))
    revenuApproche = true
  }
  return { cell, index, revenuDisponible, revenuPourDecile, revenuApproche }
}

export function simulate(profile: Profile, dataset: Dataset): CandidateResult[] {
  const derived = derive(profile)
  const ctx = dataset.castypes ? profileContext(profile, dataset) : null
  const statutNonSimule = dataset.castypes?.grid.statutsNonSimules.includes(profile.statutPro) ?? false

  return dataset.candidates.candidats
    .filter((c) => c.analyse)
    .map((candidat) => {
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
            perimetre: [e.perimetreSimulation, ...perimetreStandard(m.theme, m.parametres)],
            confiance: e.confiance,
            horizon: e.horizon,
            sources: resolve(e.sourceIds),
            financement,
            statutMesure: m.statut,
          }
          const nonChiffre = (raison: string) => {
            view.type = 'qualitatif'
            view.nonChiffreCar = raison
          }
          const setMontant = (montant: Montant & { annuel: number }) => {
            view.montant = montant
            // Le sens affiché est celui du calcul ; l'écart avec le sens déclaré reste visible.
            const computed = sensFromMontant(montant.annuel)
            if (computed !== e.sens) {
              view.sensDeclare = e.sens
              view.sens = computed
            }
          }

          if (view.type !== 'chiffre' && !view.nonChiffreCar) {
            view.nonChiffreCar =
              view.type === 'flou'
                ? "Le candidat n'a pas donné assez de détails (montant, taux, barème...) pour dire précisément ce que ça changerait pour toi."
                : "Cet effet est réel, mais rien ne permet de le traduire en euros avec ce que le candidat a publié."
          }
          if (e.ampleur?.kind === 'fourchette') {
            view.montant = { kind: 'fourchette', min: e.ampleur.min, max: e.ampleur.max, unite: e.ampleur.unite, sources: resolve(e.ampleur.sourceIds) }
          } else if (e.ampleur?.kind === 'castype') {
            const pre = precalc?.mesures[m.id]
            if (!ctx || !pre || !dataset.castypes) {
              nonChiffre('Calcul non disponible pour cette mesure.')
            } else if ('parEchelon' in pre) {
              const ech = profile.echelonBourse
              if (!ech || ech === 'non_boursier') nonChiffre('Tu n’as pas indiqué d’échelon de bourse.')
              else if (ech === 'inconnu') nonChiffre('Comme tu ne connais pas ton échelon de bourse, on ne peut pas calculer ce montant précisément.')
              else setMontant({ kind: 'bourse', annuel: pre.parEchelon[ech] ?? 0, echelon: ech })
            } else {
              const total = pre.total[ctx.index]
              if (total === null || statutNonSimule) {
                nonChiffre('On ne sait pas encore calculer ce montant de façon fiable pour ton profil (souvent le cas pour les indépendant·es) : cet effet reste non chiffré.')
              } else {
                const grid = dataset.castypes.grid
                setMontant({
                  kind: 'castype',
                  annuel: total,
                  detail: Object.entries(pre.detail)
                    .map(([k, arr]) => ({ libelle: precalc!.libellesDetail[k] ?? k, montant: arr[ctx.index] ?? 0 }))
                    .filter((d) => d.montant !== 0),
                  hypothesesCommunes: grid.hypothesesCommunes,
                  openfisca: { version: grid.openfiscaFrance, legislation: grid.legislation },
                })
              }
            }
          } else if (e.ampleur?.kind === 'consommation') {
            const p = m.parametres
            if (!ctx || !dataset.conso || !p || (p.kind !== 'conso_tva' && p.kind !== 'conso_prix')) {
              nonChiffre('On ne peut pas estimer ce montant pour ton profil.')
            } else {
              const est = estimateConso(p, ctx.cell, profile.vehicule, ctx.revenuPourDecile, dataset.conso)
              setMontant({ kind: 'consommation', ...est, revenuApproche: ctx.revenuApproche, sources: dataset.conso.sources })
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
