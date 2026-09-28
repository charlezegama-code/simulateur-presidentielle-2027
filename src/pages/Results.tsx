import { useMemo } from 'react'
import { Link, Redirect } from 'wouter'
import { CandidateCard } from '../components/CandidateCard'
import { SeedBar } from '../components/SeedBar'
import { BUTTON_GHOST, BUTTON_SECONDARY, H1, Notice } from '../components/ui'
import { summarize } from '../domain/questionnaire'
import type { Profile } from '../domain/profile'
import { ecartChiffrage } from '../engine/compare'
import { simulate, type CandidateResult } from '../engine/simulate'
import { candidates, measures } from '../data/loader'
import { useShuffled } from '../lib/seed'
import { useDataset } from '../lib/useDataset'
import { useProfile } from '../state/profile'

const byCandidateId = (r: CandidateResult) => r.candidat.id

/** Minuscule initiale, sauf pour les sigles (AAH, HLM…). */
const lowerFirst = (t: string) => (t.length > 1 && t[1] === t[1].toLowerCase() ? t[0].toLowerCase() + t.slice(1) : t)

export function ProfileSummary({ profile }: { profile: Profile }) {
  const parts = summarize(profile).map((s) => s.reponse)
  return (
    <p className="rounded-full border border-[var(--line)] bg-[var(--paper-raised)] px-4 py-2 text-sm text-[var(--ink-soft)]">
      Ton profil : <span className="text-[var(--ink)]">{parts.map(lowerFirst).join(' · ')}</span>
    </p>
  )
}

export function Results() {
  const { profile } = useProfile()
  const { dataset, error } = useDataset()
  const results = useMemo(() => (profile && dataset ? simulate(profile, dataset) : []), [profile, dataset])
  const ordered = useShuffled(results, byCandidateId)
  const ecart = useMemo(() => ecartChiffrage(measures), [])
  const couverture = useMemo(() => {
    const n = Object.values(measures).map((mf) => mf.mesures.filter((m) => m.statut !== 'abandonnee').length)
    return { min: Math.min(...n), max: Math.max(...n) }
  }, [])
  const nonAnalyses = candidates.candidats.filter((c) => !c.analyse).length

  if (!profile) return <Redirect to="/questionnaire" />

  return (
    <div className="space-y-5">
      <H1>Ce qui changerait pour toi</H1>
      <ProfileSummary profile={profile} />
      <div className="flex flex-wrap gap-3">
        <Link href="/questionnaire" className={BUTTON_SECONDARY}>
          Modifier mes réponses
        </Link>
        <Link href="/comparer" className={BUTTON_SECONDARY}>
          Comparer par thème
        </Link>
      </div>
      <p className="text-sm text-[var(--ink-soft)]">
        Montants par an pour ton foyer. Pas de total : les mesures ne s’additionnent pas simplement. Sous chaque ligne, « Hypothèses, limites
        et sources » explique le calcul.
      </p>
      <Notice tone="warn">
        Les programmes ne sont pas tous aussi détaillés à ce jour : entre {couverture.min} et {couverture.max} mesures analysées selon les
        candidat·es
        {ecart > 0.25 && <>, et une part de mesures chiffrables qui varie de {Math.round(ecart * 100)} points</>}. Moins de lignes ou moins de
        chiffres ne veut pas dire moins d’effets : seulement des propositions moins précisées pour l’instant.
      </Notice>
      <SeedBar />
      {ordered.length > 0 && (
        <nav aria-label="Candidat·es" className="flex flex-wrap gap-2 text-sm">
          {ordered.map((r) => (
            <a
              key={r.candidat.id}
              href={`#cand-${r.candidat.id}`}
              className="rounded-full border border-[var(--line)] bg-[var(--paper-raised)] px-3 py-1.5 text-[var(--ink-soft)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-strong)]"
            >
              {r.candidat.prenom} {r.candidat.nom}
            </a>
          ))}
        </nav>
      )}
      {error && <Notice tone="warn">Impossible de charger les calculs ({error}). Recharge la page.</Notice>}
      {!dataset && !error && <p aria-live="polite">Calcul en cours…</p>}
      <div className="stagger space-y-6">
        {ordered.map((r) => (
          <CandidateCard key={r.candidat.id} r={r} nbMesures={measures[`${r.candidat.id}.json`].mesures.filter((m) => m.statut !== 'abandonnee').length} />
        ))}
      </div>
      <p className="text-sm text-[var(--ink-soft)]">
        {nonAnalyses} autres candidat·es déclaré·es ou pressenti·es ne sont pas encore analysé·es.{' '}
        <Link href="/candidats" className={BUTTON_GHOST}>
          Voir la liste et le critère retenu
        </Link>
      </p>
    </div>
  )
}
