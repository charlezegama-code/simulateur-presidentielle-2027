import { THEMES, type Theme } from '../domain/theme'
import type { Measure, MeasuresFile } from '../schema/measure'
import type { Dataset } from '../schema/validate'

export type ThemeCell = { kind: 'mesures'; mesures: Measure[] } | { kind: 'sansPosition'; dateRecherche: string }

/** Tableau candidats × thèmes (toutes les mesures actives, indépendamment du profil). */
export function compareByTheme(dataset: Dataset): Map<string, Record<Theme, ThemeCell>> {
  const out = new Map<string, Record<Theme, ThemeCell>>()
  for (const c of dataset.candidates.candidats.filter((c) => c.analyse)) {
    const mf = dataset.measures[`${c.id}.json`]
    const row = {} as Record<Theme, ThemeCell>
    for (const t of THEMES) {
      const mesures = mf.mesures.filter((m) => m.theme === t && m.statut !== 'abandonnee')
      const sp = mf.sansPosition.find((s) => s.theme === t)
      row[t] = mesures.length > 0 ? { kind: 'mesures', mesures } : { kind: 'sansPosition', dateRecherche: sp!.dateRecherche }
    }
    out.set(c.id, row)
  }
  return out
}

/** Part d'effets chiffrés (type "chiffre") par candidat, sur l'ensemble des effets des mesures non abandonnées. */
export function partChiffree(measures: Record<string, MeasuresFile>): Record<string, number> {
  const out: Record<string, number> = {}
  for (const mf of Object.values(measures)) {
    const effets = mf.mesures.filter((m) => m.statut !== 'abandonnee').flatMap((m) => m.effets)
    out[mf.candidatId] = effets.length === 0 ? 0 : effets.filter((e) => e.type === 'chiffre').length / effets.length
  }
  return out
}

/** Écart (0–1) de part d'effets chiffrés entre les candidats analysés. */
export function ecartChiffrage(measures: Record<string, MeasuresFile>): number {
  const parts = Object.values(partChiffree(measures))
  return parts.length < 2 ? 0 : Math.max(...parts) - Math.min(...parts)
}
