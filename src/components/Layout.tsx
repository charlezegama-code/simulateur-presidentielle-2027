import type { ReactNode } from 'react'
import { Link, useLocation } from 'wouter'
import { meta } from '../data/loader'
import { dateFr, ISSUE_URL } from '../lib/format'

const NAV = [
  { href: '/resultats', label: 'Mes résultats' },
  { href: '/comparer', label: 'Comparer' },
  { href: '/candidats', label: 'Candidats' },
  { href: '/methodologie', label: 'Méthode' },
]

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
          <nav aria-label="Navigation principale" className="-mx-2 flex overflow-x-auto text-sm">
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
      <footer className="border-t border-[var(--line)] text-sm text-[var(--ink-soft)]">
        <div className="mx-auto max-w-3xl space-y-2 px-4 py-8">
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
