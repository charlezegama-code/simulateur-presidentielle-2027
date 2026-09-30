import type { EffectView } from '../engine/simulate'
import { RowRight } from './Row'

/** Ligne compacte d'un effet (vue « Par candidat ») : pas d'avatar, la carte entière est déjà pour un seul candidat. */
export function EffectRow({ v, onClick }: { v: EffectView; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="row raised">
      <p className="min-w-0 flex-1 truncate text-left text-sm font-semibold text-[var(--ink)]">{v.libelleCourtMesure}</p>
      <RowRight v={v} />
    </button>
  )
}
