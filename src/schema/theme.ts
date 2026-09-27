export const THEMES = [
  'fiscalite',
  'salaires',
  'retraites',
  'aides_sociales',
  'famille',
  'etudes',
  'logement',
  'emploi_chomage',
  'sante',
  'energie_prix',
  'service_national',
  'handicap',
] as const

export type Theme = (typeof THEMES)[number]

export const THEME_LABELS: Record<Theme, string> = {
  fiscalite: 'Impôts et prélèvements',
  salaires: 'SMIC et salaires',
  retraites: 'Retraites',
  aides_sociales: 'Aides sociales (RSA, prime d’activité…)',
  famille: 'Famille',
  etudes: 'Études',
  logement: 'Logement',
  emploi_chomage: 'Emploi et chômage',
  sante: 'Santé',
  energie_prix: 'Énergie et prix',
  service_national: 'Service militaire / civique',
  handicap: 'Handicap (AAH…)',
}
