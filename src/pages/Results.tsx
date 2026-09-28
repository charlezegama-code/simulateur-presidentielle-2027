import { useMemo } from 'react'
import { Link, Redirect } from 'wouter'
import { CandidateCard } from '../components/CandidateCard'
import { SeedBar } from '../components/SeedBar'
import { BUTTON_SECONDARY, H1, Notice } from '../components/ui'
import { QUESTIONS } from '../domain/questionnaire'
import type { Profile } from '../domain/profile'
import { ecartChiffrage } from '../engine/compare'
import { simulate, type CandidateResult } from '../engine/simulate'
import { candidates, measures } from '../data/loader'
import { useShuffled } from '../lib/seed'
import { useDataset } from '../lib/useDataset'
import { useProfile } from '../state/profile'

const byCandidateId = (r: CandidateResult) => r.candidat.id

export function ProfileSummary({ profile }: { profile: Profile }) {
  const parts = QUESTIONS.flatMap((q) => {
    const v = profile[q.id]
    if (v === null || v === undefined) return []
    if (q.resume) return [q.resume(v)]
    const o = q.options(profile).find((x) => x.value === v)
    return o ? [o.label] : []
  })
  return <p className="text-sm text-slate-600 dark:text-slate-400">Ton profil : {parts.join(' · ').toLowerCase()}</p>
}

export function Results() {
  const { profile } = useProfile()
  const { dataset, error } = useDataset()
  const results = useMemo(() => (profile && dataset ? simulate(profile, dataset) : []), [profile, dataset])
  const ordered = useShuffled(results, byCandidateId)
  const ecart = useMemo(() => ecartChiffrage(measures), [])
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
      <p className="text-sm">
        Montants par an pour ton foyer. Pas de total : les mesures ne s’additionnent pas simplement. Sous chaque ligne, « Hypothèses, limites
        et sources » explique le calcul.
      </p>
      {ecart > 0.25 && (
        <Notice tone="warn">
          Les programmes ne sont pas tous aussi précis : la part de mesures chiffrables varie de {Math.round(ecart * 100)} points d’un·e candidat·e à
          l’autre. Un programme avec moins de chiffres n’a pas moins d’effets : ils sont seulement moins précisés à ce jour.
        </Notice>
      )}
      <SeedBar />
      {ordered.length > 0 && (
        <nav aria-label="Candidat·es" className="flex flex-wrap gap-2 text-sm">
          {ordered.map((r) => (
            <a key={r.candidat.id} href={`#cand-${r.candidat.id}`} className="rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">
              {r.candidat.prenom} {r.candidat.nom}
            </a>
          ))}
        </nav>
      )}
      {error && <Notice tone="warn">Impossible de charger les calculs ({error}). Recharge la page.</Notice>}
      {!dataset && !error && <p aria-live="polite">Calcul en cours…</p>}
      <div className="space-y-6">
        {ordered.map((r) => (
          <CandidateCard key={r.candidat.id} r={r} />
        ))}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {nonAnalyses} autres candidat·es déclaré·es ou pressenti·es ne sont pas encore analysé·es.{' '}
        <Link href="/candidats" className="underline">
          Voir la liste et le critère retenu
        </Link>
      </p>
    </div>
  )
}
