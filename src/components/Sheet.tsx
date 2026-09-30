import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconClose } from './icons'

/**
 * Feuille modale générique (détail de ligne, profil, informations, statut candidat·e...) : rendue via un portail
 * au niveau racine du document, jamais imbriquée dans un conteneur animé (voir CLAUDE.md, piège Framer Motion).
 */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" aria-label="Fermer" onClick={onClose} className="sheet-backdrop absolute inset-0 bg-[rgb(var(--shadow-rgb)/0.45)]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="sheet-panel raised relative max-h-[85dvh] w-full overflow-y-auto rounded-t-[1.5rem] bg-[var(--paper-raised)] p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-[1.5rem] sm:pb-6"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="sheet-title" className="font-display text-lg font-bold text-[var(--ink)]">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--ink-soft)] active:scale-90">
            <IconClose className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
