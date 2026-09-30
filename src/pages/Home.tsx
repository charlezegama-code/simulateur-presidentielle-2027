import { useState } from 'react'
import { Link, useLocation } from 'wouter'
import { Avatar } from '../components/Avatar'
import { IconCompareMark, IconInfo } from '../components/icons'
import { Sheet } from '../components/Sheet'
import { BUTTON } from '../components/ui'
import { candidates, meta } from '../data/loader'
import { dateFr, REPO_URL } from '../lib/format'
import { useProfile } from '../state/profile'

const THEMES_APERCU = [
  { theme: 'salaires', label: 'Ton salaire' },
  { theme: 'logement', label: 'Ton logement' },
  { theme: 'etudes', label: 'Tes études' },
] as const

export function Home() {
  const { profile } = useProfile()
  const [, navigate] = useLocation()
  const [infoOpen, setInfoOpen] = useState(false)
  const analysed = candidates.candidats.filter((c) => c.analyse)

  return (
    <div className="relative">
      <div className="flex justify-end px-4 pt-4">
        <button type="button" onClick={() => setInfoOpen(true)} aria-label="Informations" className="raised flex size-10 items-center justify-center rounded-full text-[var(--ink-soft)] active:scale-90">
          <IconInfo className="size-5.5" />
        </button>
      </div>

      <div className="flex flex-col items-center gap-5 px-8 pb-8 pt-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <IconCompareMark className="size-6.5" />
        </div>
        <h1 className="text-balance font-display text-2xl font-extrabold leading-[1.28] tracking-tight text-[var(--ink)]">
          Ce que les programmes changeraient concrètement pour toi
        </h1>
        <button type="button" className={`${BUTTON} w-full max-w-xs`} onClick={() => navigate(profile ? '/resultats' : '/questionnaire')}>
          {profile ? 'Voir mes résultats' : 'Commencer'}
        </button>
        <p className="text-[15px] font-medium text-[var(--ink-faint)]">3 min · tes réponses restent sur ton téléphone</p>
      </div>

      <div className="stagger space-y-6 px-5 pb-10">
        <div className="raised rounded-2xl p-4">
          <div className="flex -space-x-2.5">
            {analysed.map((c) => (
              <Avatar key={c.id} candidat={c} size="sm" />
            ))}
          </div>
          <p className="mt-3 text-sm font-semibold text-[var(--ink)]">
            {analysed.length} programmes analysés <span className="font-normal text-[var(--ink-faint)]">· mis à jour le {dateFr(meta.dateMaj)}</span>
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.1em] text-[var(--ink-faint)]">Quelques thèmes</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {THEMES_APERCU.map((t) => (
              <Link key={t.theme} href={`/comparer?theme=${t.theme}`} className="pill shrink-0">
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <p className="px-8 pb-10 text-center text-sm leading-relaxed text-[var(--ink-faint)]">
        Simulation indicative à partir des programmes publics, pas une consigne de vote.
      </p>

      <Sheet open={infoOpen} onClose={() => setInfoOpen(false)} title="À propos">
        <div className="space-y-3 text-[15px] leading-relaxed text-[var(--ink-soft)]">
          <p>
            Cet outil calcule, à partir des programmes publiés, ce qui changerait concrètement pour ta situation : avantages et inconvénients,
            chiffrés quand c'est possible. Il n'y a ni score ni classement — à toi de te faire un avis.
          </p>
          <p>
            Tes réponses restent sur ton téléphone : aucune n'est envoyée, pas de compte, pas de mesure d'audience. Le calcul se fait entièrement
            dans ton navigateur.
          </p>
          <p>
            Un montant en gros signifie qu'il a pu être calculé pour ton profil. Sans montant, l'effet est réel mais pas assez précisé par le
            candidat pour être traduit en euros — jamais un chiffre inventé.
          </p>
          <p>
            Les programmes évoluent au fil des annonces. Code et données sont publics :{' '}
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--accent-strong)] underline decoration-[var(--line-strong)]">
              dépôt GitHub
            </a>
            .
          </p>
        </div>
      </Sheet>
    </div>
  )
}
