import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

const KEY = 'simulateur-2027:onboarding-vu'

type OnboardingCtx = { show: boolean; open: () => void; close: () => void }

const Ctx = createContext<OnboardingCtx | null>(null)

function alreadySeen(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(() => !alreadySeen())

  const value = useMemo<OnboardingCtx>(
    () => ({
      show,
      open: () => setShow(true),
      close: () => {
        setShow(false)
        try {
          localStorage.setItem(KEY, '1')
        } catch {
          // localStorage indisponible (navigation privée…) : l'écran réapparaîtra, sans conséquence grave.
        }
      },
    }),
    [show],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useOnboarding() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useOnboarding hors OnboardingProvider')
  return ctx
}

/** Bloque le scroll de la page tant qu'un panneau plein écran (onboarding) est affiché. */
export function useLockScroll(active: boolean) {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [active])
}
