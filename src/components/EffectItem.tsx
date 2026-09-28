import type { EffectView } from '../engine/simulate'
import { euros } from '../lib/format'
import { withGlossary } from '../lib/glossary'
import { SourceLinks, TypeBadge } from './ui'

const SENS = {
  positif: { symbol: '↑', label: 'Avantage', cls: 'bg-[var(--positive-soft)] text-[var(--positive-strong)]' },
  negatif: { symbol: '↓', label: 'Inconvénient', cls: 'bg-[var(--negative-soft)] text-[var(--negative-strong)]' },
  neutre: { symbol: '=', label: 'Sans effet calculé', cls: 'bg-[var(--line)]/70 text-[var(--ink-soft)]' },
  incertain: { symbol: '?', label: 'Effet incertain', cls: 'bg-[var(--flou-soft)] text-[var(--flou)]' },
} as const

const CONFIANCE = { haute: 'élevée', moyenne: 'moyenne', faible: 'faible' } as const

/** Montant fondu dans la phrase du libellé, pour une lecture d'un seul tenant (« ce que ça change » + le chiffre). */
function MontantInline({ v }: { v: EffectView }) {
  const m = v.montant
  if (!m) return null
  if (m.kind === 'fourchette') {
    const u = m.unite === 'pct' ? ' %' : m.unite === 'eur_mois' ? ' par mois' : ' par an'
    return (
      <>
        {' '}
        : <strong className="font-semibold tabular-nums text-[var(--ink)]">
          {m.unite === 'pct' ? `${m.min} à ${m.max}` : `${euros(m.min)} à ${euros(m.max)}`}
          {u}
        </strong>{' '}
        <span className="text-sm font-normal text-[var(--ink-soft)]">(estimation d’un organisme extérieur)</span>
      </>
    )
  }
  const perMonth = Math.round(m.annuel / 12)
  return (
    <>
      {' '}
      : <strong className="font-semibold tabular-nums text-[var(--ink)]">environ {euros(perMonth, true)} par mois</strong>{' '}
      <span className="text-sm font-normal text-[var(--ink-soft)]">
        ({euros(m.annuel, true)} par an{m.kind === 'consommation' ? ', estimation' : ''})
      </span>
    </>
  )
}

export function EffectItem({ v }: { v: EffectView }) {
  const s = SENS[v.sens]
  const m = v.montant
  return (
    <li className="rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-4">
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className={`mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full text-base font-bold ${s.cls}`}>
          {s.symbol}
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <p className="leading-snug text-[var(--ink)]">
            <span className="sr-only">{s.label} : </span>
            {withGlossary(v.libelle)}
            <MontantInline v={v} />
          </p>
          {v.nonChiffreCar && <p className="text-sm text-[var(--ink-soft)]">{withGlossary(v.nonChiffreCar)}</p>}
          <p className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs text-[var(--ink-faint)]">
            <TypeBadge type={v.type} />
            <span>{withGlossary(v.intituleMesure)}</span>
          </p>
          {v.sensDeclare && (
            <p className="text-sm text-[var(--ink-soft)]">
              Le calcul pour ton profil donne un effet {v.sens === 'neutre' ? 'nul' : v.sens === 'positif' ? 'positif' : 'négatif'}, alors que la mesure
              vise un effet {v.sensDeclare === 'positif' ? 'positif' : v.sensDeclare === 'negatif' ? 'négatif' : 'différent'}.
            </p>
          )}
          <details className="group/d text-sm">
            <summary className="flex cursor-pointer select-none items-center gap-1.5 py-1.5 font-medium text-[var(--accent-strong)] marker:content-none">
              <span aria-hidden="true" className="inline-block text-[var(--accent)] transition-transform duration-200 group-open/d:rotate-90">
                ▸
              </span>
              Hypothèses, limites et sources
            </summary>
            <div className="mt-2 space-y-3 rounded-xl bg-[var(--paper)] p-3 text-[var(--ink-soft)]">
              {m?.kind === 'castype' && (
                <div>
                  {m.detail.length > 0 && (
                    <>
                      <p className="font-medium text-[var(--ink)]">Détail du calcul</p>
                      <ul className="list-disc space-y-0.5 pl-5 tabular-nums">
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
                  Estimation à partir des dépenses des ménages du {m.decile}ᵉ {withGlossary('décile')} de niveau de vie ({m.typeMenage.toLowerCase()}) :
                  environ {euros(m.depense)} par an sur les postes concernés (INSEE, enquête Budget de famille 2017, en prix 2025).
                  {m.revenuApproche && ' Ton niveau de vie est approché à partir de ta tranche de revenu.'}
                </p>
              )}
              <div>
                <p className="font-medium text-[var(--ink)]">Ce qu’on suppose pour calculer ce montant</p>
                <ul className="list-disc space-y-0.5 pl-5">
                  {v.hypotheses.map((h) => (
                    <li key={h}>{withGlossary(h)}</li>
                  ))}
                </ul>
              </div>
              {m?.kind === 'castype' && m.hypothesesCommunes.length > 0 && (
                <div>
                  <p className="font-medium text-[var(--ink)]">
                    Règles communes à tous les calculs de ce type (un cas de référence, pas forcément ta situation au détail près)
                  </p>
                  <ul className="list-disc space-y-0.5 pl-5">
                    {m.hypothesesCommunes.map((h) => (
                      <li key={h}>{withGlossary(h)}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="font-medium text-[var(--ink)]">Ce que ce calcul ne prend pas en compte</p>
                <ul className="list-disc space-y-0.5 pl-5">
                  {v.perimetre.map((h) => (
                    <li key={h}>{withGlossary(h)}</li>
                  ))}
                </ul>
              </div>
              <p>
                <span className="font-medium text-[var(--ink)]">Financement annoncé :</span>{' '}
                {'nonPrecise' in v.financement ? 'non précisé par le candidat.' : v.financement.texte}
              </p>
              <p>
                <span className="font-medium text-[var(--ink)]">Ça s’appliquerait :</span> {v.horizon} ·{' '}
                <span className="font-medium text-[var(--ink)]">Fiabilité de cette estimation :</span> {CONFIANCE[v.confiance]}
                {v.confiance === 'faible' && ' (à prendre avec prudence)'}
              </p>
              <div>
                <p className="font-medium text-[var(--ink)]">Sources</p>
                <SourceLinks
                  sources={[
                    ...v.sources,
                    ...('sources' in v.financement ? v.financement.sources : []),
                    ...(m && 'sources' in m ? m.sources : []),
                  ].filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i)}
                />
              </div>
            </div>
          </details>
        </div>
      </div>
    </li>
  )
}
