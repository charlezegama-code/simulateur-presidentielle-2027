import { useMemo, useState } from 'react'
import { useSearch } from 'wouter'
import { MeasureDetail } from '../components/MeasureDetail'
import { Row, type RowContent } from '../components/Row'
import { SeedBar } from '../components/SeedBar'
import { ThemePills } from '../components/ThemePills'
import { TopBar } from '../components/TopBar'
import { candidates, measures } from '../data/loader'
import { THEMES, type Theme } from '../domain/theme'
import { dateFr } from '../lib/format'
import { useShuffled } from '../lib/seed'
import type { Measure } from '../schema/measure'

const analysed = candidates.candidats.filter((c) => c.analyse)
const byId = (c: (typeof analysed)[number]) => c.id

function rowContentForTheme(candidatId: string, theme: Theme): { content: RowContent; measure: Measure | null } {
  const mf = measures[`${candidatId}.json`]
  const ms = mf.mesures.filter((m) => m.theme === theme && m.statut !== 'abandonnee')
  if (ms.length === 0) {
    const sp = mf.sansPosition.find((s) => s.theme === theme)
    return { content: { kind: 'none', date: dateFr(sp?.dateRecherche ?? mf.dateMaj) }, measure: null }
  }
  const m = ms[0]
  return { content: { kind: 'measure', libelleCourt: m.libelleCourt, type: m.type }, measure: m }
}

export function Compare() {
  const ordered = useShuffled(analysed, byId)
  const search = useSearch()
  const [theme, setTheme] = useState<Theme>(() => {
    const fromUrl = new URLSearchParams(search).get('theme') as Theme | null
    return fromUrl && (THEMES as readonly string[]).includes(fromUrl) ? fromUrl : THEMES[0]
  })
  const [detail, setDetail] = useState<{ m: Measure; candidatId: string } | null>(null)

  const rows = useMemo(() => ordered.map((c) => ({ c, ...rowContentForTheme(c.id, theme) })), [ordered, theme])

  return (
    <div>
      <TopBar title="Comparer" />
      <p className="px-5 pt-1 text-[15px] text-[var(--ink-soft)]">Toutes les mesures analysées, indépendamment de ton profil.</p>
      <div className="space-y-3 pt-4">
        <ThemePills themes={THEMES} active={theme} onSelect={setTheme} />
        <div className="space-y-2 px-5">
          {rows.map(({ c, content, measure }) => (
            <Row key={c.id} candidat={c} content={content} onClick={() => measure && setDetail({ m: measure, candidatId: c.id })} />
          ))}
        </div>
      </div>
      <div className="pt-4">
        <SeedBar />
      </div>
      <MeasureDetail
        m={detail?.m ?? null}
        sources={detail ? measures[`${detail.candidatId}.json`].sources : []}
        open={!!detail}
        onClose={() => setDetail(null)}
      />
    </div>
  )
}
