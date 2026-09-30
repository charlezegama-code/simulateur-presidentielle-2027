import { useId, useState, type ReactNode } from 'react'

/** Définitions d'une ligne, en langage courant, pour les sigles inévitables dans les données. */
export const TERMS: Record<string, string> = {
  SMIC: 'Le salaire minimum légal en France, avant impôts.',
  RSA: 'Un revenu minimum garanti si tu as très peu ou pas de ressources.',
  APL: "Une aide de la CAF qui réduit ce que tu paies pour ton loyer.",
  AAH: 'Une allocation versée chaque mois aux personnes en situation de handicap.',
  CSG: 'Un prélèvement sur les revenus qui finance la Sécurité sociale (retraite, santé...).',
  CVEC: "Une somme payée une fois par an à l'inscription dans le supérieur (environ 100 €), qui finance des services aux étudiant·es.",
  DPE: "Le diagnostic de performance énergétique : une note (de A à G) qui dit si un logement consomme beaucoup ou peu d'énergie.",
  IR: 'L’impôt sur le revenu.',
  "prime d'activité": 'Un complément de revenu versé chaque mois aux personnes qui travaillent mais gagnent peu.',
  'quotient familial': "Un système qui réduit l'impôt selon le nombre de personnes dans ton foyer.",
  'quotient conjugal': "La règle qui calcule l'impôt sur les revenus additionnés du couple, pas sur chaque personne séparément.",
  décile: 'Un dixième des foyers français, classés du plus modeste au plus aisé.',
  barème: 'Le tableau de calcul officiel utilisé pour un impôt ou une aide.',
  BNC: 'Une catégorie fiscale pour les indépendant·es qui vendent des prestations (conseil, services...), plutôt que des biens.',
  cotisations: 'Les sommes prélevées sur ton salaire brut pour financer la Sécurité sociale et la retraite, avant que tu touches ton salaire net.',
  'taux plein': 'Le montant maximum de la pension de retraite, sans réduction (voir aussi « décote »).',
  annuités: 'Le nombre de trimestres ou d’années travaillées pris en compte pour calculer ta retraite.',
  décote: "Une réduction du montant d'une pension ou d'un impôt.",
  surcote: "Une augmentation du montant d'une pension quand tu travailles plus longtemps que nécessaire.",
  'seuil de dégressivité': "Le loyer au-delà duquel l'aide au logement diminue progressivement.",
  DREES: "Le service de statistiques du ministère de la Santé, qui publie les chiffres officiels utilisés ici.",
  'cas-type': "Une situation de référence utilisée pour illustrer un calcul, pas forcément ta situation exacte.",
}

const PATTERN = new RegExp(`\\b(${Object.keys(TERMS).map((t) => t.replace(/'/g, "['’]")).join('|')})\\b`, 'gi')

function TermTip({ term, definition }: { term: string; definition: string }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <span className="whitespace-nowrap">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        className="underline decoration-dotted decoration-[var(--accent)] decoration-2 underline-offset-3"
      >
        {term}
      </button>
      {open && (
        <span
          id={id}
          role="note"
          className="mx-1 inline-block rounded-md bg-[var(--accent-soft)] px-2 py-0.5 text-sm font-normal text-[var(--accent-strong)] whitespace-normal"
        >
          {' '}({definition}){' '}
        </span>
      )}
    </span>
  )
}

/**
 * Repère les sigles/termes techniques d'un texte et les rend tap-accessibles (définition d'une ligne, pas de lien
 * externe). Les autres mots restent inchangés.
 */
export function withGlossary(text: string): ReactNode[] {
  const parts = text.split(PATTERN)
  return parts.map((part, i) => {
    const key = Object.keys(TERMS).find((t) => t.toLowerCase() === part.toLowerCase())
    if (key) return <TermTip key={i} term={part} definition={TERMS[key]} />
    return <span key={i}>{part}</span>
  })
}
