import type { ReactNode } from 'react'
import type { Source } from '../schema/common'
import { dateFr } from '../lib/format'
import { IconCoin, IconDocLines, IconExternal, IconFog } from './icons'

export function H1({ children }: { children: ReactNode }) {
  return <h1 className="text-2xl font-bold leading-[1.12] tracking-tight text-[var(--ink)] sm:text-[1.75rem]">{children}</h1>
}

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mt-8 scroll-mt-20 text-lg font-bold leading-tight tracking-tight text-[var(--ink)]">
      {children}
    </h2>
  )
}

export function Kicker({ children }: { children: ReactNode }) {
  return <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--accent-strong)]">{children}</p>
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  const cls = tone === 'warn' ? 'bg-[var(--flou-soft)] text-[var(--ink)]' : 'raised text-[var(--ink)]'
  return <div className={`rounded-2xl p-4 text-sm leading-relaxed ${cls}`}>{children}</div>
}

export const LINK = 'font-semibold text-[var(--accent-strong)] underline decoration-[var(--line-strong)] decoration-2 underline-offset-3 hover:decoration-[var(--accent)]'

export const BUTTON =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-5 py-2.5 font-bold text-[var(--on-accent)] shadow-[0_10px_24px_-12px_rgb(var(--shadow-rgb)/0.5)] transition-all duration-150 hover:-translate-y-0.5 hover:bg-[var(--accent-strong)] active:translate-y-0 active:scale-[0.97] active:brightness-95 disabled:pointer-events-none disabled:opacity-40'
export const BUTTON_SECONDARY =
  'raised inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-2.5 font-bold text-[var(--ink)] transition-all duration-150 hover:text-[var(--accent-strong)] active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40'
export const BUTTON_GHOST = 'inline-flex min-h-9 items-center justify-center gap-1 text-sm font-semibold text-[var(--accent-strong)] active:scale-[0.97]'

const TYPE_BADGE = {
  chiffre: { label: 'Chiffré', Icon: IconCoin, cls: 'bg-[var(--accent-soft)] text-[var(--accent-strong)]' },
  chiffrable: { label: 'Chiffré', Icon: IconCoin, cls: 'bg-[var(--accent-soft)] text-[var(--accent-strong)]' },
  qualitatif: { label: 'Qualitatif', Icon: IconDocLines, cls: 'bg-[var(--line)]/70 text-[var(--ink-soft)]' },
  flou: { label: 'Flou', Icon: IconFog, cls: 'bg-[var(--flou-soft)] text-[var(--flou)]' },
} as const

export const TYPE_HELP = {
  chiffre: 'Un montant a pu être calculé pour ton profil.',
  chiffrable: 'Cette mesure est assez précise pour qu’un montant puisse être calculé.',
  qualitatif: 'Ça change quelque chose pour toi, mais ça ne se traduit pas en euros.',
  flou: 'Pas assez de détails dans le programme pour dire précisément ce que ça changerait.',
} as const

/** Badge de type : un seul vocabulaire partout (Chiffré / Qualitatif / Flou), un pictogramme distinct par état. */
export function TypeBadge({ type }: { type: keyof typeof TYPE_BADGE }) {
  const b = TYPE_BADGE[type]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${b.cls}`} title={TYPE_HELP[type]}>
      <b.Icon className="size-3" />
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
          <a href={s.archiveUrl ?? s.url} target="_blank" rel="noopener noreferrer" className={`${LINK} inline-flex items-center gap-1`}>
            {s.titre}
            <IconExternal className="size-3.5 shrink-0" />
          </a>{' '}
          <span className="text-[var(--ink-soft)]">
            — {s.editeur}, {s.datePublication ? dateFr(s.datePublication) : 'page non datée'} · {SOURCE_TYPE[s.type]} · consulté le {dateFr(s.dateConsultation)}
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
