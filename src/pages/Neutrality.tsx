import { TopBar } from '../components/TopBar'
import { BUTTON_SECONDARY, H2, LINK } from '../components/ui'
import { MAX_ITEMS_PAR_SENS } from '../engine/simulate'
import { REPO_URL } from '../lib/format'
import { useProfile } from '../state/profile'

export function Neutrality() {
  return (
    <div className="space-y-4 px-5 pb-8 pt-2">
      <TopBar title="Neutralité et vie privée" back />
      <p className="text-[var(--ink-soft)]">Cet outil décrit des effets : il ne dit pas pour qui voter. Voici les règles appliquées, vérifiables dans le code public.</p>

      <H2>Les mêmes règles pour tout le monde</H2>
      <ul className="list-disc space-y-1.5 pl-5 text-[var(--ink)]">
        <li>Même fiche pour chaque candidat·e, même nombre maximal d'avantages et d'inconvénients affichés ({MAX_ITEMS_PAR_SENS} de chaque).</li>
        <li>Pas de score, pas de total, pas de « meilleur candidat ».</li>
        <li>Ordre d'affichage tiré au hasard à chaque visite, jamais selon les sondages. Le numéro du tirage est affiché : le même lien redonne le même ordre.</li>
        <li>Vocabulaire descriptif (« propose », « prévoit ») : les mots qui jugent une mesure sont bloqués automatiquement dans les données.</li>
        <li>Pour chaque mesure : financement annoncé par le candidat, ou mention « non précisé ».</li>
        <li>Les avantages et les inconvénients sont montrés, y compris les hausses de prix ou d'impôts et les conditions durcies.</li>
        <li>Un compte n'est jamais montré isolé : toujours rapporté au nombre de mesures analysées pour ce candidat.</li>
        <li>Une vérification automatique contrôle ces règles avant chaque mise en ligne ; un audit indépendant relit les données.</li>
      </ul>

      <H2>Tes réponses restent chez toi</H2>
      <p className="text-[var(--ink-soft)]">
        Les opinions politiques sont des données sensibles (article 9 du RGPD). Cet outil ne demande pas ton opinion, et tes réponses sur ta
        situation ne quittent jamais ton téléphone :
      </p>
      <ul className="list-disc space-y-1.5 pl-5 text-[var(--ink)]">
        <li>pas de compte, pas de serveur de calcul, pas de mesure d'audience, pas de cookie ;</li>
        <li>le calcul se fait dans ton navigateur à partir de fichiers identiques pour tous les visiteurs ;</li>
        <li>pendant le questionnaire, tes réponses sont gardées le temps que l'onglet reste ouvert (pour survivre à un rechargement accidentel) ;</li>
        <li>une fois le questionnaire terminé, tes réponses ne sont enregistrées durablement que si tu coches « se souvenir » ;</li>
        <li>le lien de partage ne contient que le numéro de tirage de l'ordre, jamais tes réponses ;</li>
        <li>la politique de sécurité du site interdit toute connexion vers un autre domaine.</li>
      </ul>
      <ForgetButton />
      <p className="text-[var(--ink-soft)]">
        Code source et données :{' '}
        <a href={REPO_URL} className={LINK} target="_blank" rel="noopener noreferrer">
          {REPO_URL.replace('https://', '')}
        </a>
      </p>
    </div>
  )
}

function ForgetButton() {
  const { profile, setProfile, setRemember } = useProfile()
  if (!profile) return <p className="text-sm text-[var(--ink-faint)]">Aucune réponse n'est enregistrée.</p>
  return (
    <button
      type="button"
      className={BUTTON_SECONDARY}
      onClick={() => {
        setRemember(false)
        setProfile(null)
      }}
    >
      Effacer mes réponses de cet appareil
    </button>
  )
}
