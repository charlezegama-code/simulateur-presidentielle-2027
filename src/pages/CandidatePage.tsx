import { Link } from 'wouter'
import { Avatar, PhotoCredit } from '../components/Avatar'
import { IconChevronDown, IconExternal } from '../components/icons'
import { TopBar } from '../components/TopBar'
import { LINK, Notice, SourceLinks, TypeBadge } from '../components/ui'
import { candidates, measures } from '../data/loader'
import { THEMES, THEME_LABELS } from '../domain/theme'
import { dateFr, ISSUE_URL, STATUT_LABELS } from '../lib/format'

export function CandidatePage({ id }: { id: string }) {
  const c = candidates.candidats.find((x) => x.id === id)
  const mf = measures[`${id}.json`]
  if (!c || !mf) {
    return (
      <div className="space-y-4 px-5 pt-6">
        <TopBar title="Candidat·e introuvable" back />
        <Link href="/candidats" className={LINK}>
          Retour à la liste
        </Link>
      </div>
    )
  }
  const src = new Map(mf.sources.map((s) => [s.id, s]))
  const resolve = (ids: string[]) => ids.map((i) => src.get(i)!).filter(Boolean)

  return (
    <div className="pb-8">
      <TopBar title={`${c.prenom} ${c.nom}`} back />
      <div className="flex items-start gap-4 px-5 pt-2">
        <Avatar candidat={c} size="lg" />
        <div className="min-w-0 space-y-1 pt-1">
          <p className="text-[15px] font-semibold text-[var(--ink)]">{c.parti}</p>
          <p className="text-sm text-[var(--ink-soft)]">
            {STATUT_LABELS[c.statut]} depuis le {dateFr(c.statutDate)}
          </p>
          <p className="text-xs text-[var(--ink-faint)]">Données mises à jour le {dateFr(mf.dateMaj)}</p>
          <PhotoCredit candidat={c} />
        </div>
      </div>

      {c.note && (
        <div className="px-5 pt-4">
          <Notice>{c.note}</Notice>
        </div>
      )}
      {c.programme && (
        <p className="px-5 pt-3">
          <a href={c.programme.url} target="_blank" rel="noopener noreferrer" className={`${LINK} inline-flex items-center gap-1`}>
            Programme ou page de propositions <IconExternal className="size-3.5" />
          </a>
        </p>
      )}
      <p className="px-5 pt-3 text-sm text-[var(--ink-faint)]">
        {mf.mesures.length} mesures analysées. Les descriptions sont des paraphrases : consulte les sources pour le texte exact.
      </p>

      <div className="space-y-2 px-5 pt-5">
        {THEMES.map((t) => {
          const ms = mf.mesures.filter((m) => m.theme === t)
          const sp = mf.sansPosition.find((s) => s.theme === t)
          return (
            <details key={t} className="disclosure raised overflow-hidden rounded-2xl">
              <summary className="flex items-center justify-between gap-3 p-4">
                <span className="font-display font-bold text-[var(--ink)]">{THEME_LABELS[t]}</span>
                <span className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--ink-faint)]">{ms.length > 0 ? ms.length : 'aucune position'}</span>
                  <IconChevronDown className="chevron size-4 text-[var(--ink-faint)]" />
                </span>
              </summary>
              <div className="space-y-3 border-t border-[var(--line)] p-4">
                {ms.length === 0 && <p className="text-[var(--ink-faint)]">Aucune position identifiée au {dateFr(sp?.dateRecherche ?? mf.dateMaj)}.</p>}
                {ms.map((m) => (
                  <div key={m.id} className="space-y-2 rounded-xl bg-[var(--paper)] p-3.5">
                    <p className="flex flex-wrap items-center gap-1.5 font-bold text-[var(--ink)]">
                      <TypeBadge type={m.type} /> {m.intitule}
                      {m.statut !== 'active' && <span className="text-sm font-normal text-[var(--ink-faint)]">({m.statut === 'modifiee' ? 'modifiée' : 'abandonnée'})</span>}
                    </p>
                    <p className="text-[15px] text-[var(--ink)]">{m.description}</p>
                    <p className="text-sm text-[var(--ink-soft)]">
                      <span className="font-semibold text-[var(--ink)]">Financement annoncé :</span>{' '}
                      {'nonPrecise' in m.financement ? 'non précisé par le candidat.' : m.financement.texte}
                    </p>
                    {m.contradictions.map((x, i) => (
                      <Notice key={i} tone="warn">
                        <span className="font-semibold">Sources divergentes : </span>
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
                  </div>
                ))}
              </div>
            </details>
          )
        })}
      </div>

      <p className="px-5 pb-4 pt-6 text-sm text-[var(--ink-soft)]">
        Une erreur ou une source manquante ?{' '}
        <a href={ISSUE_URL} target="_blank" rel="noopener noreferrer" className={LINK}>
          Signale-la avec la source correcte
        </a>
        .
      </p>
    </div>
  )
}
