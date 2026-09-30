import { useEffect, useMemo, useRef, useState, type ComponentType, type SVGProps } from 'react'
import { useLocation, useSearch } from 'wouter'
import { BUTTON, BUTTON_SECONDARY } from '../components/ui'
import { Sheet } from '../components/Sheet'
import {
  IconBack,
  IconBriefcase,
  IconCap,
  IconCheckCircle,
  IconClock,
  IconColumns,
  IconCycle,
  IconLaptop,
  IconMinusCircle,
  IconSearch,
  IconXCircle,
} from '../components/icons'
import { applyAnswer, finalize, questionsFor, summarize, type Draft, type Value } from '../domain/questionnaire'
import type { StatutPro } from '../domain/profile'
import { useProfile } from '../state/profile'

const DRAFT_KEY = 'simulateur-2027:brouillon'

const STATUT_ICON: Record<StatutPro, ComponentType<SVGProps<SVGSVGElement>>> = {
  etudiant: IconCap,
  alternant: IconCycle,
  salarie_prive: IconBriefcase,
  fonctionnaire: IconColumns,
  independant: IconLaptop,
  demandeur_emploi: IconSearch,
  retraite: IconClock,
  sans_activite: IconMinusCircle,
}

function tileIcon(questionId: string, value: Value): ComponentType<SVGProps<SVGSVGElement>> | null {
  if (questionId === 'statutPro') return STATUT_ICON[value as StatutPro]
  if (typeof value === 'boolean') return value ? IconCheckCircle : IconXCircle
  return null
}

function readDraft(): { draft: Draft; step: number } | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
function writeDraft(draft: Draft, step: number) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ draft, step }))
  } catch {
    /* stockage indisponible : le formulaire reste utilisable, juste sans protection contre le rechargement */
  }
}
function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY)
  } catch {
    /* rien à faire */
  }
}

export function Questionnaire() {
  const { profile, setProfile, remember, setRemember } = useProfile()
  const [, navigate] = useLocation()
  const search = useSearch()
  const initial = useMemo(() => readDraft(), [])
  const [draft, setDraft] = useState<Draft>(initial?.draft ?? profile ?? {})
  const questions = useMemo(() => questionsFor(draft), [draft])
  const wantsRecap = useMemo(() => new URLSearchParams(search).get('recap') === '1', [search])
  const [step, setStep] = useState(() => (wantsRecap && finalize(profile ?? {}) ? questionsFor(profile ?? {}).length : (initial?.step ?? 0)))
  const [pending, setPending] = useState<Value | null>(null)
  const [whyOpen, setWhyOpen] = useState(false)
  const done = step >= questions.length
  const q = questions[Math.min(step, questions.length - 1)]
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => heading.current?.focus(), [step])
  useEffect(() => writeDraft(draft, step), [draft, step])

  const answer = (value: Value) => {
    setPending(value)
    setTimeout(() => {
      setDraft((d) => applyAnswer(d, q.id, value))
      setStep((s) => s + 1)
      setPending(null)
    }, 180)
  }

  const finished = finalize(draft)
  const summary = summarize(draft)

  if (done) {
    return (
      <div className="slide-enter space-y-5 px-5 pt-6 pb-8">
        <div className="space-y-1">
          <h1 ref={heading} tabIndex={-1} className="font-display text-2xl font-extrabold tracking-tight text-[var(--ink)] outline-none">
            On récapitule ?
          </h1>
          <p className="text-[var(--ink-soft)]">Vérifie tes réponses, ou modifie-en une avant de voir les résultats.</p>
        </div>
        <ul className="space-y-2">
          {summary.map((s) => (
            <li key={s.id} className="row raised">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--ink-faint)]">{s.question}</p>
                <p className="truncate font-bold text-[var(--ink)]">{s.reponse}</p>
              </div>
              <button type="button" onClick={() => setStep(s.step)} className={`${BUTTON_SECONDARY} min-h-9 shrink-0 px-4 py-1.5 text-sm`}>
                Modifier
              </button>
            </li>
          ))}
        </ul>
        <label className="raised flex items-start gap-3 rounded-2xl p-4">
          <input type="checkbox" className="mt-1 size-5 accent-[var(--accent)]" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span className="text-[var(--ink)]">
            Se souvenir de mes réponses sur cet appareil
            <span className="block text-sm text-[var(--ink-soft)]">Enregistrées uniquement dans ce navigateur. Décoché par défaut.</span>
          </span>
        </label>
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className={BUTTON}
            disabled={!finished}
            onClick={() => {
              if (finished) setProfile(finished)
              clearDraft()
              navigate('/resultats')
            }}
          >
            Voir ce qui change pour moi
          </button>
          <button type="button" className={BUTTON_SECONDARY} onClick={() => setStep(0)}>
            Revoir depuis le début
          </button>
        </div>
      </div>
    )
  }

  const current = pending ?? draft[q.id]
  const Icon0 = tileIcon(q.id, q.options(draft)[0]?.value)
  const singleColumn = q.options(draft).some((o) => o.detail) || !Icon0

  return (
    <div key={q.id} className="slide-enter">
      <div className="flex items-center gap-1 px-3 pt-4">
        {step > 0 ? (
          <button type="button" onClick={() => setStep((s) => s - 1)} aria-label="Retour" className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--ink-soft)] active:scale-90">
            <IconBack className="size-5.5" />
          </button>
        ) : (
          <span className="size-9 shrink-0" />
        )}
        <div className="flex flex-1 gap-1" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={questions.length}>
          {questions.map((qq, i) => (
            <span key={qq.id} aria-hidden="true" className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= step ? 'bg-[var(--accent)]' : 'bg-[var(--line)]'}`} />
          ))}
        </div>
        <span className="size-9 shrink-0" />
      </div>

      <div className="px-5 pb-1 pt-5">
        <h1 ref={heading} tabIndex={-1} className="font-display text-2xl font-extrabold leading-tight tracking-tight text-[var(--ink)] outline-none">
          {q.titreSelon ? q.titreSelon(draft) : q.titre}
        </h1>
      </div>

      <div className={`grid gap-2.5 px-5 pt-4 ${singleColumn ? 'grid-cols-1' : 'grid-cols-2'}`}>
        {q.options(draft).map((o) => {
          const checked = current === o.value
          const Icon = tileIcon(q.id, o.value)
          return (
            <button key={String(o.value)} type="button" onClick={() => answer(o.value)} className={`tile raised ${checked ? `selected ${pending !== null ? 'pop' : ''}` : ''}`}>
              {Icon && <Icon className="size-6 text-[var(--accent-strong)]" />}
              <span className="text-[15px] font-semibold leading-snug text-[var(--ink)]">
                {o.label}
                {o.detail && <span className="mt-0.5 block text-[13px] font-normal text-[var(--ink-soft)]">{o.detail}</span>}
              </span>
            </button>
          )
        })}
      </div>

      {q.aide && (
        <div className="px-5 pt-4">
          <button type="button" onClick={() => setWhyOpen(true)} className="text-[13.5px] font-semibold text-[var(--accent-strong)]">
            Pourquoi cette question ?
          </button>
        </div>
      )}

      <Sheet open={whyOpen} onClose={() => setWhyOpen(false)} title="Pourquoi cette question ?">
        <p className="leading-relaxed text-[var(--ink-soft)]">{q.aide}</p>
      </Sheet>
    </div>
  )
}
