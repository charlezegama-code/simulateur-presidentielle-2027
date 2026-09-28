/**
 * Questionnaire : découle directement des règles du profil (src/domain/profile.ts) et donc de la grille de calcul.
 * Chaque combinaison de réponses possibles correspond à une case calculée (test : tests/questionnaire.test.ts).
 */
import {
  AGES_PAR_STATUT,
  CONJOINT_LABELS,
  CONJOINT_TRANCHES,
  ECHELONS,
  REVENU_LABELS,
  REVENUS_PAR_STATUT,
  ZONE_APL_LABELS,
  ZONES_APL,
  type Profile,
} from './profile'

export type Draft = Partial<Profile>
export type Value = string | boolean

export interface Option {
  value: Value
  label: string
  detail?: string
}

export interface Question {
  id: keyof Profile
  titre: string
  /** Titre adapté aux réponses précédentes. */
  titreSelon?: (d: Draft) => string
  aide?: string
  /** Formulation courte de la réponse pour le résumé du profil (par défaut : libellé de l'option). */
  resume?: (v: Value) => string
  options: (d: Draft) => Option[]
  applies: (d: Draft) => boolean
}

const AGE_LABELS: Record<string, string> = {
  '18-24': '18 à 24 ans',
  '25-34': '25 à 34 ans',
  '35-49': '35 à 49 ans',
  '50-61': '50 à 61 ans',
  '62+': '62 ans ou plus',
}

const REVENU_QUESTION: Record<string, string> = {
  etudiant: 'Combien gagnes-tu avec un job, par mois ?',
  alternant: 'Combien gagnes-tu en alternance, par mois ?',
  salarie_prive: 'Quel est ton salaire net par mois ?',
  fonctionnaire: 'Quel est ton salaire net par mois ?',
  independant: 'Quel est ton revenu d’activité par mois ?',
  demandeur_emploi: 'Combien touches-tu d’allocation chômage par mois ?',
  retraite: 'Quel est le montant de ta pension par mois ?',
  sans_activite: 'Quels sont tes revenus d’activité ?',
}

const yesNo = (oui: string, non: string): Option[] => [
  { value: true, label: oui },
  { value: false, label: non },
]

