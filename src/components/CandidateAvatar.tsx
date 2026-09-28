import type { Candidate } from '../schema/candidate'

const SIZES = {
  sm: 'w-14',
  md: 'w-20',
  lg: 'w-32 sm:w-40',
} as const

/**
 * Portrait au même format pour tous·tes les candidat·es (recadrage identique, voir /methodologie).
 * Si aucune photo sous licence libre n'a été trouvée : avatar générique identique, jamais une photo pour certain·es
 * et pas pour d'autres.
 */
export function CandidateAvatar({ candidat, size = 'md' }: { candidat: Candidate; size?: keyof typeof SIZES }) {
  const cls = `${SIZES[size]} aspect-[7/9] shrink-0 overflow-hidden rounded-lg border border-[var(--line)] bg-[var(--paper)]`
  if (candidat.photo) {
    return (
      <div className={cls}>
        <img
          src={`/candidats/${candidat.photo.fichier}`}
          alt={`Portrait de ${candidat.prenom} ${candidat.nom}`}
          width={480}
          height={617}
          className="size-full object-cover"
          loading="lazy"
        />
      </div>
    )
  }
  return (
    <div className={`${cls} flex items-center justify-center`} role="img" aria-label={`Aucune photo disponible pour ${candidat.prenom} ${candidat.nom}`}>
      <svg viewBox="0 0 24 24" className="size-2/3 text-[var(--line-strong)]" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="8" r="4.2" />
        <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
      </svg>
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
