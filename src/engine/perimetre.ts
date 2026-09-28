import type { Theme } from '../domain/theme'
import type { Parametres } from '../schema/measure'

/**
 * Limites affichées de façon identique pour toutes les mesures d'une même famille, quel que soit le candidat
 * (neutralité : même mise en garde pour des mesures comparables).
 */
export const PERIMETRE_SALAIRES =
  "L'effet de la mesure sur l'emploi n'est pas modélisé. La diffusion de la hausse aux salaires proches du SMIC n'est pas modélisée."
export const PERIMETRE_EMPLOI = "L'effet de la mesure sur l'emploi n'est pas modélisé."
export const PERIMETRE_CONSO =
  "Estimation à quantités consommées constantes, en supposant la baisse ou la hausse de taxe intégralement répercutée sur les prix."

export function perimetreStandard(theme: Theme, parametres: Parametres | null): string[] {
  const out: string[] = []
  const smic = parametres?.kind === 'smic_pct' || parametres?.kind === 'smic_net' || parametres?.kind === 'smic_brut'
  if (smic) out.push(PERIMETRE_SALAIRES)
  else if (theme === 'salaires') out.push(PERIMETRE_EMPLOI)
  if (parametres?.kind === 'conso_tva' || parametres?.kind === 'conso_prix') out.push(PERIMETRE_CONSO)
  return out
}
