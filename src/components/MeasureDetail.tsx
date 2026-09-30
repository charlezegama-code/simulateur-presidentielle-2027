import type { Measure } from '../schema/measure'
import type { Source } from '../schema/common'
import { Notice, SourceLinks, TypeBadge } from './ui'
import { Sheet } from './Sheet'

/** Feuille de détail d'une mesure (Comparer, indépendant du profil) : pas de montant personnalisé, juste le type. */
export function MeasureDetail({ m, sources, open, onClose }: { m: Measure | null; sources: Source[]; open: boolean; onClose: () => void }) {
  if (!m) return null
  const bySourceId = new Map(sources.map((s) => [s.id, s]))
  const resolve = (ids: string[]) => ids.map((i) => bySourceId.get(i)).filter((s): s is Source => !!s)
  const financementSources = 'nonPrecise' in m.financement ? [] : resolve(m.financement.sourceIds)
  return (
    <Sheet open={open} onClose={onClose} title={m.intitule}>
      <div className="space-y-4">
        <TypeBadge type={m.type} />
        <p className="leading-relaxed text-[var(--ink)]">{m.description}</p>
        {m.contradictions.map((x, i) => (
          <Notice key={i} tone="warn">
            <span className="font-semibold">Sources divergentes : </span>
            {x.description}
          </Notice>
        ))}
        <p className="text-sm text-[var(--ink-soft)]">
          <span className="font-semibold text-[var(--ink)]">Financement annoncé :</span>{' '}
          {'nonPrecise' in m.financement ? 'non précisé par le candidat.' : m.financement.texte}
        </p>
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink-faint)]">Source{resolve(m.sourceIds).length + financementSources.length > 1 ? 's' : ''}</p>
          <SourceLinks sources={[...resolve(m.sourceIds), ...financementSources].filter((s, i, a) => a.findIndex((x) => x.id === s.id) === i)} />
        </div>
      </div>
    </Sheet>
  )
}
