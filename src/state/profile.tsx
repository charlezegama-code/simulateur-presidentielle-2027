import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Profile } from '../domain/profile'

/**
 * Le profil reste en mémoire dans le navigateur. Il n'est enregistré (localStorage) que si l'utilisateur
 * coche « se souvenir sur cet appareil », et n'est jamais envoyé nulle part.
 */
const KEY = 'simulateur-2027:profil'

function readStored(): Profile | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Profile) : null
  } catch {
    return null
  }
}

interface ProfileState {
  profile: Profile | null
  remember: boolean
  setProfile: (p: Profile | null) => void
  setRemember: (r: boolean) => void
}

const Ctx = createContext<ProfileState | null>(null)

export function ProfileProvider({ children }: { children: ReactNode }) {
  const stored = useMemo(() => readStored(), [])
  const [profile, setProfileState] = useState<Profile | null>(stored)
  const [remember, setRememberState] = useState(stored !== null)

  const persist = useCallback((p: Profile | null, r: boolean) => {
    try {
      if (r && p) localStorage.setItem(KEY, JSON.stringify(p))
      else localStorage.removeItem(KEY)
    } catch {
      /* stockage indisponible (navigation privée) : le profil reste en mémoire */
    }
  }, [])

  const setProfile = useCallback(
    (p: Profile | null) => {
      setProfileState(p)
      persist(p, remember)
    },
    [persist, remember],
  )
  const setRemember = useCallback(
    (r: boolean) => {
      setRememberState(r)
      persist(profile, r)
    },
    [persist, profile],
  )

  return <Ctx.Provider value={{ profile, remember, setProfile, setRemember }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react/only-export-components
export function useProfile(): ProfileState {
  const v = useContext(Ctx)
  if (!v) throw new Error('ProfileProvider manquant')
  return v
}
