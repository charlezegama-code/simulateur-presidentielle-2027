import { Link } from 'wouter'
import { BUTTON, BUTTON_SECONDARY, H1, Notice } from '../components/ui'
import { candidates, meta } from '../data/loader'
import { dateFr } from '../lib/format'
import { useProfile } from '../state/profile'

export function Home() {
  const { profile } = useProfile()
  const analysed = candidates.candidats.filter((c) => c.analyse).length
  return (
    <div className="space-y-6">
      <H1>Présidentielle 2027 : ce que les programmes changeraient pour toi</H1>
      <div className="space-y-2 text-lg">
        <p>Réponds à une dizaine de questions sur ta situation (études, travail, logement, famille).</p>
        <p>Pour chaque candidat·e, tu vois les avantages et les inconvénients de ses mesures pour toi, chiffrés quand c’est possible.</p>
        <p>Chaque ligne renvoie à sa source et à ses hypothèses de calcul.</p>
      </div>
      <Notice tone="warn">
        <p className="font-semibold">Simulation indicative, pas une consigne de vote.</p>
        <p>
          Les programmes peuvent évoluer et beaucoup de mesures ne sont pas encore assez précises pour être chiffrées. Il n’y a ni score ni
          classement. {analysed} programmes analysés. Dernière mise à jour : {dateFr(meta.dateMaj)}.
        </p>
      </Notice>
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
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Tes réponses restent dans ton navigateur : rien n’est envoyé, pas de compte, pas de mesure d’audience.{' '}
        <Link href="/neutralite" className="underline">
          En savoir plus
        </Link>
      </p>
    </div>
  )
}
