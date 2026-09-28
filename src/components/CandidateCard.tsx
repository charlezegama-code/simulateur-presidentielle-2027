import { useState } from 'react'
import { Link } from 'wouter'
import { THEME_LABELS } from '../domain/theme'
import { MAX_ITEMS_PAR_SENS, type CandidateResult, type EffectView } from '../engine/simulate'
import { dateFr, STATUT_LABELS } from '../lib/format'
import { EffectItem } from './EffectItem'
import { TypeBadge } from './ui'

function Section({ titre, items, vide }: { titre: string; items: EffectView[]; vide: string }) {
  const [all, setAll] = useState(false)
  const shown = all ? items : items.slice(0, MAX_ITEMS_PAR_SENS)
  return (
    <section className="space-y-2">
      <h4 className="font-semibold">
        {titre} <span className="font-normal text-slate-600 dark:text-slate-400">({items.length})</span>
      </h4>
      {items.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">{vide}</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((v) => (
            <EffectItem key={v.effetId} v={v} />
          ))}
        </ul>
      )}
      {items.length > MAX_ITEMS_PAR_SENS && (
        <button type="button" onClick={() => setAll(!all)} className="text-sm text-indigo-700 underline underline-offset-2 dark:text-indigo-300">
          {all ? 'Afficher moins' : `Voir les ${items.length - MAX_ITEMS_PAR_SENS} autres`}
        </button>
      )}
    </section>
  )
}

export function CandidateCard({ r }: { r: CandidateResult }) {
  const c = r.candidat
  const id = `cand-${c.id}`
  return (
    <article id={id} aria-labelledby={`${id}-titre`} className="scroll-mt-24 space-y-4 rounded-xl border border-slate-300 p-4 dark:border-slate-700">
      <header>
        <h3 id={`${id}-titre`} className="text-lg font-bold">
          {c.prenom} {c.nom}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {c.parti} · {STATUT_LABELS[c.statut]} depuis le {dateFr(c.statutDate)}
        </p>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
          Effets pour ton profil : {r.compteurs.chiffre} chiffré(s) · {r.compteurs.qualitatif} qualitatif(s) · {r.compteurs.flou} flou(s)
        </p>
      </header>
      <Section titre="Avantages pour toi" items={r.positifs} vide="Aucun avantage identifié pour ton profil dans les mesures analysées." />
      <Section titre="Inconvénients pour toi" items={r.negatifs} vide="Aucun inconvénient identifié pour ton profil dans les mesures analysées." />
      {r.autres.length > 0 && <Section titre="Effets incertains ou nuls" items={r.autres} vide="" />}
      {r.autresMesures.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer py-1 text-indigo-700 underline underline-offset-2 dark:text-indigo-300">
            Ce programme prévoit aussi {r.autresMesures.length} mesure(s) sans effet identifié pour ton profil
          </summary>
          <ul className="mt-2 space-y-1">
            {r.autresMesures.map((m) => (
              <li key={m.mesureId} className="flex flex-wrap items-center gap-1.5">
                <TypeBadge type={m.type === 'chiffrable' ? 'chiffrable' : m.type} /> {m.intitule}{' '}
                <span className="text-slate-600 dark:text-slate-400">({THEME_LABELS[m.theme]})</span>
              </li>
            ))}
          </ul>
        </details>
      )}
      <p>
        <Link href={`/candidat/${c.id}`} className="text-sm font-medium text-indigo-700 underline underline-offset-2 dark:text-indigo-300">
          Toutes les mesures et sources de {c.prenom} {c.nom}
        </Link>
      </p>
    </article>
  )
}
