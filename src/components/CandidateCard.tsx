import { useState } from 'react'
import { Link } from 'wouter'
import { CandidateAvatar } from './CandidateAvatar'
import { THEME_LABELS } from '../domain/theme'
import { MAX_ITEMS_PAR_SENS, type CandidateResult, type EffectView } from '../engine/simulate'
import { dateFr, STATUT_LABELS } from '../lib/format'
import { EffectItem } from './EffectItem'
import { BUTTON_GHOST, TypeBadge } from './ui'

function Section({ titre, tone, items, vide }: { titre: string; tone: 'positive' | 'negative' | 'neutral'; items: EffectView[]; vide: string }) {
  const [all, setAll] = useState(false)
  const shown = all ? items : items.slice(0, MAX_ITEMS_PAR_SENS)
  const toneCls = tone === 'positive' ? 'text-[var(--positive-strong)]' : tone === 'negative' ? 'text-[var(--negative-strong)]' : 'text-[var(--ink-soft)]'
  return (
    <section className="space-y-2.5">
      <h4 className={`text-sm font-bold uppercase tracking-wide ${toneCls}`}>{titre}</h4>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--ink-faint)]">{vide}</p>
      ) : (
        <ul className="stagger space-y-2.5">
          {shown.map((v) => (
            <EffectItem key={v.effetId} v={v} />
          ))}
        </ul>
      )}
      {items.length > MAX_ITEMS_PAR_SENS && (
        <button type="button" onClick={() => setAll(!all)} className={BUTTON_GHOST}>
          {all ? 'Afficher moins' : `Voir les ${items.length - MAX_ITEMS_PAR_SENS} autres`}
        </button>
      )}
    </section>
  )
}

/** Résumé chiffré replié par défaut : compte réel pour CE profil, jamais silencieux quand il vaut zéro. */
function Summary({ r, expanded, onToggle }: { r: CandidateResult; expanded: boolean; onToggle: () => void }) {
  const nPos = r.positifs.length
  const nNeg = r.negatifs.length
  const rien = nPos === 0 && nNeg === 0
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {rien ? (
        <p className="text-sm font-medium text-[var(--ink-soft)]">Aucun avantage ni inconvénient identifié pour ton profil dans les mesures analysées.</p>
      ) : (
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className={`font-semibold ${nPos > 0 ? 'text-[var(--positive-strong)]' : 'text-[var(--ink-faint)]'}`}>
            {nPos > 0 ? `${nPos} avantage${nPos > 1 ? 's' : ''}` : 'Aucun avantage'}
          </span>
          <span aria-hidden="true" className="text-[var(--ink-faint)]">
            ·
          </span>
          <span className={`font-semibold ${nNeg > 0 ? 'text-[var(--negative-strong)]' : 'text-[var(--ink-faint)]'}`}>
            {nNeg > 0 ? `${nNeg} désavantage${nNeg > 1 ? 's' : ''}` : 'Aucun désavantage'}
          </span>
          <span className="text-[var(--ink-faint)]">pour ton profil</span>
        </p>
      )}
      {!rien && (
        <button type="button" onClick={onToggle} aria-expanded={expanded} className={BUTTON_GHOST}>
          {expanded ? 'Réduire' : 'Voir le détail'}
        </button>
      )}
    </div>
  )
}

/**
 * Carte candidat·e : même gabarit strict pour tout le monde, sur le modèle des professions de foi officielles —
 * photo au même format, puis nom, parti, statut ; résumé chiffré repliable, jamais une liste d'effets ouverte par
 * défaut (pour ne pas donner une impression uniformément positive) ; détails et sources repliables.
 */
export function CandidateCard({ r, nbMesures }: { r: CandidateResult; nbMesures: number }) {
  const c = r.candidat
  const id = `cand-${c.id}`
  const [expanded, setExpanded] = useState(false)
  const rien = r.positifs.length === 0 && r.negatifs.length === 0
  return (
    <article id={id} aria-labelledby={`${id}-titre`} className="card card-lift scroll-mt-24 space-y-5 p-5 sm:p-6">
      <header className="flex items-start gap-4 border-b border-[var(--line)] pb-4">
        <CandidateAvatar candidat={c} size="md" />
        <div className="min-w-0 space-y-1 pt-0.5">
          <h3 id={`${id}-titre`} className="font-display text-xl font-semibold tracking-tight text-[var(--ink)]">
            {c.prenom} {c.nom}
          </h3>
          <p className="text-sm text-[var(--ink-soft)]">
            {c.parti} · {STATUT_LABELS[c.statut]} depuis le {dateFr(c.statutDate)}
          </p>
          <p className="text-xs text-[var(--ink-faint)]">
            {nbMesures} mesures analysées à ce jour, dont {r.autresMesures.length} sans effet identifié pour ton profil
          </p>
        </div>
      </header>

      <Summary r={r} expanded={expanded} onToggle={() => setExpanded((v) => !v)} />

      {expanded && !rien && (
        <div className="q-enter space-y-5">
          <Section titre="Ce qui t’avantagerait" tone="positive" items={r.positifs} vide="Aucun avantage identifié pour ton profil dans les mesures analysées." />
          <Section titre="Ce qui te désavantagerait" tone="negative" items={r.negatifs} vide="Aucun inconvénient identifié pour ton profil dans les mesures analysées." />
          {r.autres.length > 0 && <Section titre="Effets incertains ou nuls" tone="neutral" items={r.autres} vide="" />}
        </div>
      )}

      {r.autresMesures.length > 0 && (
        <details className="group/m text-sm">
          <summary className="flex cursor-pointer select-none items-center gap-1.5 py-1 font-medium text-[var(--accent-strong)] marker:content-none">
            <span aria-hidden="true" className="inline-block text-[var(--accent)] transition-transform duration-200 group-open/m:rotate-90">
              ▸
            </span>
            Ce programme prévoit aussi {r.autresMesures.length} mesure(s) sans effet identifié pour ton profil
          </summary>
          <ul className="mt-2 space-y-1.5 pl-5">
            {r.autresMesures.map((m) => (
              <li key={m.mesureId} className="flex flex-wrap items-center gap-1.5 text-[var(--ink-soft)]">
                <TypeBadge type={m.type === 'chiffrable' ? 'chiffrable' : m.type} /> {m.intitule}{' '}
                <span className="text-[var(--ink-faint)]">({THEME_LABELS[m.theme]})</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      <p>
        <Link href={`/candidat/${c.id}`} className={BUTTON_GHOST}>
          Toutes les mesures et sources de {c.prenom} {c.nom} →
        </Link>
      </p>
    </article>
  )
}
