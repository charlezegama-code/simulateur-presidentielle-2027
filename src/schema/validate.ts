import { z } from 'zod'
import { enumerateCells, gridHash } from '../domain/grid'
import { THEMES } from '../domain/theme'
import { candidatesFileSchema, type CandidatesFile } from './candidate'
import {
  baselineFileSchema,
  bourseFileSchema,
  candidateCastypesFileSchema,
  gridFileSchema,
  type BaselineFile,
  type BourseFile,
  type CandidateCastypesFile,
  type GridFile,
} from './castype'
import { consoFileSchema, type ConsoFile } from './conso'
import { measuresFileSchema, type MeasuresFile } from './measure'
import { findForbiddenWord } from './vocabulary'
import { partChiffree } from '../engine/compare'

export { partChiffree }

export interface RawDataset {
  candidates: unknown
  /** clé = nom de fichier (ex. "candidat-a.json") */
  measures: Record<string, unknown>
  /** Contenu de castypes/ (absent tant qu'OpenFisca n'a pas tourné). */
  castypes: { grid: unknown; baseline: unknown; bourse: unknown; candidats: Record<string, unknown> } | null
  /** data/conso/bdf2017.json */
  conso: unknown
}

export interface CastypesData {
  grid: GridFile
  baseline: BaselineFile
  bourse: BourseFile
  candidats: Record<string, CandidateCastypesFile>
}

export interface Dataset {
  candidates: CandidatesFile
  measures: Record<string, MeasuresFile>
  castypes: CastypesData | null
  conso: ConsoFile | null
}

export interface ValidationOptions {
  /** "prod" refuse tout candidat fictif. */
  mode: 'prod' | 'fixtures'
  /** Date du jour (ISO), injectable pour les tests. */
  today: string
  /** Au-delà, une source consultée est signalée "à revérifier". */
  maxSourceAgeDays?: number
  /** Écart maximal de part d'effets chiffrés entre candidats avant avertissement (0–1). */
  maxEcartChiffrage?: number
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

  let conso: ConsoFile | null = null
  if (raw.conso) {
    const parsed = consoFileSchema.safeParse(raw.conso)
    if (parsed.success) conso = parsed.data
    else errors.push(...zodErrors('conso/bdf2017.json', parsed.error))
  }

  let castypes: CastypesData | null = null
  if (raw.castypes) {
    const grid = gridFileSchema.safeParse(raw.castypes.grid)
    const baseline = baselineFileSchema.safeParse(raw.castypes.baseline)
    const bourse = bourseFileSchema.safeParse(raw.castypes.bourse)
    if (!grid.success) errors.push(...zodErrors('castypes/grid.json', grid.error))
    if (!baseline.success) errors.push(...zodErrors('castypes/baseline.json', baseline.error))
    if (!bourse.success) errors.push(...zodErrors('castypes/bourse.json', bourse.error))
    const byCandidate: Record<string, CandidateCastypesFile> = {}
    for (const [file, content] of Object.entries(raw.castypes.candidats)) {
      const parsed = candidateCastypesFileSchema.safeParse(content)
      if (parsed.success) byCandidate[parsed.data.candidatId] = parsed.data
      else errors.push(...zodErrors(`castypes/${file}`, parsed.error))
    }
    if (grid.success && baseline.success && bourse.success) {
      castypes = { grid: grid.data, baseline: baseline.data, bourse: bourse.data, candidats: byCandidate }
      // Le précalcul doit porter sur exactement la grille du questionnaire actuel.
      const cells = enumerateCells()
      const hash = gridHash(cells)
      for (const [name, f] of [['grid.json', grid.data], ['baseline.json', baseline.data], ...Object.entries(byCandidate)] as const) {
        if (f.gridHash !== hash || f.nCells !== cells.length) {
          errors.push(`castypes/${name} : calculé sur une autre grille (${f.gridHash}/${f.nCells} ≠ ${hash}/${cells.length}), relancer export-grid puis run.py`)
        }
      }
      if (baseline.data.revenuDisponible.length !== cells.length) errors.push('castypes/baseline.json : longueur ≠ nombre de cases')
    }
  }

  if (!cands.success || errors.length > 0) return { errors, warnings, dataset: null }

