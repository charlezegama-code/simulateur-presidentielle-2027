import type { Castype, GridFile } from '../schema/castype'
import { REVENU_TRANCHES, type Profile } from '../schema/profile'

export interface CastypeMatch {
  castype: Castype
  /** true si la tranche de revenu du cas-type diffère de celle du profil (plus proche voisin). */
  approche: boolean
}

/**
 * Cas-type utilisé pour chiffrer un profil : correspondance exacte sur les dimensions déclarées dans grid.json,
 * plus proche voisin sur la tranche de revenu uniquement. Jamais d'interpolation entre situations familiales.
 * null si aucun cas-type compatible : l'effet reste alors non chiffré.
 */
export function findCastype(profile: Profile, grid: GridFile): CastypeMatch | null {
  const target = REVENU_TRANCHES.indexOf(profile.revenuTranche)
  let best: { castype: Castype; distance: number } | null = null
  for (const ct of grid.castypes) {
    const compatible = grid.dimensionsExactes.every(
      (dim) => (ct.profil as Record<string, unknown>)[dim] === (profile as Record<string, unknown>)[dim],
    )
    if (!compatible) continue
    const distance = Math.abs(REVENU_TRANCHES.indexOf(ct.profil.revenuTranche) - target)
    // À distance égale, on prend la tranche inférieure (choix fixe et documenté), puis l'id pour la stabilité.
    if (
      !best ||
      distance < best.distance ||
      (distance === best.distance && ct.profil.revenuTranche < best.castype.profil.revenuTranche) ||
      (distance === best.distance && ct.profil.revenuTranche === best.castype.profil.revenuTranche && ct.id < best.castype.id)
    ) {
      best = { castype: ct, distance }
    }
  }
  if (!best) return null
  // Au-delà d'une tranche d'écart, le chiffre ne serait plus représentatif.
  if (best.distance > 1) return null
  return { castype: best.castype, approche: best.distance > 0 }
}
