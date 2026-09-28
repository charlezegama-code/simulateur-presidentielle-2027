import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { BUTTON, BUTTON_SECONDARY } from '../components/ui'
import { applyAnswer, finalize, questionsFor, type Draft, type Value } from '../domain/questionnaire'
import { useProfile } from '../state/profile'

export function Questionnaire() {
  const { profile, setProfile, remember, setRemember } = useProfile()
  const [, navigate] = useLocation()
  const [draft, setDraft] = useState<Draft>(profile ?? {})
  const [step, setStep] = useState(0)
  const questions = useMemo(() => questionsFor(draft), [draft])
  const done = step >= questions.length
  const q = questions[Math.min(step, questions.length - 1)]
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => heading.current?.focus(), [step])

  const answer = (value: Value) => {
    setDraft((d) => applyAnswer(d, q.id, value))
    setStep((s) => s + 1)
  }

  const finished = finalize(draft)

  if (done) {
    return (
      <div className="stagger max-w-lg space-y-6">
        <h1 ref={heading} tabIndex={-1} className="font-display text-3xl font-semibold tracking-tight text-[var(--ink)] outline-none">
          C’est tout !
        </h1>
        <label className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-4">
          <input type="checkbox" className="mt-1 size-5 accent-[var(--accent)]" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span className="text-[var(--ink)]">
            Se souvenir de mes réponses sur cet appareil
            <span className="block text-sm text-[var(--ink-soft)]">Enregistrées uniquement dans ce navigateur. Décoché par défaut.</span>
          </span>
        </label>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={BUTTON}
            disabled={!finished}
            onClick={() => {
              if (finished) setProfile(finished)
              navigate('/resultats')
            }}
          >
            Voir ce qui change pour moi
          </button>
          <button type="button" className={BUTTON_SECONDARY} onClick={() => setStep(0)}>
            Revoir mes réponses
          </button>
        </div>
      </div>
    )
  }

  const current = draft[q.id]
  return (
    <div key={q.id} className="q-enter max-w-lg space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]" aria-live="polite">
          Question {step + 1} / {questions.length}
        </p>
        <progress className="h-2 w-full overflow-hidden rounded-full" max={questions.length} value={step} aria-hidden="true" />
      </div>
      <fieldset className="space-y-3">
        <legend className="mb-4">
          <h1 ref={heading} tabIndex={-1} className="font-display text-2xl font-semibold leading-tight tracking-tight text-[var(--ink)] outline-none sm:text-3xl">
            {q.titreSelon ? q.titreSelon(draft) : q.titre}
          </h1>
          {q.aide && <p className="mt-1.5 text-[var(--ink-soft)]">{q.aide}</p>}
        </legend>
        {q.options(draft).map((o) => {
          const checked = current === o.value
          return (
            <label
              key={String(o.value)}
              className="group flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper-raised)] p-4 transition-colors has-[:checked]:border-[var(--accent)] has-[:checked]:bg-[var(--accent-soft)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--accent)] hover:border-[var(--line-strong)]"
            >
              <input
                type="radio"
                name={q.id}
                className="sr-only"
                checked={checked}
                onChange={() => answer(o.value)}
                onClick={() => checked && answer(o.value)}
              />
              <span
                aria-hidden="true"
                className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-[var(--line-strong)] text-[var(--on-accent)] group-has-[:checked]:border-[var(--accent)] group-has-[:checked]:bg-[var(--accent)] ${checked ? 'pop-check' : ''}`}
              >
                {checked && (
                  <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8.5l3 3 7-7" />
                  </svg>
                )}
              </span>
              <span className="text-[var(--ink)]">
                {o.label}
                {o.detail && <span className="block text-sm text-[var(--ink-soft)]">{o.detail}</span>}
              </span>
            </label>
          )
        })}
      </fieldset>
      <div className="flex gap-3">
        {step > 0 && (
          <button type="button" className={BUTTON_SECONDARY} onClick={() => setStep((s) => s - 1)}>
            ← Retour
          </button>
        )}
        {current !== undefined && (
          <button type="button" className={BUTTON} onClick={() => setStep((s) => s + 1)}>
            Suivant →
          </button>
        )}
      </div>
    </div>
  )
}
