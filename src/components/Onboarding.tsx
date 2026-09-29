import { useState } from 'react'
import { useLockScroll, useOnboarding } from '../state/onboarding'
import { BUTTON, BUTTON_GHOST, TypeBadge } from './ui'

const SLIDES = [
  {
    emoji: '🔎',
    titre: 'Ce que change chaque programme, pour toi',
    corps:
      'Réponds à quelques questions sur ta situation. Pour chaque candidat·e, on te montre concrètement ce que son programme changerait pour toi — jamais un score, jamais un classement.',
  },
  {
    emoji: '🔒',
    titre: 'Tes réponses restent sur ton téléphone',
    corps: "Tout se calcule dans ton navigateur. Rien n'est envoyé nulle part, pas de compte à créer, pas de suivi. Tu peux fermer l'onglet quand tu veux, rien n'est perdu sans ton accord.",
  },
  {
    emoji: '📊',
    titre: 'Comment lire un résultat',
    corps: "Chaque effet porte un badge : appuie dessus pour voir ce qu'il veut dire. Les onglets Comparer, Candidats et Méthode te laissent explorer les programmes indépendamment de ton profil.",
    badges: true,
  },
] as const

export function Onboarding() {
  const { show, close } = useOnboarding()
  const [i, setI] = useState(0)
  useLockScroll(show)

  if (!show) return null

  const last = i === SLIDES.length - 1
  const s = SLIDES[i]

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Présentation de l'application"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--ink)]/55 p-4 backdrop-blur-sm"
      onKeyDown={(e) => {
        if (e.key === 'Escape') close()
      }}
    >
      <div key={i} className="q-enter card card-lift w-full max-w-sm space-y-5 rounded-3xl p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1.5" aria-hidden="true">
            {SLIDES.map((_, d) => (
              <span key={d} className={`h-1.5 w-6 rounded-full transition-colors ${d === i ? 'bg-[var(--accent)]' : 'bg-[var(--line)]'}`} />
            ))}
          </div>
          <button type="button" onClick={close} className={BUTTON_GHOST}>
            Passer
          </button>
        </div>

        <div className="space-y-2.5 text-center">
          <span aria-hidden="true" className="text-4xl">
            {s.emoji}
          </span>
          <h2 className="text-xl font-bold tracking-tight text-[var(--ink)]">{s.titre}</h2>
          <p className="text-[15px] leading-relaxed text-[var(--ink-soft)]">{s.corps}</p>
          {'badges' in s && s.badges && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <TypeBadge type="chiffre" />
              <TypeBadge type="qualitatif" />
              <TypeBadge type="flou" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => setI((v) => v - 1)}
            disabled={i === 0}
            className={`${BUTTON_GHOST} disabled:pointer-events-none disabled:opacity-0`}
          >
            ← Précédent
          </button>
          <button type="button" onClick={() => (last ? close() : setI((v) => v + 1))} className={BUTTON}>
            {last ? "C'est parti" : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  )
}
