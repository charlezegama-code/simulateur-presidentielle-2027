import type { ReactNode } from 'react'
import type { Source } from '../schema/common'
import { dateFr } from '../lib/format'

export function H1({ children }: { children: ReactNode }) {
  return <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{children}</h1>
}

export function H2({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <h2 id={id} className="mt-8 text-xl font-bold tracking-tight">
      {children}
    </h2>
  )
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  const cls =
    tone === 'warn'
      ? 'border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100'
      : 'border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
  return <div className={`rounded-lg border p-3 text-sm ${cls}`}>{children}</div>
}

export const BUTTON =
  'inline-flex min-h-11 items-center justify-center rounded-lg bg-indigo-700 px-4 py-2 font-semibold text-white hover:bg-indigo-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 disabled:opacity-40 dark:bg-indigo-400 dark:text-slate-950 dark:hover:bg-indigo-300'
export const BUTTON_SECONDARY =
  'inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 py-2 font-semibold hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-700 dark:border-slate-600 dark:hover:bg-slate-800'

const TYPE_BADGE = {
  chiffre: { label: 'Chiffré', cls: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100' },
  qualitatif: { label: 'Qualitatif', cls: 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-slate-100' },
  flou: { label: 'Flou', cls: 'border border-dashed border-slate-400 text-slate-700 dark:border-slate-500 dark:text-slate-300' },
  chiffrable: { label: 'Chiffrable', cls: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100' },
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
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${b.cls}`} title={TYPE_HELP[type]}>
      {b.label}
    </span>
  )
}

export function SourceLinks({ sources }: { sources: Source[] }) {
  return (
    <ul className="space-y-1">
      {sources.map((s) => (
        <li key={s.id} className="text-sm">
          {/* Version archivée en lien principal quand elle existe : elle reste consultable si la page d'origine change ou disparaît. */}
          <a href={s.archiveUrl ?? s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-slate-400 underline-offset-2">
            {s.titre}
          </a>{' '}
          <span className="text-slate-600 dark:text-slate-400">
            — {s.editeur}, {s.datePublication ? dateFr(s.datePublication) : 'page non datée'} · {SOURCE_TYPE[s.type]} · consulté le{' '}
            {dateFr(s.dateConsultation)}
          </span>
          {s.archiveUrl && (
            <>
              {' '}
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-slate-600 underline dark:text-slate-400">
                (lien d’origine)
              </a>
            </>
          )}
        </li>
      ))}
    </ul>
  )
}

const SOURCE_TYPE = { programme: 'programme officiel', declaration: 'déclaration publique', chiffrage_tiers: 'données tierces' } as const
