import type { Candidate } from '../schema/candidate'

const SIZES = {
  chip: 'size-7 text-[11px]',
  sm: 'size-10 text-xs',
  md: 'size-14 text-base',
  lg: 'size-24 text-2xl sm:size-28',
} as const

/**
 * Portrait rond, cadrage carré centré sur le visage, même taille pour tout le monde — jamais un traitement
 * différent entre candidat·es. Photo si elle existe ; sinon initiales, teinte unique de
 * l'app (jamais une couleur différenciée par candidat, qui pourrait se lire comme un code de parti).
 */
export function Avatar({ candidat, size = 'md' }: { candidat: Candidate; size?: keyof typeof SIZES }) {
  const cls = `${SIZES[size]} aspect-square shrink-0 overflow-hidden rounded-full bg-[var(--paper)]`
  if (candidat.photo) {
    return (
      <div className={cls}>
        <img
          src={`/candidats/${candidat.photo.fichier}`}
          alt={`Portrait de ${candidat.prenom} ${candidat.nom}`}
          width={200}
          height={200}
          className="size-full object-cover object-[50%_18%]"
          loading="lazy"
        />
      </div>
    )
  }
  const initiales = `${candidat.prenom[0]}${candidat.nom[0]}`.toUpperCase()
  return (
    <div className={`${cls} flex items-center justify-center bg-[var(--accent-soft)]`} role="img" aria-label={`Aucune photo disponible pour ${candidat.prenom} ${candidat.nom}`}>
      <span aria-hidden="true" className="font-display font-bold text-[var(--accent-strong)]">
        {initiales}
      </span>
    </div>
  )
}

/** Crédit photo affiché sous le portrait quand la source impose une attribution. */
export function PhotoCredit({ candidat }: { candidat: Candidate }) {
  if (!candidat.photo) return <p className="text-xs text-[var(--ink-faint)]">Portrait non disponible sous licence libre.</p>
  return (
    <p className="text-xs text-[var(--ink-faint)]">
      Photo : {candidat.photo.credit} ·{' '}
      <a href={candidat.photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-[var(--line-strong)]">
        {candidat.photo.licence}
      </a>
    </p>
  )
}
