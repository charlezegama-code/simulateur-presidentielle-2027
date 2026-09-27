/** PRNG déterministe (mulberry32) : même seed → même ordre, sur tous les navigateurs. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SEED_PATTERN = /^[0-9]{1,9}$/

/** Seed lisible (≤ 9 chiffres) pour pouvoir la recopier et rejouer l'ordre via ?seed=. */
export function parseSeed(value: string | null | undefined): number | null {
  if (!value || !SEED_PATTERN.test(value)) return null
  return Number(value)
}

export function randomSeed(random: () => number = Math.random): number {
  return Math.floor(random() * 1_000_000_000)
}

/**
 * Ordre aléatoire reproductible. Le résultat ne dépend que de la seed et de l'ensemble des ids,
 * pas de l'ordre d'entrée (les ids sont triés avant le mélange) : aucun ordre par défaut ne peut fuiter.
 */
export function seededShuffle<T>(items: readonly T[], seed: number, key: (item: T) => string): T[] {
  const out = [...items].sort((a, b) => (key(a) < key(b) ? -1 : key(a) > key(b) ? 1 : 0))
  const rand = mulberry32(seed)
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}
