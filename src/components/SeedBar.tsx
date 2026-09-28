import { useState } from 'react'
import { useLocation } from 'wouter'
import { randomSeed } from '../engine/shuffle'
import { useSeed } from '../lib/seed'

/** Affiche la seed de l'ordre aléatoire, permet d'en tirer une autre et de partager l'ordre (sans aucune réponse). */
export function SeedBar() {
  const seed = useSeed()
  const [location, navigate] = useLocation()
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}${location}?seed=${seed}`
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-full border border-[var(--line)] bg-[var(--paper-raised)] px-4 py-2 text-sm text-[var(--ink-soft)]">
      <span>
        Ordre aléatoire n° <span className="font-mono text-[var(--ink)]">{seed}</span>
      </span>
      <span aria-hidden="true" className="text-[var(--line-strong)]">
        ·
      </span>
      <button type="button" className="font-medium text-[var(--accent-strong)] underline decoration-[var(--line-strong)] underline-offset-3 hover:decoration-[var(--accent)]" onClick={() => navigate(`${location}?seed=${randomSeed()}`)}>
        Nouvel ordre
      </button>
      <button
        type="button"
        className="font-medium text-[var(--accent-strong)] underline decoration-[var(--line-strong)] underline-offset-3 hover:decoration-[var(--accent)]"
        onClick={() => {
          navigator.clipboard?.writeText(url).then(() => setCopied(true), () => setCopied(false))
        }}
      >
        {copied ? 'Lien copié' : 'Copier le lien de cet ordre'}
      </button>
    </div>
  )
}
