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
      <p>Toutes les mesures analysées, quel que soit ton profil. Les candidat·es apparaissent dans le même ordre aléatoire pour chaque thème.</p>
      <SeedBar />
      <nav aria-label="Thèmes" className="flex flex-wrap gap-2 text-sm">
        {THEMES.map((t) => (
          <a key={t} href={`#theme-${t}`} className="rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
            {THEME_LABELS[t]}
          </a>
        ))}
      </nav>
      {THEMES.map((t) => (
        <section key={t} aria-labelledby={`theme-${t}`} className="space-y-3">
          <h2 id={`theme-${t}`} className="scroll-mt-20 border-b border-slate-200 pt-4 text-xl font-bold dark:border-slate-800">
            {THEME_LABELS[t]}
          </h2>
          <dl className="space-y-3">
            {ordered.map((c) => {
              const mf = measures[`${c.id}.json`]
              const ms = mf.mesures.filter((m) => m.theme === t && m.statut !== 'abandonnee')
              const sp = mf.sansPosition.find((s) => s.theme === t)
              return (
                <div key={c.id}>
                  <dt className="font-semibold">
                    <Link href={`/candidat/${c.id}#theme-${t}`} className="underline decoration-slate-400 underline-offset-2">
                      {c.prenom} {c.nom}
                    </Link>
                  </dt>
                  <dd>
                    {ms.length > 0 ? (
                      <ul className="mt-1 space-y-1">
                        {ms.map((m) => (
                          <li key={m.id} className="flex flex-wrap items-center gap-1.5">
                            <TypeBadge type={m.type} /> {m.intitule}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-600 dark:text-slate-400">Aucune position identifiée au {dateFr(sp?.dateRecherche ?? mf.dateMaj)}.</p>
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
