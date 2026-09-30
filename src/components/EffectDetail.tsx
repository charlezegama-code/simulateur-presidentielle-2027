import type { EffectView } from '../engine/simulate'
import { euros } from '../lib/format'
import { Sheet } from './Sheet'
import { SourceLinks, TypeBadge } from './ui'

function BigAmount({ v }: { v: EffectView }) {
  if (v.type !== 'chiffre' || !v.montant) {
    return (
      <div className="flex items-center gap-2">
        <TypeBadge type={v.type} />
      </div>
    )
  }
  const m = v.montant
  const tone = v.sens === 'positif' ? 'text-[var(--positive-strong)]' : v.sens === 'negatif' ? 'text-[var(--negative-strong)]' : 'text-[var(--ink)]'
  if (m.kind === 'fourchette') {
    const u = m.unite === 'pct' ? ' %' : m.unite === 'eur_mois' ? ' € / mois' : ' € / an'
    return (
      <p className={`font-display text-3xl font-extrabold tabular-nums ${tone}`}>
        {m.min} à {m.max}
        <span className="text-lg font-bold">{u}</span>
      </p>
    )
  }
  const perMonth = Math.round(m.annuel / 12)
  return (
    <div>
      <p className={`font-display text-3xl font-extrabold tabular-nums ${tone}`}>
        {euros(perMonth, true)}
        <span className="text-lg font-bold"> / mois</span>
      </p>
      <p className="text-sm text-[var(--ink-faint)]">soit {euros(m.annuel, true)} par an{m.kind === 'consommation' ? ', estimation' : ''}</p>
    </div>
  )
}

/**
 * Feuille de détail d'un effet : titre, montant en gros, phrase en langage courant, hypothèses (3 max), limites,
 * bouton source. Pas de mur de texte (voir docs/ux-spec.md « Résultat »).
 */
export function EffectDetail({ v, open, onClose }: { v: EffectView | null; open: boolean; onClose: () => void }) {
  if (!v) return null
  const sources = [...v.sources, ...('sources' in v.financement ? v.financement.sources : [])].filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i)
  return (
    <Sheet open={open} onClose={onClose} title={v.intituleMesure}>
      <div className="space-y-4">
        <BigAmount v={v} />
        <p className="leading-relaxed text-[var(--ink)]">{v.libelle}</p>
        {v.nonChiffreCar && <p className="text-sm leading-relaxed text-[var(--ink-soft)]">{v.nonChiffreCar}</p>}
        {v.sensDeclare && (
          <p className="text-sm leading-relaxed text-[var(--ink-soft)]">
            Le calcul pour ton profil donne un effet {v.sens === 'neutre' ? 'nul' : v.sens === 'positif' ? 'positif' : 'négatif'}, alors que la
            mesure vise un effet {v.sensDeclare === 'positif' ? 'positif' : v.sensDeclare === 'negatif' ? 'négatif' : 'différent'}.
          </p>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-faint)]">Hypothèses</p>
          <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-[var(--ink-soft)]">
            {v.hypotheses.slice(0, 3).map((h) => (
              <li key={h} className="flex gap-2">
                <span aria-hidden="true" className="text-[var(--accent)]">
                  ·
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-faint)]">Ce que le calcul ne prend pas en compte</p>
          <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-[var(--ink-soft)]">
            {v.perimetre.map((h) => (
              <li key={h} className="flex gap-2">
                <span aria-hidden="true" className="text-[var(--accent)]">
                  ·
                </span>
                {h}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-[var(--ink-soft)]">
          <span className="font-semibold text-[var(--ink)]">Financement annoncé :</span>{' '}
          {'nonPrecise' in v.financement ? 'non précisé par le candidat.' : v.financement.texte}
        </p>

        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink-faint)]">Source{sources.length > 1 ? 's' : ''}</p>
          <SourceLinks sources={sources} />
        </div>
      </div>
    </Sheet>
  )
}
