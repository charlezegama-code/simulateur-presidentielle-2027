/**
 * Chargement des données côté navigateur, sans Zod : tout est validé au build (npm run validate-data),
 * le front reçoit du JSON déjà conforme aux types.
 */
import candidatesJson from '../../data/candidates.json'
import metaJson from '../../data/meta.json'
import type { CandidatesFile } from '../schema/candidate'
import type { BaselineFile, BourseFile, CandidateCastypesFile, GridFile } from '../schema/castype'
import type { ConsoFile } from '../schema/conso'
import type { MeasuresFile } from '../schema/measure'
import type { Dataset } from '../schema/validate'

const measureModules = import.meta.glob<{ default: unknown }>('../../data/measures/*.json', { eager: true })

export const candidates = candidatesJson as unknown as CandidatesFile
export const meta = metaJson as { versionDonnees: string; dateMaj: string }
export const measures: Record<string, MeasuresFile> = Object.fromEntries(
  Object.entries(measureModules).map(([path, m]) => [path.split('/').pop()!, m.default as MeasuresFile]),
)

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(path)
  if (!res.ok) throw new Error(`${path} : ${res.status}`)
  return (await res.json()) as T
}

let cache: Promise<Dataset> | null = null

/** Charge le précalcul (mêmes fichiers pour tous les visiteurs, aucune donnée du profil dans la requête). */
export function loadDataset(): Promise<Dataset> {
  cache ??= (async () => {
    const analysed = candidates.candidats.filter((c) => c.analyse)
    const [grid, baseline, bourse, conso, ...perCandidate] = await Promise.all([
      getJson<GridFile>('/data/castypes/grid.json'),
      getJson<BaselineFile>('/data/castypes/baseline.json'),
      getJson<BourseFile>('/data/castypes/bourse.json'),
      getJson<ConsoFile>('/data/conso/bdf2017.json'),
      ...analysed.map((c) => getJson<CandidateCastypesFile>(`/data/castypes/${c.id}.json`).catch(() => null)),
    ])
    const byCandidate: Record<string, CandidateCastypesFile> = {}
    perCandidate.forEach((f) => {
      if (f) byCandidate[f.candidatId] = f
    })
    return { candidates, measures, castypes: { grid, baseline, bourse, candidats: byCandidate }, conso }
  })()
  return cache
}
