import type { ReactNode } from 'react'
import { Link, useLocation } from 'wouter'
import { IconBars, IconChecklist, IconHelp, IconPeople } from './icons'

const TABS = [
  { href: '/resultats', label: 'Résultat', Icon: IconChecklist },
  { href: '/comparer', label: 'Comparer', Icon: IconBars },
  { href: '/candidats', label: 'Candidats', Icon: IconPeople },
  { href: '/aide', label: 'Aide', Icon: IconHelp },
] as const

/**
 * Coquille de l'app : pas de nav texte en haut (chaque écran affiche son propre <TopBar />), une bottom tab bar
 * fixe pour les 4 sections principales. Masquée sur l'accueil (écran d'entrée, hors des 4 onglets).
 */
export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation()
  const isHome = location === '/'
  return (
    <div className="min-h-dvh">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-20 focus:rounded-full focus:bg-[var(--ink)] focus:px-4 focus:py-2 focus:text-[var(--paper)]"
      >
        Aller au contenu
      </a>
      <main id="contenu" className={`mx-auto w-full max-w-[480px] ${isHome ? '' : 'pb-24'}`}>
        {children}
      </main>
      {!isHome && (
        <nav
          aria-label="Navigation principale"
          className="fixed inset-x-0 bottom-0 z-10 raised flex justify-center border-t border-[var(--line)] bg-[var(--paper-raised)]/95 backdrop-blur-md"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="flex w-full max-w-[480px]">
            {TABS.map((t) => {
              const active = location.startsWith(t.href)
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-transform active:scale-95 ${active ? 'text-[var(--accent-strong)]' : 'text-[var(--ink-faint)]'}`}
                >
                  <t.Icon className="size-6" strokeWidth={active ? 2.2 : 1.7} />
                  {t.label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
