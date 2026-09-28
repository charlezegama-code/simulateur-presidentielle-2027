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
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-slate-900">
        Aller au contenu
      </a>
      <header className="sticky top-0 z-[1] border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2">
          <Link href="/" className="font-bold tracking-tight">
            Présidentielle 2027 <span className="font-normal text-slate-500 dark:text-slate-400">· ce qui change pour toi</span>
          </Link>
          <nav aria-label="Navigation principale" className="-mx-2 flex overflow-x-auto text-sm">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                aria-current={location.startsWith(n.href) ? 'page' : undefined}
                className="whitespace-nowrap rounded px-2 py-2 text-slate-600 hover:text-slate-900 aria-[current=page]:font-semibold aria-[current=page]:text-indigo-700 dark:text-slate-300 dark:hover:text-white dark:aria-[current=page]:text-indigo-300"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main id="contenu" className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="border-t border-slate-200 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
        <div className="mx-auto max-w-3xl space-y-2 px-4 py-6">
          <p>
            Simulation indicative, pas une consigne de vote. Données mises à jour le {dateFr(meta.dateMaj)} (version {meta.versionDonnees}).
          </p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <Link href="/neutralite" className="underline">Neutralité et vie privée</Link>
            <Link href="/methodologie" className="underline">Méthodologie</Link>
            <a href={ISSUE_URL} className="underline" target="_blank" rel="noopener noreferrer">Signaler une erreur</a>
          </p>
          <p>Tes réponses restent sur ton appareil : aucune n’est envoyée.</p>
        </div>
      </footer>
    </div>
  )
}
