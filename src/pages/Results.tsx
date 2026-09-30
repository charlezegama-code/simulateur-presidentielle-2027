import { useEffect, useMemo, useRef, useState } from 'react'
import { Redirect, useSearch } from 'wouter'
import { Avatar } from '../components/Avatar'
import { EffectDetail } from '../components/EffectDetail'
import { EffectRow } from '../components/EffectRow'
import { IconArrowDown, IconArrowUp, IconWaver } from '../components/icons'
import { ProfileChip } from '../components/ProfileChip'
import { Row, type RowContent } from '../components/Row'
import { SeedBar } from '../components/SeedBar'
import { SegmentedControl } from '../components/SegmentedControl'
import { ThemePills } from '../components/ThemePills'
import { TopBar } from '../components/TopBar'
import { Notice } from '../components/ui'
import { measures } from '../data/loader'
import { THEMES, type Theme } from '../domain/theme'
import { compareEffects, simulate, type CandidateResult, type EffectView } from '../engine/simulate'
import { ecartChiffrage } from '../engine/compare'
import { dateFr, STATUT_LABELS } from '../lib/format'
import { useShuffled } from '../lib/seed'
import { useDataset } from '../lib/useDataset'
import { useProfile } from '../state/profile'
import type { MeasuresFile } from '../schema/measure'

const byCandidateId = (r: CandidateResult) => r.candidat.id

function mfOf(r: CandidateResult): MeasuresFile {
  return measures[`${r.candidat.id}.json`]
}

function themeRowContent(r: CandidateResult, theme: Theme): RowContent {
  const mf = mfOf(r)
  const actives = mf.mesures.filter((m) => m.theme === theme && m.statut !== 'abandonnee')
  if (actives.length === 0) {
    const sp = mf.sansPosition.find((s) => s.theme === theme)
    return { kind: 'none', date: dateFr(sp?.dateRecherche ?? mf.dateMaj) }
  }
  const views = [...r.positifs, ...r.negatifs, ...r.autres].filter((v) => v.theme === theme).sort(compareEffects)
  if (views.length > 0) return { kind: 'effect', v: views[0] }
  const ref = r.autresMesures.find((m) => m.theme === theme)
  if (ref) return { kind: 'measure', libelleCourt: ref.libelleCourt, type: ref.type }
  return { kind: 'none', date: dateFr(mf.dateMaj) }
}

function GroupHeader({ label, Icon, tone, n, total }: { label: string; Icon: typeof IconArrowUp; tone: string; n: number; total: number }) {
  return (
    <p className={`flex items-center gap-1.5 text-sm font-bold ${tone}`}>
      <Icon className="size-4" />
      {label} <span className="font-normal text-[var(--ink-faint)]">· {n} sur {total} mesures analysées</span>
    </p>
  )
}

