export function SegmentedControl<T extends string>({ options, active, onChange }: { options: { value: T; label: string }[]; active: T; onChange: (v: T) => void }) {
  return (
    <div className="segctrl" role="tablist">
      {options.map((o) => (
        <button key={o.value} type="button" role="tab" aria-selected={o.value === active} onClick={() => onChange(o.value)} className={o.value === active ? 'active' : ''}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