export const QUESTIONS: Question[] = [
  {
    id: 'statutPro',
    titre: 'Quelle est ta situation principale ?',
    applies: () => true,
    options: () => [
      { value: 'etudiant', label: 'Étudiant·e' },
      { value: 'alternant', label: 'En alternance ou en apprentissage' },
      { value: 'salarie_prive', label: 'Salarié·e du privé' },
      { value: 'fonctionnaire', label: 'Fonctionnaire' },
      { value: 'independant', label: 'Indépendant·e ou micro-entrepreneur·e' },
      { value: 'demandeur_emploi', label: 'Au chômage, inscrit·e à France Travail' },
      { value: 'retraite', label: 'Retraité·e' },
      { value: 'sans_activite', label: 'Sans activité' },
    ],
  },
  {
    id: 'ageTranche',
    titre: 'Quel âge as-tu ?',
    applies: () => true,
    options: (d) => (d.statutPro ? AGES_PAR_STATUT[d.statutPro] : []).map((a) => ({ value: a, label: AGE_LABELS[a] })),
  },
  {
    id: 'echelonBourse',
    titre: 'Es-tu boursier·e sur critères sociaux ?',
    resume: (v) => (v === 'non_boursier' ? 'non boursier·e' : v === 'inconnu' ? 'boursier·e (échelon inconnu)' : `boursier·e échelon ${v === '0bis' ? '0 bis' : v}`),
    aide: 'L’échelon figure sur ta notification de bourse du Crous. Si tu ne le connais pas, choisis « Oui, échelon inconnu ».',
    applies: (d) => d.statutPro === 'etudiant',
    options: () => [
      { value: 'non_boursier', label: 'Non' },
      ...ECHELONS.map((e) => ({ value: e, label: `Oui, échelon ${e === '0bis' ? '0 bis' : e}` })),
      { value: 'inconnu', label: 'Oui, échelon inconnu' },
    ],
  },
  {
    id: 'revenuTranche',
    titre: 'Tes revenus',
    titreSelon: (d) => (d.statutPro ? REVENU_QUESTION[d.statutPro] : 'Tes revenus'),
    applies: (d) => !!d.statutPro && REVENUS_PAR_STATUT[d.statutPro].length > 1,
    options: (d) => (d.statutPro ? REVENUS_PAR_STATUT[d.statutPro] : []).map((r) => ({ value: r, label: REVENU_LABELS[r] })),
  },
  {
    id: 'couple',
    titre: 'Vis-tu en couple ?',
    resume: (v) => (v ? 'en couple' : 'seul·e'),
    aide: 'Marié·e, pacsé·e ou en concubinage, dans le même logement.',
    applies: () => true,
    options: () => yesNo('Oui', 'Non'),
  },
  {
    id: 'revenuConjointTranche',
    titre: 'Combien gagne ton ou ta conjoint·e, par mois ?',
    resume: (v) => `conjoint·e : ${CONJOINT_LABELS[v as keyof typeof CONJOINT_LABELS].toLowerCase()}`,
    applies: (d) => d.couple === true,
    options: () => CONJOINT_TRANCHES.map((c) => ({ value: c, label: CONJOINT_LABELS[c] })),
  },
  {
    id: 'enfants',
    titre: 'Combien d’enfants as-tu à charge ?',
    resume: (v) => (v === '0' ? 'sans enfant' : v === '1' ? '1 enfant' : v === '2' ? '2 enfants' : '3 enfants ou plus'),
    applies: () => true,
    options: () => [
      { value: '0', label: 'Aucun' },
      { value: '1', label: '1 enfant' },
      { value: '2', label: '2 enfants' },
      { value: '3+', label: '3 enfants ou plus' },
    ],
  },
  {
    id: 'logement',
    titre: 'Où vis-tu ?',
    applies: () => true,
    options: () => [
      { value: 'locataire_prive', label: 'Je suis locataire (propriétaire privé)', detail: 'Y compris résidence étudiante privée' },
      { value: 'locataire_social', label: 'Je suis locataire HLM', detail: 'Y compris résidence Crous' },
      { value: 'proprietaire', label: 'Je suis propriétaire' },
      { value: 'heberge', label: 'Je suis hébergé·e gratuitement', detail: 'Chez mes parents, des proches…' },
    ],
  },
  {
    id: 'zoneApl',
    titre: 'Dans quel type d’endroit ?',
    aide: 'C’est le découpage utilisé pour calculer les aides au logement. Tu peux vérifier ta commune sur service-public.fr.',
    applies: () => true,
    options: () => ZONES_APL.map((z) => ({ value: z, label: ZONE_APL_LABELS[z].titre, detail: ZONE_APL_LABELS[z].detail })),
  },
  {
    id: 'handicapAAH',
    titre: 'Touches-tu l’allocation aux adultes handicapés (AAH) ?',
    resume: (v) => (v ? 'AAH' : 'sans AAH'),
    applies: () => true,
    options: () => yesNo('Oui', 'Non'),
  },
  {
    id: 'vehicule',
    titre: 'As-tu une voiture ?',
    resume: (v) => (v ? 'avec voiture' : 'sans voiture'),
    aide: 'Sert à estimer l’effet des mesures sur le prix des carburants.',
    applies: () => true,
    options: () => yesNo('Oui', 'Non'),
  },
]

export function questionsFor(d: Draft): Question[] {
  return QUESTIONS.filter((q) => q.applies(d))
}

/** Réponse qui n'a plus de sens après un changement en amont : on l'efface. */
export function applyAnswer(d: Draft, id: keyof Profile, value: Value): Draft {
  const next: Draft = { ...d, [id]: value }
  if (id === 'statutPro') {
    const s = value as Profile['statutPro']
    if (next.ageTranche && !AGES_PAR_STATUT[s].includes(next.ageTranche)) delete next.ageTranche
    if (next.revenuTranche && !REVENUS_PAR_STATUT[s].includes(next.revenuTranche)) delete next.revenuTranche
    if (s !== 'etudiant') delete next.echelonBourse
  }
  if (id === 'couple' && value === false) delete next.revenuConjointTranche
  return next
}

/** Complète les champs déterminés (non demandés) et renvoie un profil complet, ou null s'il manque une réponse. */
export function finalize(d: Draft): Profile | null {
  if (!d.statutPro) return null
  const revenus = REVENUS_PAR_STATUT[d.statutPro]
  const p: Draft = {
    ...d,
    echelonBourse: d.statutPro === 'etudiant' ? d.echelonBourse : null,
    revenuTranche: revenus.length === 1 ? revenus[0] : d.revenuTranche,
    revenuConjointTranche: d.couple ? d.revenuConjointTranche : null,
  }
  const required: (keyof Profile)[] = ['statutPro', 'ageTranche', 'revenuTranche', 'couple', 'enfants', 'logement', 'zoneApl', 'handicapAAH', 'vehicule']
  if (required.some((k) => p[k] === undefined)) return null
  if (p.statutPro === 'etudiant' && !p.echelonBourse) return null
  if (p.couple && !p.revenuConjointTranche) return null
  return p as Profile
}
