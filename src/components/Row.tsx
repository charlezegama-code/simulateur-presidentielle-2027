import type { Candidate } from '../schema/candidate'
import type { EffectView } from '../engine/simulate'
import { euros } from '../lib/format'
import { Avatar } from './Avatar'
import { IconCoin, IconDocLines, IconFog } from './icons'

export type RowContent =
  | { kind: 'effect'; v: EffectView }
  | { kind: 'measure'; libelleCourt: string; type: 'chiffrable' | 'qualitatif' | 'flou' }
  | { kind: 'none'; date: string }

export function RowRight({ v }: { v: EffectView }) {
  if (v.type !== 'chiffre' || !v.montant) return <TypePictogram type={v.type} />
  const m = v.montant
  const tone = v.sens === 'positif' ? 'text-[var(--positive-strong)]' : v.sens === 'negatif' ? 'text-[var(--negative-strong)]' : 'text-[var(--ink)]'
  if (m.kind === 'fourchette') {
    if (m.unite === 'pct') {
      return (
        <span className={`text-right text-base font-extrabold leading-none ${tone}`}>
          {m.min} à {m.max}
          <span className="mt-0.5 block text-[11px] font-semibold text-[var(--ink-faint)]">%</span>
        </span>
      )
    }
    const div = m.unite === 'eur_mois' ? 1 : 12
    return (
      <span className={`text-right text-base font-extrabold leading-none ${tone}`}>
        {euros(m.min / div, true)}–{euros(m.max / div, true)}
        <span className="mt-0.5 block text-[11px] font-semibold text-[var(--ink-faint)]">/mois</span>
      </span>
    )
  }
  const perMonth = Math.round(m.annuel / 12)
  return (
    <span className={`text-right text-base font-extrabold leading-none ${tone}`}>
      {euros(perMonth, true)}
      <span className="mt-0.5 block text-[11px] font-semibold text-[var(--ink-faint)]">/mois</span>
    </span>
  )
}

export function TypePictogram({ type }: { type: 'chiffre' | 'chiffrable' | 'qualitatif' | 'flou' }) {
  const Icon = type === 'qualitatif' ? IconDocLines : type === 'flou' ? IconFog : IconCoin
  const label = type === 'qualitatif' ? 'Qualitatif' : type === 'flou' ? 'Flou' : 'Chiffré'
  return (
    <span className="flex flex-col items-end gap-1 text-[var(--ink-faint)]">
      <Icon className="size-4" />
      <span className="text-[11px] font-bold">{label}</span>
    </span>
  )
}

/** Ligne de liste unique pour Résultat (par thème) et Comparer : avatar, nom, libellé court, montant ou pictogramme. */
export function Row({ candidat, content, onClick }: { candidat: Candidate; content: RowContent; onClick?: () => void }) {
  if (content.kind === 'none') {
    return (
      <div className="row no-position">
        <Avatar candidat={candidat} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-[var(--ink)]">
            {candidat.prenom} {candidat.nom}
          </p>
          <p className="text-[13px] leading-snug text-[var(--ink-faint)]">Aucune position identifiée au {content.date}.</p>
        </div>
      </div>
    )
  }
  return (
    <button type="button" onClick={onClick} className="row raised">
      <Avatar candidat={candidat} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-[var(--ink)]">
          {candidat.prenom} {candidat.nom}
        </p>
        <p className="text-[13px] leading-snug text-[var(--ink-soft)]">{content.kind === 'effect' ? content.v.libelleCourtMesure : content.libelleCourt}</p>
      </div>
      {content.kind === 'effect' ? <RowRight v={content.v} /> : <TypePictogram type={content.type} />}
    </button>
  )
}
