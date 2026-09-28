import type { Theme } from '../domain/theme'
import type { Parametres } from '../schema/measure'

/**
 * Limites affichées de façon identique pour toutes les mesures d'une même famille, quel que soit le candidat
 * (neutralité : même mise en garde pour des mesures comparables).
 */
export const PERIMETRE_SALAIRES =
  "On ne sait pas si cette mesure changerait aussi le nombre d'emplois, ni si elle ferait aussi monter les salaires un peu au-dessus du SMIC."
export const PERIMETRE_EMPLOI = "On ne sait pas si cette mesure changerait aussi le nombre d'emplois disponibles."
export const PERIMETRE_CONSO =
  "On suppose que tu achètes autant qu'avant, et que la baisse ou la hausse de taxe se retrouve entièrement dans le prix final."

export function perimetreStandard(theme: Theme, parametres: Parametres | null): string[] {
  const out: string[] = []
  const smic = parametres?.kind === 'smic_pct' || parametres?.kind === 'smic_net' || parametres?.kind === 'smic_brut'
  if (smic) out.push(PERIMETRE_SALAIRES)
  else if (theme === 'salaires') out.push(PERIMETRE_EMPLOI)
  if (parametres?.kind === 'conso_tva' || parametres?.kind === 'conso_prix') out.push(PERIMETRE_CONSO)
  return out
}
