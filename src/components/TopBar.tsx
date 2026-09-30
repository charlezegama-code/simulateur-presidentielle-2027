import type { ReactNode } from 'react'
import { IconBack } from './icons'

/**
 * Haut d'écran : uniquement le titre et, si besoin, une flèche retour ou une icône d'action. Jamais de lien de
 * navigation texte ici (voir docs/ux-spec.md, règle transverse).
 */
export function TopBar({ title, back, action }: { title: string; back?: boolean | (() => void); action?: ReactNode }) {
  const onBack = back === true ? () => window.history.back() : typeof back === 'function' ? back : undefined
  return (
    <div className="flex items-center gap-2 px-5 pb-1 pt-4">
      {onBack && (
        <button type="button" onClick={onBack} aria-label="Retour" className="-ml-2 flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--ink-soft)] active:scale-90">
          <IconBack className="size-5.5" />
        </button>
      )}
      <h1 className="flex-1 truncate text-[1.05rem] font-bold tracking-tight text-[var(--ink)]">{title}</h1>
      {action}
    </div>
  )
}
