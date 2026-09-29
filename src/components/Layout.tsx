import type { ReactNode } from 'react'
import { Link, useLocation } from 'wouter'
import { meta } from '../data/loader'
import { dateFr, ISSUE_URL } from '../lib/format'

const ICONS = {
  resultats: (
    <>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" />
      <path d="M8 8h8M8 11.5h8" />
      <path d="M8.5 15.3l1.6 1.6L14 13.2" />
    </>
  ),
  comparer: <path d="M6 20V10M12 20V4M18 20V14" />,
  candidats: (
    <>
      <circle cx="12" cy="8" r="3.3" />
      <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
    </>
  ),
  methode: (
    <>
      <path d="M4 5.8c2-1.1 5-1.1 8 .8 3-1.9 6-1.9 8-.8v12.9c-2-1.1-5-1.1-8 .8-3-1.9-6-1.9-8-.8z" />
      <path d="M12 6.6v12.9" />
    </>
  ),
} as const

const NAV = [
  { href: '/resultats', label: 'Mes résultats', short: 'Résultats', icon: 'resultats' },
  { href: '/comparer', label: 'Comparer', short: 'Comparer', icon: 'comparer' },
  { href: '/candidats', label: 'Candidats', short: 'Candidats', icon: 'candidats' },
  { href: '/methodologie', label: 'Méthode', short: 'Méthode', icon: 'methode' },
] as const satisfies readonly { href: string; label: string; short: string; icon: keyof typeof ICONS }[]

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation()
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-20 focus:rounded-full focus:bg-[var(--ink)] focus:px-4 focus:py-2 focus:text-[var(--paper)]"
      >
        Aller au contenu
      </a>
      <header className="sticky top-0 z-10 border-b border-[var(--line)] bg-[var(--paper)]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3">
          <Link href="/" className="font-display text-[1.05rem] font-semibold tracking-tight text-[var(--ink)]">
            Présidentielle 2027 <span className="font-sans text-sm font-normal text-[var(--ink-faint)]">· ce qui change pour toi</span>
          </Link>
          <nav aria-label="Navigation principale" className="-mx-2 hidden overflow-x-auto text-sm sm:flex">
            {NAV.map((n) => {
              const active = location.startsWith(n.href)
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  aria-current={active ? 'page' : undefined}
                  className={`relative whitespace-nowrap rounded-full px-3 py-2 font-medium transition-colors hover:text-[var(--ink)] ${active ? 'text-[var(--accent-strong)]' : 'text-[var(--ink-soft)]'}`}
                >
                  {n.label}
                  {active && <span aria-hidden="true" className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-[var(--accent)]" />}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>
      <main id="contenu" className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        {children}
      </main>
      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-[var(--line)] bg-[var(--paper)]/95 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-3xl">
          {NAV.map((n) => {
            const active = location.startsWith(n.href)
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors active:scale-95 ${active ? 'text-[var(--accent-strong)]' : 'text-[var(--ink-faint)]'}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? 2.1 : 1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {ICONS[n.icon]}
                </svg>
                {n.short}
              </Link>
            )
          })}
        </div>
      </nav>
      <footer className="border-t border-[var(--line)] text-sm text-[var(--ink-soft)]">
        <div className="mx-auto max-w-3xl space-y-2 px-4 pb-24 pt-8 sm:pb-8">
          <p>
            Simulation indicative, pas une consigne de vote. Données mises à jour le {dateFr(meta.dateMaj)} (version {meta.versionDonnees}).
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/neutralite" className="underline decoration-[var(--line-strong)] underline-offset-3 hover:text-[var(--ink)]">
              Neutralité et vie privée
            </Link>
            <Link href="/methodologie" className="underline decoration-[var(--line-strong)] underline-offset-3 hover:text-[var(--ink)]">
              Méthodologie
            </Link>
            <a href={ISSUE_URL} className="underline decoration-[var(--line-strong)] underline-offset-3 hover:text-[var(--ink)]" target="_blank" rel="noopener noreferrer">
              Signaler une erreur
            </a>
          </p>
          <p>Tes réponses restent sur ton appareil : aucune n’est envoyée.</p>
        </div>
      </footer>
    </div>
  )
}
