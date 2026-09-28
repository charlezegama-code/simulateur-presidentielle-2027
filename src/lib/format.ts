const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export function euros(n: number, signed = false): string {
  const s = eur.format(Math.abs(n))
  if (!signed) return n < 0 ? `−${s}` : s
  return n > 0 ? `+${s}` : n < 0 ? `−${s}` : s
}

export function dateFr(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
}

export const STATUT_LABELS = {
  declare: 'Déclaré·e',
  pressenti: 'Pressenti·e',
  officiel: 'Officiel (liste du Conseil constitutionnel)',
  retire: 'Retiré·e',
} as const

export const REPO_URL = 'https://github.com/charlezegama-code/simulateur-presidentielle-2027'
export const ISSUE_URL = `${REPO_URL}/issues/new?template=erreur-donnees.yml`
