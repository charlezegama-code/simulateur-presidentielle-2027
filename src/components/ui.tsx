import type { ReactNode } from 'react'
import type { Source } from '../schema/common'
import { dateFr } from '../lib/format'

export function H1({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-[2rem] font-semibold leading-[1.08] tracking-tight text-[var(--ink)] sm:text-[2.6rem]">
      {children}
    </h1>
  )
}

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mt-10 scroll-mt-20 text-xl font-semibold leading-tight tracking-tight text-[var(--ink)] sm:text-2xl">
      {children}
    </h2>
  )
}

/** Petit libellé d'en-tête de section, en majuscules discrètes, ton accent. */
export function Kicker({ children }: { children: ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]">{children}</p>
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  const cls =
    tone === 'warn'
      ? 'border-[var(--flou)]/35 bg-[var(--flou-soft)] text-[var(--ink)]'
      : 'border-[var(--line-strong)] bg-[var(--paper-raised)] text-[var(--ink)]'
  return <div className={`rounded-2xl border p-4 text-sm leading-relaxed ${cls}`}>{children}</div>
}

export const BUTTON =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 font-semibold text-[var(--on-accent)] shadow-[0_10px_24px_-12px_rgb(var(--shadow-rgb)/0.5)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0 disabled:pointer-events-none disabled:opacity-40'
export const BUTTON_SECONDARY =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[var(--line-strong)] bg-[var(--paper-raised)] px-5 py-2.5 font-semibold text-[var(--ink)] transition-colors duration-150 hover:border-[var(--accent)] hover:text-[var(--accent-strong)] disabled:pointer-events-none disabled:opacity-40'
export const BUTTON_GHOST =
  'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-[var(--ink-soft)] underline decoration-[var(--line-strong)] decoration-2 underline-offset-4 transition-colors hover:text-[var(--accent-strong)] hover:decoration-[var(--accent)]'

const TYPE_BADGE = {
  chiffre: { label: 'Chiffré', cls: 'bg-[var(--accent-soft)] text-[var(--accent-strong)]', dot: 'bg-[var(--accent)]' },
  qualitatif: { label: 'Qualitatif', cls: 'bg-[var(--line)]/70 text-[var(--ink-soft)]', dot: 'bg-[var(--ink-faint)]' },
  flou: { label: 'Flou', cls: 'border border-dashed border-[var(--flou)] text-[var(--flou)]', dot: '' },
  chiffrable: { label: 'Chiffrable', cls: 'bg-[var(--accent-soft)] text-[var(--accent-strong)]', dot: 'bg-[var(--accent)]' },
} as const

export const TYPE_HELP = {
  chiffre: 'montant calculé pour ton profil',
  qualitatif: 'effet décrit mais non chiffrable',
  flou: 'mesure trop imprécise pour être simulée',
  chiffrable: 'mesure assez précise pour être chiffrée',
} as const

export function TypeBadge({ type }: { type: keyof typeof TYPE_BADGE }) {
  const b = TYPE_BADGE[type]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${b.cls}`} title={TYPE_HELP[type]}>
      {b.dot && <span aria-hidden="true" className={`size-1.5 rounded-full ${b.dot}`} />}
      {b.label}
    </span>
  )
}

const SOURCE_TYPE = { programme: 'programme officiel', declaration: 'déclaration publique', chiffrage_tiers: 'données tierces' } as const

export function SourceLinks({ sources }: { sources: Source[] }) {
  return (
    <ul className="space-y-2">
      {sources.map((s) => (
        <li key={s.id} className="text-sm leading-snug">
          {/* Version archivée en lien principal quand elle existe : elle reste consultable si la page d'origine change ou disparaît. */}
          <a
            href={s.archiveUrl ?? s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--ink)] underline decoration-[var(--line-strong)] decoration-2 underline-offset-3 hover:decoration-[var(--accent)]"
          >
            {s.titre}
          </a>{' '}
          <span className="text-[var(--ink-soft)]">
            — {s.editeur}, {s.datePublication ? dateFr(s.datePublication) : 'page non datée'} · {SOURCE_TYPE[s.type]} · consulté le{' '}
            {dateFr(s.dateConsultation)}
          </span>
          {s.archiveUrl && (
            <>
              {' '}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[var(--ink-soft)] underline decoration-[var(--line-strong)]">
                (lien d’origine)
              </a>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}
