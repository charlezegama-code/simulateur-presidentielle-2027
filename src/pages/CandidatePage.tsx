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
    <div className="space-y-5">
      <div className="space-y-1.5">
        <H1>
          {c.prenom} {c.nom}
        </H1>
        <p className="text-[var(--ink-soft)]">
          {c.parti} · {STATUT_LABELS[c.statut]} depuis le {dateFr(c.statutDate)} · données mises à jour le {dateFr(mf.dateMaj)}
        </p>
      </div>
      {c.note && <Notice>{c.note}</Notice>}
      {c.programme && (
        <p>
          <a href={c.programme.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[var(--accent-strong)] underline decoration-[var(--line-strong)] underline-offset-3 hover:decoration-[var(--accent)]">
            Programme ou page de propositions ↗
          </a>
        </p>
      )}
      <p className="text-sm text-[var(--ink-faint)]">
        {mf.mesures.length} mesures analysées. Les descriptions sont des paraphrases : consulte les sources pour le texte exact.
      </p>
      {THEMES.map((t) => {
        const ms = mf.mesures.filter((m) => m.theme === t)
        const sp = mf.sansPosition.find((s) => s.theme === t)
        return (
          <section key={t} aria-labelledby={`theme-${t}`}>
            <H2 id={`theme-${t}`}>{THEME_LABELS[t]}</H2>
            {ms.length === 0 && <p className="mt-2 text-[var(--ink-faint)]">Aucune position identifiée au {dateFr(sp?.dateRecherche ?? mf.dateMaj)}.</p>}
            <ul className="stagger mt-3 space-y-3">
              {ms.map((m) => (
                <li key={m.id} className="card space-y-2.5 p-4">
                  <p className="flex flex-wrap items-center gap-1.5 font-semibold text-[var(--ink)]">
                    <TypeBadge type={m.type} /> {m.intitule}
                    {m.statut !== 'active' && <span className="text-sm font-normal text-[var(--ink-faint)]">({m.statut === 'modifiee' ? 'modifiée' : 'abandonnée'})</span>}
                  </p>
                  <p className="text-[var(--ink)]">{m.description}</p>
                  <p className="text-sm text-[var(--ink-soft)]">
                    <span className="font-medium text-[var(--ink)]">Financement annoncé :</span>{' '}
                    {'nonPrecise' in m.financement ? 'non précisé par le candidat.' : m.financement.texte}
                  </p>
                  {m.contradictions.map((x, i) => (
                    <Notice key={i} tone="warn">
                      <span className="font-medium">Sources divergentes : </span>
                      {x.description}
                    </Notice>
                  ))}
                  {m.historique.length > 0 && (
                    <ul className="text-sm text-[var(--ink-soft)]">
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
      <p className="pt-4 text-sm text-[var(--ink-soft)]">
        Une erreur ou une source manquante ?{' '}
        <a href={ISSUE_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-[var(--accent-strong)] underline decoration-[var(--line-strong)] underline-offset-3 hover:decoration-[var(--accent)]">
          Signale-la avec la source correcte
        </a>
        .
      </p>
    </div>
  )
}
