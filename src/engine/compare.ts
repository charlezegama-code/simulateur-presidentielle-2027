import { THEMES, type Theme } from '../domain/theme'
import type { Measure } from '../schema/measure'
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
