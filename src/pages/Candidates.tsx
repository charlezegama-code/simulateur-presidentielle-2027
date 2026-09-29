import { Link } from 'wouter'
import { CandidateAvatar } from '../components/CandidateAvatar'
import { H1, Notice } from '../components/ui'
import { candidates } from '../data/loader'
import { dateFr, STATUT_LABELS } from '../lib/format'

const sorted = [...candidates.candidats].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

export function Candidates() {
  return (
    <div className="space-y-5">
      <H1>Les candidat·es</H1>
      <p className="text-[var(--ink-soft)]">Liste par ordre alphabétique des candidatures déclarées ou pressenties, avec leur statut et sa source.</p>
      <Notice>
        <p className="font-semibold">Quels programmes sont analysés ?</p>
        <p>{candidates.critereAnalyse}</p>
      </Notice>
      <ul className="stagger grid gap-3 sm:grid-cols-2">
        {sorted.map((c) => (
          <li key={c.id} className="card card-hover flex gap-3 p-4">
            <CandidateAvatar candidat={c} size="sm" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="font-display font-semibold text-[var(--ink)]">
                {c.analyse ? (
                  <Link href={`/candidat/${c.id}`} className="underline decoration-[var(--line-strong)] decoration-2 underline-offset-3 hover:decoration-[var(--accent)]">
                    {c.prenom} {c.nom}
                  </Link>
                ) : (
                  <>
                    {c.prenom} {c.nom}
                  </>
                )}{' '}
                <span className="font-sans font-normal text-[var(--ink-faint)]">— {c.parti}</span>
              </p>
              <p className="text-sm">
                <span className={c.analyse ? 'font-medium text-[var(--accent-strong)]' : 'text-[var(--ink-soft)]'}>
                  {c.analyse ? 'Programme analysé' : 'Programme non encore analysé'}
                </span>
                <span className="text-[var(--ink-faint)]">
                  {' '}
                  · {STATUT_LABELS[c.statut]} · {dateFr(c.statutDate)}
                </span>
              </p>
              {c.note && <p className="text-sm text-[var(--ink-soft)]">{c.note}</p>}
              <p className="text-xs text-[var(--ink-faint)]">
                Source :{' '}
                {c.sources
                  .filter((s) => c.statutSourceIds.includes(s.id))
                  .map((s, i) => (
                    <span key={s.id}>
                      {i > 0 && ', '}
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--line-strong)]">
                        {s.editeur}
                      </a>
                    </span>
                  ))}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-sm text-[var(--ink-faint)]">
        La liste officielle des candidat·es sera publiée par le Conseil constitutionnel après le dépôt des parrainages ; les statuts seront alors
        mis à jour.
      </p>
    </div>
  )
}
