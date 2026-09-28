import { Link } from 'wouter'
import { BUTTON, BUTTON_SECONDARY, Kicker, Notice } from '../components/ui'
import { candidates, meta } from '../data/loader'
import { dateFr } from '../lib/format'
import { useProfile } from '../state/profile'

const STEPS = [
  { n: '1', titre: 'Réponds', texte: 'Une dizaine de questions sur ta situation : études, travail, logement, famille.' },
  { n: '2', titre: 'Découvre', texte: 'Pour chaque candidat·e, ce qui change pour toi : avantages et inconvénients, chiffrés quand c’est possible.' },
  { n: '3', titre: 'Compare', texte: 'Chaque ligne renvoie à sa source et à ses hypothèses. À toi de te faire un avis.' },
]

export function Home() {
  const { profile } = useProfile()
  const analysed = candidates.candidats.filter((c) => c.analyse).length
  return (
    <div className="stagger space-y-8">
      <div className="space-y-4">
        <Kicker>Présidentielle 2027</Kicker>
        <h1 className="text-balance font-display text-[2.3rem] font-semibold leading-[1.05] tracking-tight text-[var(--ink)] sm:text-[3.1rem]">
          Ce que les programmes changeraient <span className="text-[var(--accent)]">pour toi</span>.
        </h1>
        <p className="max-w-prose text-lg leading-relaxed text-[var(--ink-soft)]">
          Pas de score, pas de classement : juste les effets concrets des programmes sur ta situation, avantages et inconvénients, en 3 minutes.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/questionnaire" className={BUTTON}>
          {profile ? 'Modifier mes réponses' : 'Commencer (3 minutes)'}
        </Link>
        {profile && (
          <Link href="/resultats" className={BUTTON_SECONDARY}>
            Voir mes résultats
          </Link>
        )}
        <Link href="/comparer" className={BUTTON_SECONDARY}>
          Comparer les programmes
        </Link>
      </div>

      <ol className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((s) => (
          <li key={s.n} className="card space-y-1.5 p-4">
            <span
              aria-hidden="true"
              className="inline-flex size-8 items-center justify-center rounded-full bg-[var(--accent-soft)] font-display text-base font-semibold text-[var(--accent-strong)]"
            >
              {s.n}
            </span>
            <p className="font-semibold text-[var(--ink)]">{s.titre}</p>
            <p className="text-sm leading-relaxed text-[var(--ink-soft)]">{s.texte}</p>
          </li>
        ))}
      </ol>

      <Notice tone="warn">
        <p className="font-semibold">Simulation indicative, pas une consigne de vote.</p>
        <p>
          Les programmes peuvent évoluer et beaucoup de mesures ne sont pas encore assez précises pour être chiffrées. Il n’y a ni score ni
          classement. {analysed} programmes analysés. Dernière mise à jour : {dateFr(meta.dateMaj)}.
        </p>
      </Notice>

      <p className="text-sm text-[var(--ink-faint)]">
        Tes réponses restent dans ton navigateur : rien n’est envoyé, pas de compte, pas de mesure d’audience.{' '}
        <Link href="/neutralite" className="underline decoration-[var(--line-strong)] underline-offset-3 hover:text-[var(--ink)]">
          En savoir plus
        </Link>
      </p>
    </div>
  )
}
