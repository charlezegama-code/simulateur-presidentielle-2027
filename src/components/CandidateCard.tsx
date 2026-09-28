import { useState } from 'react'
import { Link } from 'wouter'
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

export function CandidateCard({ r, nbMesures }: { r: CandidateResult; nbMesures: number }) {
  const c = r.candidat
  const id = `cand-${c.id}`
  return (
    <article id={id} aria-labelledby={`${id}-titre`} className="card card-lift scroll-mt-24 space-y-5 p-5 sm:p-6">
      <header className="space-y-1 border-b border-[var(--line)] pb-4">
        <h3 id={`${id}-titre`} className="font-display text-xl font-semibold tracking-tight text-[var(--ink)]">
          {c.prenom} {c.nom}
        </h3>
        <p className="text-sm text-[var(--ink-soft)]">
          {c.parti} · {STATUT_LABELS[c.statut]} depuis le {dateFr(c.statutDate)}
        </p>
        <p className="text-xs text-[var(--ink-faint)]">
          {nbMesures} mesures analysées à ce jour, dont {r.autresMesures.length} sans effet identifié pour ton profil
        </p>
      </header>
      <Section titre="Avantages pour toi" tone="positive" items={r.positifs} vide="Aucun avantage identifié pour ton profil dans les mesures analysées." />
      <Section titre="Inconvénients pour toi" tone="negative" items={r.negatifs} vide="Aucun inconvénient identifié pour ton profil dans les mesures analysées." />
      {r.autres.length > 0 && <Section titre="Effets incertains ou nuls" tone="neutral" items={r.autres} vide="" />}
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
