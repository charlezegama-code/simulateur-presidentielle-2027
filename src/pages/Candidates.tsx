import { useState } from 'react'
import { Link } from 'wouter'
import { Avatar } from '../components/Avatar'
import { IconChevronDown } from '../components/icons'
import { Sheet } from '../components/Sheet'
import { TopBar } from '../components/TopBar'
import { LINK, Notice } from '../components/ui'
import { candidates } from '../data/loader'
import { dateFr, STATUT_LABELS } from '../lib/format'
import type { Candidate } from '../schema/candidate'

const sorted = [...candidates.candidats].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
const analysed = sorted.filter((c) => c.analyse)
const rest = sorted.filter((c) => !c.analyse)

function Tile({ c, onOpen }: { c: Candidate; onOpen: () => void }) {
  return (
    <button type="button" onClick={onOpen} className="flex flex-col items-center gap-2 p-2 text-center active:scale-95">
      <Avatar candidat={c} size="lg" />
      <span className="text-[13px] font-bold leading-tight text-[var(--ink)]">
        {c.prenom} {c.nom}
      </span>
    </button>
  )
}

export function Candidates() {
  const [open, setOpen] = useState<Candidate | null>(null)
  const [showRest, setShowRest] = useState(false)

  return (
    <div>
      <TopBar title="Candidats" />
      <div className="px-5 pt-3">
        <Notice>{candidates.critereAnalyse}</Notice>
      </div>

      <div className="grid grid-cols-3 gap-1 px-3 pt-5 sm:grid-cols-4">
        {analysed.map((c) => (
          <Tile key={c.id} c={c} onOpen={() => setOpen(c)} />
        ))}
      </div>

      <details className="disclosure px-5 pt-6" open={showRest} onToggle={(e) => setShowRest(e.currentTarget.open)}>
        <summary className="flex items-center gap-1.5 text-sm font-bold text-[var(--ink-soft)]">
          <IconChevronDown className="chevron size-4" />
          Pas encore analysés ({rest.length})
        </summary>
        <div className="grid grid-cols-3 gap-1 pt-4 sm:grid-cols-4">
          {rest.map((c) => (
            <Tile key={c.id} c={c} onOpen={() => setOpen(c)} />
          ))}
        </div>
      </details>

      <p className="px-5 pb-8 pt-6 text-sm text-[var(--ink-faint)]">
        La liste officielle des candidat·es sera publiée par le Conseil constitutionnel après le dépôt des parrainages ; les statuts seront alors
        mis à jour.
      </p>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open ? `${open.prenom} ${open.nom}` : ''}>
        {open && (
          <div className="space-y-3">
            <p className="text-[var(--ink-soft)]">{open.parti}</p>
            <p className="font-semibold text-[var(--ink)]">
              {STATUT_LABELS[open.statut]} depuis le {dateFr(open.statutDate)}
            </p>
            {open.note && <Notice>{open.note}</Notice>}
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink-faint)]">Source du statut</p>
              <ul className="space-y-1 text-sm">
                {open.sources
                  .filter((s) => open.statutSourceIds.includes(s.id))
                  .map((s) => (
                    <li key={s.id}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer" className={LINK}>
                        {s.editeur}
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
            {open.analyse ? (
              <Link href={`/candidat/${open.id}`} className={`${LINK} block`}>
                Toutes les mesures et sources →
              </Link>
            ) : (
              <p className="text-sm text-[var(--ink-faint)]">Programme pas encore analysé dans cette version.</p>
            )}
          </div>
        )}
      </Sheet>
    </div>
  )
}
