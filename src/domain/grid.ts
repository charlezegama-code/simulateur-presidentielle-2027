/**
 * Grille de cas-types : à chaque profil valide correspond EXACTEMENT une case de calcul (cellOf).
 *
 * Les réponses sans effet sur le calcul OpenFisca sont fusionnées par des règles explicites :
 * - âge : seuls comptent « moins de 25 ans » (RSA, bourses) et, pour les retraité·e·s, « 65 ans ou plus » (ASPA) ;
 * - zone APL : ne compte que pour les locataires ;
 * - échelon de bourse : dimension séparable (la bourse n'entre dans aucune autre base de ressources),
 *   calculée à part (castypes/bourse.json) et ajoutée au résultat de la case ;
 * - véhicule : non utilisé par OpenFisca (sert aux effets qualitatifs et à l'estimation des taxes sur la consommation).
 */
import {
  CONJOINT_TRANCHES,
  ENFANTS,
  LOGEMENTS,
  REVENUS_PAR_STATUT,
  STATUTS_PRO,
  ZONES_APL,
  AGES_PAR_STATUT,
  type AgeTranche,
  type ConjointTranche,
  type Logement,
  type Profile,
  type RevenuTranche,
  type StatutPro,
  type ZoneApl,
} from './profile'

export type AgeCalcul = 'moins_25' | '25_plus' | 'retraite_moins_65' | 'retraite_65_plus'

export interface Cell {
  statutPro: StatutPro
  ageCalcul: AgeCalcul
  revenuTranche: RevenuTranche
  couple: boolean
  revenuConjointTranche: ConjointTranche | null
  enfants: (typeof ENFANTS)[number]
  logement: Logement
  /** null si non locataire (la zone n'intervient que dans les aides au logement). */
  zoneApl: ZoneApl | null
  handicapAAH: boolean
}

export function ageCalcul(statut: StatutPro, age: AgeTranche): AgeCalcul {
  if (statut === 'retraite') return age === '62+' ? 'retraite_65_plus' : 'retraite_moins_65'
  return age === '18-24' ? 'moins_25' : '25_plus'
}

const LOCATAIRE: readonly Logement[] = ['locataire_prive', 'locataire_social']

export function cellOf(p: Profile): Cell {
  return {
    statutPro: p.statutPro,
    ageCalcul: ageCalcul(p.statutPro, p.ageTranche),
    revenuTranche: p.revenuTranche,
    couple: p.couple,
    revenuConjointTranche: p.couple ? p.revenuConjointTranche : null,
    enfants: p.enfants,
    logement: p.logement,
    zoneApl: LOCATAIRE.includes(p.logement) ? p.zoneApl : null,
    handicapAAH: p.handicapAAH,
  }
}

/** Identifiant stable d'une case, ex. « salarie_prive.25_plus.r2.seul.0.locataire_prive.zone_3.valide ». */
export function cellKey(c: Cell): string {
  return [
    c.statutPro,
    c.ageCalcul,
    c.revenuTranche,
    c.couple ? `couple-${c.revenuConjointTranche}` : 'seul',
    c.enfants,
    c.logement,
    c.zoneApl ?? 'toutes_zones',
    c.handicapAAH ? 'aah' : 'sans_aah',
  ].join('.')
}

/** Empreinte FNV-1a de la liste ordonnée des cases : détecte un précalcul fait sur une autre grille. */
export function gridHash(cells: Cell[]): string {
  let h = 0x811c9dc5
  for (const c of cells) {
    const k = cellKey(c) + '|'
    for (let i = 0; i < k.length; i++) {
      h ^= k.charCodeAt(i)
      h = Math.imul(h, 0x01000193) >>> 0
    }
  }
  return h.toString(16).padStart(8, '0')
}

let indexCache: Map<string, number> | null = null
/** Position d'un profil dans la grille (ordre d'enumerateCells), identique à celle des tableaux précalculés. */
export function cellIndex(p: Profile): number {
  if (!indexCache) indexCache = new Map(enumerateCells().map((c, i) => [cellKey(c), i]))
  const i = indexCache.get(cellKey(cellOf(p)))
  if (i === undefined) throw new Error(`profil hors grille : ${cellKey(cellOf(p))}`)
  return i
}

/** Toutes les cases de la grille (utilisé par le précalcul OpenFisca via scripts/export-grid.ts). */
export function enumerateCells(): Cell[] {
  const cells: Cell[] = []
  for (const statutPro of STATUTS_PRO) {
    const ages = [...new Set(AGES_PAR_STATUT[statutPro].map((a) => ageCalcul(statutPro, a)))]
    for (const age of ages)
      for (const revenuTranche of REVENUS_PAR_STATUT[statutPro])
        for (const conj of [null, ...CONJOINT_TRANCHES])
          for (const enfants of ENFANTS)
            for (const logement of LOGEMENTS)
              for (const zoneApl of LOCATAIRE.includes(logement) ? ZONES_APL : [null])
                for (const handicapAAH of [false, true])
                  cells.push({
                    statutPro,
                    ageCalcul: age,
                    revenuTranche,
                    couple: conj !== null,
                    revenuConjointTranche: conj,
                    enfants,
                    logement,
                    zoneApl,
                    handicapAAH,
                  })
  }
  return cells
}
