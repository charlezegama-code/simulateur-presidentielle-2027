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
      if (f !== 'grid.json' && f !== 'baseline.json') candidats[f] = readJson(join(castypesDir, f))
    }
    castypes = {
      grid: readJson(join(castypesDir, 'grid.json')),
      baseline: readJson(join(castypesDir, 'baseline.json')),
      candidats,
    }
  }
  return { candidates: readJson(join(dir, 'candidates.json')), measures, castypes }
}
