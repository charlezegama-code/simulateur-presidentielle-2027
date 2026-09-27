/**
 * Exporte la grille de cas-types (src/domain/grid.ts) pour le précalcul Python.
 * Source unique : le questionnaire, le moteur et OpenFisca partagent exactement la même liste de cases.
 * Usage : npx tsx scripts/export-grid.ts  → scripts/openfisca/cells.generated.json (non versionné)
 */
import { writeFileSync } from 'node:fs'
import { cellKey, enumerateCells, gridHash } from '../src/domain/grid'

const cells = enumerateCells()
writeFileSync(
  'scripts/openfisca/cells.generated.json',
  JSON.stringify({ gridHash: gridHash(cells), cells: cells.map((c) => ({ key: cellKey(c), ...c })) }),
)
console.log(`${cells.length} cases, empreinte ${gridHash(cells)}`)
