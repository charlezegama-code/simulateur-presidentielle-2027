import { THEME_LABELS, type Theme } from '../domain/theme'

/** Rangée de thèmes en défilement horizontal, thème sélectionné en accent. */
export function ThemePills({ themes, active, onSelect }: { themes: readonly Theme[]; active: Theme; onSelect: (t: Theme) => void }) {
  return (
    <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1" role="tablist" aria-label="Thèmes">
      {themes.map((t) => (
        <button key={t} type="button" role="tab" aria-selected={t === active} onClick={() => onSelect(t)} className={`pill ${t === active ? 'selected' : ''}`}>
          {THEME_LABELS[t]}
        </button>
      ))}
    </div>
  )
}
