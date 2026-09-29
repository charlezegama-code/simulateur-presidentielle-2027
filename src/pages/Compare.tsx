import { useEffect } from 'react'
import { Link } from 'wouter'
import { CandidateAvatar } from '../components/CandidateAvatar'
import { SeedBar } from '../components/SeedBar'
import { H1, TypeBadge } from '../components/ui'
import { candidates, measures } from '../data/loader'
import { THEMES, THEME_LABELS, type Theme } from '../domain/theme'
import { dateFr } from '../lib/format'
import { useShuffled } from '../lib/seed'
import type { Candidate } from '../schema/candidate'

const byId = (c: Candidate) => c.id
const analysed = candidates.candidats.filter((c) => c.analyse)

/** Une carte compacte par candidat·e pour un thème, scannable, plutôt qu'une ligne de texte plat. */
function ThemeCard({ c, theme }: { c: Candidate; theme: Theme }) {
  const mf = measures[`${c.id}.json`]
  const ms = mf.mesures.filter((m) => m.theme === theme && m.statut !== 'abandonnee')
  const sp = mf.sansPosition.find((s) => s.theme === theme)
  const sansPosition = ms.length === 0
  return (
    <div
      className={`rounded-2xl border p-3.5 ${sansPosition ? 'border-dashed border-[var(--line)] bg-transparent' : 'border-[var(--line)] bg-[var(--paper-raised)]'}`}
    >
      <div className="flex items-center gap-2.5">
        <CandidateAvatar candidat={c} size="sm" />
        <Link
          href={`/candidat/${c.id}#theme-${theme}`}
          className="min-w-0 truncate font-semibold text-[var(--ink)] underline decoration-[var(--line-strong)] decoration-2 underline-offset-3 hover:decoration-[var(--accent)]"
        >
          {c.prenom} {c.nom}
        </Link>
      </div>
      {sansPosition ? (
        <p className="mt-2 text-sm text-[var(--ink-faint)]">Aucune position identifiée au {dateFr(sp?.dateRecherche ?? mf.dateMaj)}.</p>
      ) : (
        <ul className="mt-2.5 space-y-1.5">
          {ms.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-1.5 text-sm text-[var(--ink-soft)]">
              <TypeBadge type={m.type} /> {m.intitule}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ThemeSection({ theme, ordered, defaultOpen }: { theme: Theme; ordered: Candidate[]; defaultOpen: boolean }) {
  const counts = ordered.map((c) => measures[`${c.id}.json`].mesures.some((m) => m.theme === theme && m.statut !== 'abandonnee'))
  const nAvecPosition = counts.filter(Boolean).length
  return (
    <details id={`theme-${theme}`} className="group/theme card scroll-mt-20 overflow-hidden" open={defaultOpen}>
      <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-3 p-5 marker:content-none sm:p-6">
        <span>
          <span className="font-display text-xl font-semibold tracking-tight text-[var(--ink)] sm:text-2xl">{THEME_LABELS[theme]}</span>
          <span className="ml-2.5 text-sm font-medium text-[var(--ink-faint)]">
            {nAvecPosition}/{ordered.length} avec une position
          </span>
        </span>
        <span
          aria-hidden="true"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-strong)] transition-transform duration-200 group-open/theme:rotate-45"
        >
          +
        </span>
      </summary>
      <div className="stagger grid gap-3 border-t border-[var(--line)] p-5 sm:grid-cols-2 sm:p-6">
        {ordered.map((c) => (
          <ThemeCard key={c.id} c={c} theme={theme} />
        ))}
      </div>
    </details>
  )
}

export function Compare() {
  const ordered = useShuffled(analysed, byId)

  // Les sections thème sont des <details> repliées : un lien #theme-x (nav interne ou venant de la fiche
  // candidat·e) doit ouvrir la bonne section, ce qu'un <details> ne fait pas tout seul au changement de hash.
  useEffect(() => {
    function openFromHash() {
      const id = window.location.hash.slice(1)
      if (!id) return
      const el = document.getElementById(id)
      if (el instanceof HTMLDetailsElement) el.open = true
    }
    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    return () => window.removeEventListener('hashchange', openFromHash)
  }, [])

  return (
    <div className="space-y-5">
      <H1>Comparer les programmes par thème</H1>
      <p className="text-[var(--ink-soft)]">
        Toutes les mesures analysées, quel que soit ton profil. Les candidat·es apparaissent dans le même ordre aléatoire pour chaque thème. Un thème est replié
        par défaut : dépliez celui qui vous intéresse.
      </p>
      <SeedBar />
      <nav aria-label="Thèmes" className="flex flex-wrap gap-2 text-sm">
        {THEMES.map((t) => (
          <a
            key={t}
            href={`#theme-${t}`}
            className="rounded-full border border-[var(--line)] bg-[var(--paper-raised)] px-3 py-1.5 text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
          >
            {THEME_LABELS[t]}
          </a>
        ))}
      </nav>
      <div className="space-y-3">
        {THEMES.map((t, i) => (
          <ThemeSection key={t} theme={t} ordered={ordered} defaultOpen={i === 0} />
        ))}
      </div>
    </div>
  )
}
