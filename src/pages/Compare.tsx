import { Link } from 'wouter'
import { SeedBar } from '../components/SeedBar'
import { H1, TypeBadge } from '../components/ui'
import { candidates, measures } from '../data/loader'
import { THEMES, THEME_LABELS } from '../domain/theme'
import { dateFr } from '../lib/format'
import { useShuffled } from '../lib/seed'
import type { Candidate } from '../schema/candidate'

const byId = (c: Candidate) => c.id
const analysed = candidates.candidats.filter((c) => c.analyse)

export function Compare() {
  const ordered = useShuffled(analysed, byId)
  return (
    <div className="space-y-5">
      <H1>Comparer les programmes par thème</H1>
      <p className="text-[var(--ink-soft)]">Toutes les mesures analysées, quel que soit ton profil. Les candidat·es apparaissent dans le même ordre aléatoire pour chaque thème.</p>
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
      {THEMES.map((t) => (
        <section key={t} aria-labelledby={`theme-${t}`} className="card space-y-4 p-5 sm:p-6">
          <h2 id={`theme-${t}`} className="scroll-mt-20 font-display text-xl font-semibold tracking-tight text-[var(--ink)] sm:text-2xl">
            {THEME_LABELS[t]}
          </h2>
          <dl className="stagger divide-y divide-[var(--line)]">
            {ordered.map((c) => {
              const mf = measures[`${c.id}.json`]
              const ms = mf.mesures.filter((m) => m.theme === t && m.statut !== 'abandonnee')
              const sp = mf.sansPosition.find((s) => s.theme === t)
              return (
                <div key={c.id} className="py-3.5 first:pt-0 last:pb-0">
                  <dt className="font-semibold">
                    <Link href={`/candidat/${c.id}#theme-${t}`} className="text-[var(--ink)] underline decoration-[var(--line-strong)] decoration-2 underline-offset-3 hover:decoration-[var(--accent)]">
                      {c.prenom} {c.nom}
                    </Link>
                  </dt>
                  <dd>
                    {ms.length > 0 ? (
                      <ul className="mt-1.5 space-y-1.5">
                        {ms.map((m) => (
                          <li key={m.id} className="flex flex-wrap items-center gap-1.5 text-[var(--ink-soft)]">
                            <TypeBadge type={m.type} /> {m.intitule}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-1 text-sm text-[var(--ink-faint)]">Aucune position identifiée au {dateFr(sp?.dateRecherche ?? mf.dateMaj)}.</p>
                    )}
                  </dd>
                </div>
              )
            })}
          </dl>
        </section>
      ))}
    </div>
  )
}