function CandidateCard({ r, onOpen }: { r: CandidateResult; onOpen: (v: EffectView) => void }) {
  const c = r.candidat
  const mf = mfOf(r)
  const total = mf.mesures.filter((m) => m.statut !== 'abandonnee').length
  return (
    <div className="raised space-y-4 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <Avatar candidat={c} size="md" />
        <div className="min-w-0">
          <p className="truncate font-display text-lg font-extrabold text-[var(--ink)]">
            {c.prenom} {c.nom}
          </p>
          <p className="truncate text-[13px] text-[var(--ink-faint)]">
            {c.parti} · {STATUT_LABELS[c.statut]} depuis le {dateFr(c.statutDate)}
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        <GroupHeader label="Avantages" Icon={IconArrowUp} tone="text-[var(--positive-strong)]" n={r.positifs.length} total={total} />
        {r.positifs.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)]">Aucun avantage identifié pour ton profil.</p>
        ) : (
          <div className="space-y-2">
            {r.positifs.map((v) => (
              <EffectRow key={v.effetId} v={v} onClick={() => onOpen(v)} />
            ))}
          </div>
        )}
      </div>

      <div className="space-y-2.5">
        <GroupHeader label="Désavantages" Icon={IconArrowDown} tone="text-[var(--negative-strong)]" n={r.negatifs.length} total={total} />
        {r.negatifs.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)]">Aucun désavantage identifié pour ton profil.</p>
        ) : (
          <div className="space-y-2">
            {r.negatifs.map((v) => (
              <EffectRow key={v.effetId} v={v} onClick={() => onOpen(v)} />
            ))}
          </div>
        )}
      </div>

      {r.autres.length > 0 && (
        <div className="space-y-2.5">
          <GroupHeader label="Incertain" Icon={IconWaver} tone="text-[var(--ink-soft)]" n={r.autres.length} total={total} />
          <div className="space-y-2">
            {r.autres.map((v) => (
              <EffectRow key={v.effetId} v={v} onClick={() => onOpen(v)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function CandidatePager({ ordered, onOpen }: { ordered: CandidateResult[]; onOpen: (v: EffectView) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  const onScroll = () => {
    const el = ref.current
    if (!el) return
    setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }
  return (
    <div className="pt-2">
      <div ref={ref} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth">
        {ordered.map((r) => (
          <div key={r.candidat.id} className="w-full shrink-0 snap-center px-5">
            <CandidateCard r={r} onOpen={onOpen} />
          </div>
        ))}
      </div>
      {ordered.length > 1 && (
        <div className="flex justify-center gap-1.5 pt-3" aria-hidden="true">
          {ordered.map((r, i) => (
            <span key={r.candidat.id} className={`size-1.5 rounded-full transition-colors ${i === index ? 'bg-[var(--accent)]' : 'bg-[var(--line-strong)]'}`} />
          ))}
        </div>
      )}
    </div>
  )
}

export function Results() {
  const { profile } = useProfile()
  const { dataset, error } = useDataset()
  const search = useSearch()
  const results = useMemo(() => (profile && dataset ? simulate(profile, dataset) : []), [profile, dataset])
  const ordered = useShuffled(results, byCandidateId)
  const ecart = useMemo(() => ecartChiffrage(measures), [])
  const [view, setView] = useState<'theme' | 'candidat'>('theme')
  const [theme, setTheme] = useState<Theme | null>(null)
  const [detail, setDetail] = useState<EffectView | null>(null)

  const themesOrdered = useMemo(() => {
    if (ordered.length === 0) return THEMES
    // Priorité aux effets chiffrés (un montant en € doit être visible sans scroll sur le premier écran), puis à
    // la présence de tout effet pertinent (chiffré, qualitatif ou flou) pour départager.
    const chiffres = new Map<Theme, number>()
    const pertinents = new Map<Theme, number>()
    for (const t of THEMES) {
      const contents = ordered.map((r) => themeRowContent(r, t))
      chiffres.set(t, contents.filter((c) => c.kind === 'effect' && c.v.type === 'chiffre').length)
      pertinents.set(t, contents.filter((c) => c.kind === 'effect').length)
    }
    return [...THEMES].sort((a, b) => chiffres.get(b)! - chiffres.get(a)! || pertinents.get(b)! - pertinents.get(a)! || THEMES.indexOf(a) - THEMES.indexOf(b))
  }, [ordered])

  useEffect(() => {
    if (theme !== null || ordered.length === 0) return
    const fromUrl = new URLSearchParams(search).get('theme') as Theme | null
    setTheme(fromUrl && (THEMES as readonly string[]).includes(fromUrl) ? fromUrl : themesOrdered[0])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordered.length, themesOrdered])

  if (!profile) return <Redirect to="/questionnaire" />

  return (
    <div>
      <TopBar title="Résultat" />
      <ProfileChip profile={profile} />
      <div className="px-5 pt-4">
        <SegmentedControl
          options={[
            { value: 'theme', label: 'Par thème' },
            { value: 'candidat', label: 'Par candidat' },
          ]}
          active={view}
          onChange={setView}
        />
      </div>

      {error && (
        <div className="px-5 pt-4">
          <Notice tone="warn">Impossible de charger les calculs ({error}). Recharge la page.</Notice>
        </div>
      )}
      {!dataset && !error && (
        <p className="px-5 pt-6 text-[var(--ink-soft)]" aria-live="polite">
          Calcul en cours…
        </p>
      )}

      {dataset && ordered.length > 0 && theme && (
        <>
          {view === 'theme' ? (
            <div className="space-y-3 pt-3">
              <ThemePills themes={themesOrdered} active={theme} onSelect={setTheme} />
              <div className="space-y-2 px-5">
                {ordered.map((r) => {
                  const content = themeRowContent(r, theme)
                  return <Row key={r.candidat.id} candidat={r.candidat} content={content} onClick={() => content.kind === 'effect' && setDetail(content.v)} />
                })}
              </div>
            </div>
          ) : (
            <CandidatePager ordered={ordered} onOpen={setDetail} />
          )}

          {ecart > 0.25 && (
            <div className="px-5 pt-4">
              <Notice tone="warn">
                Les programmes ne sont pas tous aussi détaillés à ce jour : la part de mesures chiffrables varie de {Math.round(ecart * 100)} points
                selon les candidat·es. Moins de chiffres ne veut pas dire moins d’effets, seulement des propositions moins précisées pour l’instant.
              </Notice>
            </div>
          )}

          <div className="pt-4">
            <SeedBar />
          </div>
        </>
      )}

      <EffectDetail v={detail} open={!!detail} onClose={() => setDetail(null)} />
    </div>
  )
}
