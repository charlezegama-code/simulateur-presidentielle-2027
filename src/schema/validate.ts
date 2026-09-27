import { z } from 'zod'
import { candidatesFileSchema, type CandidatesFile } from './candidate'
import { measuresFileSchema, type MeasuresFile } from './measure'
import { THEMES } from './theme'
import { findForbiddenWord } from './vocabulary'

export interface RawDataset {
  candidates: unknown
  /** clé = nom de fichier (ex. "candidat-a.json") */
  measures: Record<string, unknown>
}

export interface Dataset {
  candidates: CandidatesFile
  measures: Record<string, MeasuresFile>
}

export interface ValidationOptions {
  /** "prod" refuse tout candidat fictif. */
  mode: 'prod' | 'fixtures'
  /** Date du jour (ISO), injectable pour les tests. */
  today: string
  /** Au-delà, une source consultée est signalée "à revérifier". */
  maxSourceAgeDays?: number
}

export interface ValidationReport {
  errors: string[]
  warnings: string[]
  dataset: Dataset | null
}

function zodErrors(prefix: string, err: z.ZodError): string[] {
  return err.issues.map((i) => `${prefix} › ${i.path.join('.') || '(racine)'} : ${i.message}`)
}

function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000)
}

export function validateDataset(raw: RawDataset, opts: ValidationOptions): ValidationReport {
  const errors: string[] = []
  const warnings: string[] = []
  const maxAge = opts.maxSourceAgeDays ?? 90

  const cands = candidatesFileSchema.safeParse(raw.candidates)
  if (!cands.success) errors.push(...zodErrors('candidates.json', cands.error))

  const measures: Record<string, MeasuresFile> = {}
  for (const [file, content] of Object.entries(raw.measures)) {
    const parsed = measuresFileSchema.safeParse(content)
    if (parsed.success) measures[file] = parsed.data
    else errors.push(...zodErrors(`measures/${file}`, parsed.error))
  }

  if (!cands.success || errors.length > 0) return { errors, warnings, dataset: null }

  const checkDate = (where: string, date: string) => {
    if (date > opts.today) errors.push(`${where} : date ${date} dans le futur`)
  }
  const checkSourceAge = (where: string, dateConsultation: string) => {
    const age = daysBetween(dateConsultation, opts.today)
    if (age > maxAge) warnings.push(`${where} : source consultée il y a ${age} j (> ${maxAge} j), à revérifier`)
  }
  const checkText = (where: string, text: string) => {
    const w = findForbiddenWord(text)
    if (w) errors.push(`${where} : vocabulaire évaluatif interdit « ${w} »`)
  }

  // --- Candidats
  const candidateIds = new Set<string>()
  for (const c of cands.data.candidats) {
    const where = `candidates.json › ${c.id}`
    if (candidateIds.has(c.id)) errors.push(`${where} : id en double`)
    candidateIds.add(c.id)
    if (opts.mode === 'prod' && c.fictif) errors.push(`${where} : candidat fictif interdit dans /data`)
    const srcIds = new Set(c.sources.map((s) => s.id))
    for (const id of [...c.statutSourceIds, ...c.historiqueStatut.flatMap((h) => h.sourceIds)]) {
      if (!srcIds.has(id)) errors.push(`${where} : source "${id}" introuvable`)
    }
    checkDate(`${where} › statutDate`, c.statutDate)
    for (const s of c.sources) {
      checkDate(`${where} › source ${s.id}`, s.dateConsultation)
      checkSourceAge(`${where} › source ${s.id}`, s.dateConsultation)
    }
    const file = `${c.id}.json`
    if (!(file in measures)) errors.push(`${where} : fichier measures/${file} manquant (gabarit incomplet)`)
  }

  // --- Mesures
  const measureIds = new Set<string>()
  for (const [file, mf] of Object.entries(measures)) {
    const whereFile = `measures/${file}`
    if (file !== `${mf.candidatId}.json`) errors.push(`${whereFile} : candidatId "${mf.candidatId}" ne correspond pas au nom du fichier`)
    if (!candidateIds.has(mf.candidatId)) errors.push(`${whereFile} : candidat "${mf.candidatId}" absent de candidates.json`)

    const srcIds = new Set<string>()
    for (const s of mf.sources) {
      if (srcIds.has(s.id)) errors.push(`${whereFile} › source ${s.id} : id en double`)
      srcIds.add(s.id)
      checkDate(`${whereFile} › source ${s.id}`, s.dateConsultation)
      checkSourceAge(`${whereFile} › source ${s.id}`, s.dateConsultation)
    }
    const usedSources = new Set<string>()
    const refSources = (where: string, ids: string[]) => {
      for (const id of ids) {
        usedSources.add(id)
        if (!srcIds.has(id)) errors.push(`${where} : source "${id}" introuvable`)
      }
    }

    const covered = new Set<string>()
    for (const m of mf.mesures) {
      const where = `${whereFile} › ${m.id}`
      if (measureIds.has(m.id)) errors.push(`${where} : id de mesure en double`)
      measureIds.add(m.id)
      if (m.candidatId !== mf.candidatId) errors.push(`${where} : candidatId incohérent`)
      if (m.statut !== 'abandonnee') covered.add(m.theme)
      checkDate(`${where} › dateMaj`, m.dateMaj)
      refSources(where, m.sourceIds)
      if ('sourceIds' in m.financement) refSources(`${where} › financement`, m.financement.sourceIds)
      m.historique.forEach((h, i) => refSources(`${where} › historique[${i}]`, h.sourceIds))
      m.contradictions.forEach((c, i) => refSources(`${where} › contradictions[${i}]`, c.sourceIds))
      checkText(`${where} › intitule`, m.intitule)
      checkText(`${where} › description`, m.description)
      if ('texte' in m.financement) checkText(`${where} › financement`, m.financement.texte)

      const effectIds = new Set<string>()
      for (const e of m.effets) {
        const we = `${where} › effet ${e.id}`
        if (effectIds.has(e.id)) errors.push(`${we} : id d'effet en double`)
        effectIds.add(e.id)
        refSources(we, e.sourceIds)
        if (e.ampleur?.kind === 'fourchette') refSources(`${we} › ampleur`, e.ampleur.sourceIds)
        checkText(`${we} › libelle`, e.libelle)
      }
    }

    for (const s of mf.sources) {
      if (!usedSources.has(s.id)) warnings.push(`${whereFile} › source ${s.id} : jamais référencée`)
    }

    // Couverture : chaque thème a une mesure active OU une entrée "sansPosition" explicite, jamais les deux.
    const sansPosition = new Set(mf.sansPosition.map((s) => s.theme))
    for (const t of THEMES) {
      if (!covered.has(t) && !sansPosition.has(t)) {
        errors.push(`${whereFile} : thème "${t}" ni couvert par une mesure ni déclaré dans sansPosition`)
      }
      if (covered.has(t) && sansPosition.has(t)) {
        errors.push(`${whereFile} : thème "${t}" à la fois couvert et déclaré sans position`)
      }
    }
    for (const s of mf.sansPosition) checkDate(`${whereFile} › sansPosition ${s.theme}`, s.dateRecherche)
  }

  if (cands.data.candidats.length === 0) warnings.push('candidates.json : aucun candidat')

  return { errors, warnings, dataset: errors.length === 0 ? { candidates: cands.data, measures } : null }
}
