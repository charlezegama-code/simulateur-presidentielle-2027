import type { EffectView } from '../engine/simulate'
import { euros } from '../lib/format'
import { SourceLinks, TypeBadge } from './ui'

const SENS = {
  positif: { symbol: '+', label: 'Avantage', cls: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100' },
  negatif: { symbol: '−', label: 'Inconvénient', cls: 'bg-rose-100 text-rose-900 dark:bg-rose-900/60 dark:text-rose-100' },
  neutre: { symbol: '=', label: 'Sans effet calculé', cls: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100' },
  incertain: { symbol: '?', label: 'Effet incertain', cls: 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100' },
} as const

const CONFIANCE = { haute: 'élevée', moyenne: 'moyenne', faible: 'faible' } as const

function MontantLine({ v }: { v: EffectView }) {
  const m = v.montant
  if (!m) return null
  if (m.kind === 'fourchette') {
    const u = m.unite === 'pct' ? ' %' : m.unite === 'eur_mois' ? ' par mois' : ' par an'
    return (
      <p className="font-semibold">
        {m.unite === 'pct' ? `${m.min} à ${m.max}` : `${euros(m.min)} à ${euros(m.max)}`}
        {u} <span className="font-normal text-slate-600 dark:text-slate-400">(chiffrage tiers)</span>
      </p>
    )
  }
  const perMonth = Math.round(m.annuel / 12)
  return (
    <p className="font-semibold tabular-nums">
      {euros(m.annuel, true)} par an{' '}
      <span className="font-normal text-slate-600 dark:text-slate-400">
        (≈ {euros(perMonth, true)} par mois{m.kind === 'consommation' ? ', estimation' : ''})
      </span>
    </p>
  )
}

export function EffectItem({ v }: { v: EffectView }) {
  const s = SENS[v.sens]
  const m = v.montant
  return (
    <li className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      <div className="flex items-start gap-2">
        <span aria-hidden="true" className={`mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full text-sm font-bold ${s.cls}`}>
          {s.symbol}
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p>
            <span className="sr-only">{s.label} : </span>
            {v.libelle}
          </p>
          <MontantLine v={v} />
          <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
            <TypeBadge type={v.type} />
            <span>{v.intituleMesure}</span>
          </p>
          {v.nonChiffreCar && <p className="text-sm text-slate-600 dark:text-slate-400">{v.nonChiffreCar}</p>}
          {v.sensDeclare && (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Le calcul pour ton profil donne un effet {v.sens === 'neutre' ? 'nul' : v.sens === 'positif' ? 'positif' : 'négatif'}, alors que la mesure
              vise un effet {v.sensDeclare === 'positif' ? 'positif' : v.sensDeclare === 'negatif' ? 'négatif' : 'différent'}.
            </p>
          )}
          <details className="group text-sm">
            <summary className="cursor-pointer py-1 text-indigo-700 underline underline-offset-2 dark:text-indigo-300">
              Hypothèses, limites et sources
            </summary>
            <div className="mt-2 space-y-2 text-slate-700 dark:text-slate-300">
              {m?.kind === 'castype' && (
                <div>
                  {m.detail.length > 0 && (
                    <>
                      <p className="font-medium">Détail du calcul</p>
                      <ul className="list-disc pl-5 tabular-nums">
                        {m.detail.map((d) => (
                          <li key={d.libelle}>
                            {d.libelle} : {euros(d.montant, true)} par an
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  <p className="mt-1">
                    Calculé avec OpenFisca-France {m.openfisca.version} (législation {m.openfisca.legislation}) pour un foyer comme le tien.
                  </p>
                </div>
              )}
              {m?.kind === 'bourse' && <p>Calculé à partir du barème officiel des bourses pour l’échelon {m.echelon === '0bis' ? '0 bis' : m.echelon}.</p>}
              {m?.kind === 'consommation' && (
                <p>
                  Estimation à partir des dépenses des ménages du {m.decile}ᵉ décile de niveau de vie ({m.typeMenage.toLowerCase()}) : environ{' '}
                  {euros(m.depense)} par an sur les postes concernés (INSEE, enquête Budget de famille 2017, en prix 2025).
                  {m.revenuApproche && ' Ton niveau de vie est approché à partir de ta tranche de revenu.'}
                </p>
              )}
              <div>
                <p className="font-medium">Hypothèses</p>
                <ul className="list-disc pl-5">
                  {v.hypotheses.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                  {m?.kind === 'castype' && m.hypothesesCommunes.map((h) => <li key={h}>{h}</li>)}
                </ul>
              </div>
              <div>
                <p className="font-medium">Ce que le calcul ne prend pas en compte</p>
                <ul className="list-disc pl-5">
                  {v.perimetre.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
              <p>
                <span className="font-medium">Financement annoncé :</span>{' '}
                {'nonPrecise' in v.financement ? 'non précisé par le candidat.' : v.financement.texte}
              </p>
              <p>
                <span className="font-medium">Échéance :</span> {v.horizon} · <span className="font-medium">Confiance :</span> {CONFIANCE[v.confiance]}
              </p>
              <div>
                <p className="font-medium">Sources</p>
                <SourceLinks sources={[...v.sources, ...('sources' in v.financement ? v.financement.sources : []), ...(m && 'sources' in m ? m.sources : [])].filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i)} />
              </div>
            </div>
          </details>
        </div>
      </div>
    </li>
  )
}
