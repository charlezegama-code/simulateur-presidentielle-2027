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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-600 dark:text-slate-400">
      <span>
        Ordre d’affichage tiré au hasard (n° <span className="font-mono">{seed}</span>).
      </span>
      <button type="button" className="underline" onClick={() => navigate(`${location}?seed=${randomSeed()}`)}>
        Nouvel ordre
      </button>
      <button
        type="button"
        className="underline"
        onClick={() => {
          navigator.clipboard?.writeText(url).then(() => setCopied(true), () => setCopied(false))
        }}
      >
        {copied ? 'Lien copié' : 'Copier le lien de cet ordre'}
      </button>
    </div>
  )
}
