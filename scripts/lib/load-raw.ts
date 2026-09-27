import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { RawDataset } from '../../src/schema/validate'

/** Lit candidates.json et measures/*.json d'un dossier de données (sans valider). */
export function loadRaw(dir: string): RawDataset {
  const readJson = (p: string): unknown => {
    try {
      return JSON.parse(readFileSync(p, 'utf8'))
    } catch (e) {
      throw new Error(`${p} : JSON illisible (${(e as Error).message})`)
    }
  }
  const measuresDir = join(dir, 'measures')
  const measures: Record<string, unknown> = {}
  if (existsSync(measuresDir)) {
    for (const f of readdirSync(measuresDir).filter((f) => f.endsWith('.json')).sort()) {
      measures[f] = readJson(join(measuresDir, f))
    }
  }
  const castypesDir = join(dir, 'castypes')
  let castypes: RawDataset['castypes'] = null
  if (existsSync(join(castypesDir, 'grid.json'))) {
    const candidats: Record<string, unknown> = {}
    for (const f of readdirSync(castypesDir).filter((f) => f.endsWith('.json')).sort()) {
      if (!['grid.json', 'baseline.json', 'bourse.json'].includes(f)) candidats[f] = readJson(join(castypesDir, f))
    }
    castypes = {
      grid: readJson(join(castypesDir, 'grid.json')),
      baseline: readJson(join(castypesDir, 'baseline.json')),
      bourse: readJson(join(castypesDir, 'bourse.json')),
      candidats,
    }
  }
  // Données statistiques publiques (INSEE), partagées : repli sur data/conso pour les fixtures.
  const consoFile = [join(dir, 'conso', 'bdf2017.json'), join('data', 'conso', 'bdf2017.json')].find((f) => existsSync(f))
  const conso = consoFile ? readJson(consoFile) : null
  return { candidates: readJson(join(dir, 'candidates.json')), measures, castypes, conso }
}
