import candidates from '../../data/candidates.json'
import meta from '../../data/meta.json'
import { candidatesFileSchema, measuresFileSchema, type CandidatesFile, type MeasuresFile } from '../schema'

// Les données sont validées en prebuild ; le parse ici garantit les types à l'exécution (et en dev).
const measureModules = import.meta.glob<{ default: unknown }>('../../data/measures/*.json', { eager: true })

export const data: { meta: typeof meta; candidates: CandidatesFile; measures: MeasuresFile[] } = {
  meta,
  candidates: candidatesFileSchema.parse(candidates),
  measures: Object.values(measureModules).map((m) => measuresFileSchema.parse(m.default)),
}