  // Seules les dates de publication et de consultation ne peuvent pas être futures
  // (une date d'application d'une mesure ou un horizon peuvent l'être).
  const checkNotFuture = (where: string, date: string) => {
    if (date > opts.today) errors.push(`${where} : date ${date} dans le futur`)
  }
  const checkSource = (where: string, s: { id: string; datePublication: string; dateConsultation: string }) => {
    checkNotFuture(`${where} › source ${s.id} › datePublication`, s.datePublication)
    checkNotFuture(`${where} › source ${s.id} › dateConsultation`, s.dateConsultation)
    const age = daysBetween(s.dateConsultation, opts.today)
    if (age > maxAge) warnings.push(`${where} › source ${s.id} : consultée il y a ${age} j (> ${maxAge} j), à revérifier`)
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
    if (c.programme) checkNotFuture(`${where} › programme › datePublication`, c.programme.datePublication)
    for (const s of c.sources) checkSource(where, s)
    if (c.analyse && !(`${c.id}.json` in measures)) {
      errors.push(`${where} : fichier measures/${c.id}.json manquant (gabarit incomplet)`)
    }
    if (!c.analyse && `${c.id}.json` in measures) errors.push(`${where} : mesures présentes mais "analyse" vaut false`)
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
      checkSource(whereFile, s)
    }
    const usedSources = new Set<string>()
    const refSources = (where: string, ids: string[]) => {
      for (const id of ids) {
        usedSources.add(id)
        if (!srcIds.has(id)) errors.push(`${where} : source "${id}" introuvable`)
      }
    }

    // Un effet "castype" exige un précalcul OpenFisca à jour pour cette mesure.
    const checkCastype = (where: string, measureId: string, parametres: unknown) => {
      if (!castypes) return errors.push(`${where} : ampleur "castype" mais castypes/ absent (lancer scripts/openfisca/run.py)`)
      const pre = castypes.candidats[mf.candidatId]?.mesures[measureId]
      if (!pre) return errors.push(`${where} : aucun précalcul pour ${measureId} dans castypes/${mf.candidatId}.json`)
      if (JSON.stringify(pre.parametres) !== JSON.stringify(parametres)) {
        return errors.push(`${where} : précalcul obsolète (paramètres modifiés depuis), relancer run.py`)
      }
      if ('total' in pre && pre.total.length !== castypes.grid.nCells) errors.push(`${where} : précalcul incomplet`)
    }
    const checkConso = (where: string, parametres: { postes: string[] }) => {
      if (!conso) return errors.push(`${where} : ampleur "consommation" mais data/conso/bdf2017.json absent`)
      for (const p of parametres.postes) {
        if (!(p in conso.depensesParDecile)) errors.push(`${where} : poste de consommation "${p}" inconnu de l'enquête Budget de famille`)
      }
    }

    const covered = new Set<string>()
    for (const m of mf.mesures) {
      const where = `${whereFile} › ${m.id}`
      if (measureIds.has(m.id)) errors.push(`${where} : id de mesure en double`)
      measureIds.add(m.id)
      if (m.candidatId !== mf.candidatId) errors.push(`${where} : candidatId incohérent`)
      if (m.statut !== 'abandonnee') covered.add(m.theme)
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
        if (e.ampleur?.kind === 'castype') checkCastype(we, m.id, m.parametres)
        if (e.ampleur?.kind === 'consommation' && m.parametres && 'postes' in m.parametres) checkConso(we, m.parametres)
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
  }

  // Équité : un écart fort de chiffrabilité entre candidats peut donner l'impression qu'un programme est plus concret.
  const parts = Object.values(partChiffree(measures))
  if (parts.length > 1) {
    const ecart = Math.max(...parts) - Math.min(...parts)
    if (ecart > (opts.maxEcartChiffrage ?? 0.25)) {
      warnings.push(`équité : écart de ${Math.round(ecart * 100)} points de part d'effets chiffrés entre candidats (avertissement affiché dans l'app)`)
    }
  }

  if (cands.data.candidats.length === 0) warnings.push('candidates.json : aucun candidat')

  return {
    errors,
    warnings,
    dataset: errors.length === 0 ? { candidates: cands.data, measures, castypes, conso } : null,
  }
}
