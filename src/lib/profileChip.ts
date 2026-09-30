import type { Profile } from '../domain/profile'

const STATUT_COURT: Record<Profile['statutPro'], string> = {
  etudiant: 'Étudiant·e',
  alternant: 'Alternant·e',
  salarie_prive: 'Salarié·e',
  fonctionnaire: 'Fonctionnaire',
  independant: 'Indépendant·e',
  demandeur_emploi: 'Au chômage',
  retraite: 'Retraité·e',
  sans_activite: 'Sans activité',
}

const LOGEMENT_COURT: Record<Profile['logement'], string> = {
  locataire_prive: 'Locataire',
  locataire_social: 'Locataire HLM',
  proprietaire: 'Propriétaire',
  heberge: 'Hébergé·e',
}

/** Résumé court (2 éléments) pour la puce de profil — jamais une concaténation de tous les champs bruts. */
export function chipSummary(p: Profile): string {
  return `${STATUT_COURT[p.statutPro]} · ${LOGEMENT_COURT[p.logement]}`
}
