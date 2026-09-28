import { Link } from 'wouter'
import { H1, Notice } from '../components/ui'
import { candidates } from '../data/loader'
import { dateFr, STATUT_LABELS } from '../lib/format'

const sorted = [...candidates.candidats].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))

export function Candidates() {
  return (
    <div className="space-y-5">
      <H1>Les candidat·es</H1>
      <p>Liste par ordre alphabétique des candidatures déclarées ou pressenties, avec leur statut et sa source.</p>
      <Notice>
        <p className="font-semibold">Quels programmes sont analysés ?</p>
        <p>{candidates.critereAnalyse}</p>
      </Notice>
      <ul className="divide-y divide-slate-200 dark:divide-slate-800">
        {sorted.map((c) => (
          <li key={c.id} className="py-3">
            <p className="font-semibold">
              {c.analyse ? (
                <Link href={`/candidat/${c.id}`} className="underline decoration-slate-400 underline-offset-2">
                  {c.prenom} {c.nom}
                </Link>
              ) : (
                <>
                  {c.prenom} {c.nom}
                </>
              )}{' '}
              <span className="font-normal text-slate-600 dark:text-slate-400">— {c.parti}</span>
            </p>
            <p className="text-sm">
              {STATUT_LABELS[c.statut]} · {dateFr(c.statutDate)} · {c.analyse ? 'programme analysé' : 'programme non encore analysé'}
            </p>
            {c.note && <p className="text-sm text-slate-600 dark:text-slate-400">{c.note}</p>}
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Source :{' '}
              {c.sources
                .filter((s) => c.statutSourceIds.includes(s.id))
                .map((s, i) => (
                  <span key={s.id}>
                    {i > 0 && ', '}
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline">
                      {s.editeur}
                    </a>
                  </span>
                ))}
            </p>
          </li>
        ))}
      </ul>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        La liste officielle des candidat·es sera publiée par le Conseil constitutionnel après le dépôt des parrainages ; les statuts seront alors
        mis à jour.
      </p>
    </div>
  )
}
