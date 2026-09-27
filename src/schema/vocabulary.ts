/**
 * Vocabulaire évaluatif interdit dans les textes de données (intitulés, descriptions, libellés, financement).
 * Les données décrivent ("propose", "prévoit"), elles ne jugent pas.
 */
export const FORBIDDEN_WORDS = [
  'irréaliste',
  'irréalistes',
  'réaliste',
  'réalistes',
  'démagogique',
  'démagogiques',
  'populiste',
  'populistes',
  'courageux',
  'courageuse',
  'audacieux',
  'audacieuse',
  'ambitieux',
  'ambitieuse',
  'généreux',
  'généreuse',
  'laxiste',
  'laxistes',
  'extrémiste',
  'extrémistes',
  'dangereux',
  'dangereuse',
  'absurde',
  'utopique',
  'utopiques',
  'scandaleux',
  'scandaleuse',
  'catastrophique',
  'désastreux',
  'désastreuse',
  'historique',
  'excellent',
  'excellente',
  'injuste',
  'injustes',
  'enfin',
  'hélas',
  'malheureusement',
  'heureusement',
] as const

const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(${FORBIDDEN_WORDS.join('|')})(?![\\p{L}\\p{N}])`, 'iu')

export function findForbiddenWord(text: string): string | null {
  const m = pattern.exec(text)
  return m ? m[1] : null
}
