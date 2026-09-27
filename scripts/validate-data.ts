/**
 * Valide un dossier de données contre les schémas Zod.
 * Usage : tsx scripts/validate-data.ts [dossier] [--fixtures]
 * Code de sortie 1 si au moins une erreur (branché en prebuild : le build échoue).
 */
import { resolve } from 'node:path'
import { validateDataset } from '../src/schema/validate'
import { loadRaw } from './lib/load-raw'

const args = process.argv.slice(2)
const dir = resolve(args.find((a) => !a.startsWith('--')) ?? 'data')
const mode = args.includes('--fixtures') ? 'fixtures' : 'prod'
const today = new Date().toISOString().slice(0, 10)

try {
  const report = validateDataset(loadRaw(dir), { mode, today })
  for (const w of report.warnings) console.warn(`⚠️  ${w}`)
  for (const e of report.errors) console.error(`❌ ${e}`)
  if (report.errors.length > 0) {
    console.error(`\nvalidate-data : ${report.errors.length} erreur(s) dans ${dir}`)
    process.exit(1)
  }
  const n = report.dataset!.candidates.candidats.length
  const m = Object.values(report.dataset!.measures).reduce((acc, f) => acc + f.mesures.length, 0)
  console.log(`✅ validate-data (${mode}) : ${n} candidat(s), ${m} mesure(s), ${report.warnings.length} avertissement(s) — ${dir}`)
} catch (e) {
  console.error(`❌ ${(e as Error).message}`)
  process.exit(1)
}
