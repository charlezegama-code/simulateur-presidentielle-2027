import { Link } from 'wouter'
import { H1, H2, Notice, SourceLinks, TypeBadge } from '../components/ui'
import { candidates, measures } from '../data/loader'
import { THEMES, THEME_LABELS } from '../domain/theme'
import { dateFr, ISSUE_URL, STATUT_LABELS } from '../lib/format'

export function CandidatePage({ id }: { id: string }) {
  const c = candidates.candidats.find((x) => x.id === id)
  const mf = measures[`${id}.json`]
  if (!c || !mf) {
    return (
      <div className="space-y-4">
        <H1>Candidat·e introuvable</H1>
        <Link href="/candidats" className="underline">
          Retour à la liste
        </Link>
      </div>
    )
  }
  const src = new Map(mf.sources.map((s) => [s.id, s]))
  const resolve = (ids: string[]) => ids.map((i) => src.get(i)!).filter(Boolean)
  return (
    <div className="space-y-4">
      <H1>
        {c.prenom} {c.nom}
      </H1>
      <p>
        {c.parti} · {STATUT_LABELS[c.statut]} depuis le {dateFr(c.statutDate)} · données mises à jour le {dateFr(mf.dateMaj)}
      </p>
      {c.note && <Notice>{c.note}</Notice>}
      {c.programme && (
        <p>
          <a href={c.programme.url} target="_blank" rel="noopener noreferrer" className="underline">
            Programme ou page de propositions
          </a>
        </p>
      )}
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {mf.mesures.length} mesures analysées. Les descriptions sont des paraphrases : consulte les sources pour le texte exact.
      </p>
      {THEMES.map((t) => {
        const ms = mf.mesures.filter((m) => m.theme === t)
        const sp = mf.sansPosition.find((s) => s.theme === t)
        return (
          <section key={t} aria-labelledby={`theme-${t}`}>
            <H2 id={`theme-${t}`}>{THEME_LABELS[t]}</H2>
            {ms.length === 0 && <p className="mt-2 text-slate-600 dark:text-slate-400">Aucune position identifiée au {dateFr(sp?.dateRecherche ?? mf.dateMaj)}.</p>}
            <ul className="mt-2 space-y-3">
              {ms.map((m) => (
                <li key={m.id} className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <p className="flex flex-wrap items-center gap-1.5 font-semibold">
                    <TypeBadge type={m.type} /> {m.intitule}
                    {m.statut !== 'active' && <span className="text-sm font-normal">({m.statut === 'modifiee' ? 'modifiée' : 'abandonnée'})</span>}
                  </p>
                  <p>{m.description}</p>
                  <p className="text-sm">
                    <span className="font-medium">Financement annoncé :</span>{' '}
                    {'nonPrecise' in m.financement ? 'non précisé par le candidat.' : m.financement.texte}
                  </p>
                  {m.contradictions.map((x, i) => (
                    <Notice key={i} tone="warn">
                      <span className="font-medium">Sources divergentes : </span>
                      {x.description}
                    </Notice>
                  ))}
                  {m.historique.length > 0 && (
                    <ul className="text-sm">
                      {m.historique.map((h, i) => (
                        <li key={i}>
                          {dateFr(h.date)} : {h.changement}
                        </li>
                      ))}
                    </ul>
                  )}
                  <SourceLinks sources={resolve(m.sourceIds)} />
                </li>
              ))}
            </ul>
          </section>
        )
      })}
      <p className="pt-4 text-sm">
        Une erreur ou une source manquante ?{' '}
        <a href={ISSUE_URL} target="_blank" rel="noopener noreferrer" className="underline">
          Signale-la avec la source correcte
        </a>
        .
      </p>
    </div>
  )
}
