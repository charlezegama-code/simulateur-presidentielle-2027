import type { Cell } from '../domain/grid'
import type { ConsoFile } from '../schema/conso'
import type { Parametres } from '../schema/measure'

export interface ConsoEstimate {
  /** Variation annuelle du pouvoir d'achat (€), positive si la mesure fait baisser les prix payés. */
  annuel: number
  decile: number
  typeMenage: string
  /** Dépense annuelle estimée sur les postes concernés (€ 2025). */
  depense: number
}

/** Unités de consommation (échelle de l'OCDE modifiée, utilisée par l'INSEE) ; enfants de 6, 10 et 14 ans. */
export function unitesConsommation(cell: Pick<Cell, 'couple' | 'enfants'>): number {
  const n = cell.enfants === '3+' ? 3 : Number(cell.enfants)
  const enfants = [0.3, 0.3, 0.5].slice(0, n).reduce((a, b) => a + b, 0)
  return 1 + (cell.couple ? 0.5 : 0) + enfants
}

export function typeMenage(cell: Pick<Cell, 'couple' | 'enfants'>): '1' | '2' | '3' | '4' {
  if (!cell.couple) return cell.enfants === '0' ? '1' : '2'
  return cell.enfants === '0' ? '3' : '4'
}

/** Décile de niveau de vie 2017 (1 à 10) d'un revenu disponible annuel exprimé en euros 2025. */
export function decileNiveauDeVie(revenuDisponible2025: number, uc: number, conso: ConsoFile): number {
  const nv2017 = (revenuDisponible2025 / uc) * (conso.ipc.moyenne2017 / conso.ipc.moyenne2025)
  return 1 + conso.decilesNiveauDeVie2017.filter((borne) => nv2017 > borne).length
}

/**
 * Effet d'une mesure de prix sur un ménage, à quantités consommées constantes et répercussion intégrale sur les prix.
 * Dépense d'un poste = dépense moyenne des ménages du même décile (INSEE, BdF 2017, TF106)
 *   × ratio de son type de ménage (TF105) × inflation 2017→2025 (IPC).
 * Sans véhicule, les dépenses d'utilisation de véhicules personnels (COICOP 072) sont nulles.
 */
export function estimateConso(
  parametres: Extract<Parametres, { kind: 'conso_tva' | 'conso_prix' }>,
  cell: Cell,
  vehicule: boolean,
  revenuDisponible2025: number,
  conso: ConsoFile,
): ConsoEstimate {
  const uc = unitesConsommation(cell)
  const decile = decileNiveauDeVie(revenuDisponible2025, uc, conso)
  const type = typeMenage(cell)
  const inflation = conso.ipc.moyenne2025 / conso.ipc.moyenne2017
  let depense = 0
  for (const poste of parametres.postes) {
    if (!vehicule && poste.startsWith('072')) continue
    const base = conso.depensesParDecile[poste]?.[decile - 1] ?? 0
    const ratio = conso.ratiosTypeMenage[poste]?.[type] ?? 1
    depense += base * ratio * inflation
  }
  const variationPrix =
    parametres.kind === 'conso_tva'
      ? (1 + parametres.tauxApresPct / 100) / (1 + parametres.tauxAvantPct / 100) - 1
      : parametres.variationPrixPct / 100
  const annuel = Math.round((-depense * variationPrix) / 10) * 10
  return { annuel, decile, typeMenage: conso.typesMenage[type], depense: Math.round(depense) }
}
