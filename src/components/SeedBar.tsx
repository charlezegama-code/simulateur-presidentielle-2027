import { useState } from 'react'
import { useLocation } from 'wouter'
import { randomSeed } from '../engine/shuffle'
import { useSeed } from '../lib/seed'

/** Transparence de l'ordre aléatoire (règle de neutralité) : discrète, mais toujours visible et fonctionnelle. */
export function SeedBar() {
  const seed = useSeed()
  const [location, navigate] = useLocation()
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}${location}?seed=${seed}`
  return (
    <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 px-5 text-xs text-[var(--ink-faint)]">
      <span>
        Ordre n° <span className="font-mono text-[var(--ink-soft)]">{seed}</span>
      </span>
      <button type="button" className="font-semibold text-[var(--accent-strong)]" onClick={() => navigate(`${location}?seed=${randomSeed()}`)}>
        Nouvel ordre
      </button>
      <button
        type="button"
        className="font-semibold text-[var(--accent-strong)]"
        onClick={() => {
          navigator.clipboard?.writeText(url).then(() => setCopied(true), () => setCopied(false))
        }}
      >
        {copied ? 'Lien copié' : 'Copier le lien'}
      </button>
    </p>
  )
}
