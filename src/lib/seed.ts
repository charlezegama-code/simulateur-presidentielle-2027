import { useMemo } from 'react'
import { useSearch } from 'wouter'
import { parseSeed, randomSeed, seededShuffle } from '../engine/shuffle'

// Une seed par chargement de page si l'URL n'en fournit pas : l'ordre change d'une visite à l'autre.
const sessionSeed = randomSeed()

/** Seed d'ordre d'affichage : ?seed= si présent (rejouable), sinon seed de session. Seul paramètre d'URL. */
export function useSeed(): number {
  const search = useSearch()
  return useMemo(() => parseSeed(new URLSearchParams(search).get('seed')) ?? sessionSeed, [search])
}

export function useShuffled<T>(items: readonly T[], key: (t: T) => string): T[] {
  const seed = useSeed()
  return useMemo(() => seededShuffle(items, seed, key), [items, seed, key])
}
