import { Link } from 'wouter'
import type { Profile } from '../domain/profile'
import { chipSummary } from '../lib/profileChip'
import { IconChevronRight } from './icons'

/** Puce de profil courte, tappable pour revenir au récapitulatif du questionnaire et modifier une réponse. */
export function ProfileChip({ profile }: { profile: Profile }) {
  const initiale = chipSummary(profile)[0]
  return (
    <Link href="/questionnaire?recap=1" className="chip raised mx-5 mt-3 w-fit">
      <span className="flex size-7 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[11px] font-bold text-[var(--accent-strong)]">{initiale}</span>
      <span className="text-[14.5px] font-semibold text-[var(--ink)]">{chipSummary(profile)}</span>
      <IconChevronRight className="size-3.5 text-[var(--ink-faint)]" />
    </Link>
  )
}
