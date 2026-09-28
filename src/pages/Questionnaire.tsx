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
      <div className="space-y-6">
        <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold outline-none">
          C’est tout !
        </h1>
        <label className="flex items-start gap-3 rounded-lg border border-slate-300 p-3 dark:border-slate-700">
          <input type="checkbox" className="mt-1 size-5" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
          <span>
            Se souvenir de mes réponses sur cet appareil
            <span className="block text-sm text-slate-600 dark:text-slate-400">Enregistrées uniquement dans ce navigateur. Décoché par défaut.</span>
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
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-600 dark:text-slate-400" aria-live="polite">
          Question {step + 1} sur {questions.length}
        </p>
        <progress className="mt-1 h-2 w-full overflow-hidden rounded accent-indigo-700" max={questions.length} value={step} aria-hidden="true" />
      </div>
      <fieldset className="space-y-3">
        <legend className="mb-3">
          <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold outline-none">
            {q.titreSelon ? q.titreSelon(draft) : q.titre}
          </h1>
          {q.aide && <p className="mt-1 text-slate-600 dark:text-slate-400">{q.aide}</p>}
        </legend>
        {q.options(draft).map((o) => {
          const checked = current === o.value
          return (
            <label
              key={String(o.value)}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border border-slate-300 p-3 hover:bg-slate-50 has-[:checked]:border-indigo-700 has-[:checked]:bg-indigo-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-indigo-700 dark:border-slate-700 dark:hover:bg-slate-900 dark:has-[:checked]:border-indigo-300 dark:has-[:checked]:bg-indigo-950"
            >
              <input
                type="radio"
                name={q.id}
                className="size-5 shrink-0 accent-indigo-700"
                checked={checked}
                onChange={() => answer(o.value)}
                onClick={() => checked && answer(o.value)}
              />
              <span>
                {o.label}
                {o.detail && <span className="block text-sm text-slate-600 dark:text-slate-400">{o.detail}</span>}
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
          <button type="button" className={BUTTON_SECONDARY} onClick={() => setStep((s) => s + 1)}>
            Suivant →
          </button>
        )}
      </div>
    </div>
  )
}
