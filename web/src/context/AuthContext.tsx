import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { ApiError, api } from '../lib/api'
import type { AuthUser } from '../types'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  /** mensagem quando o usuário está logado no hub mas não tem o módulo liberado */
  error: string
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<AuthUser>('/auth/me')
      .then(setUser)
      .catch((err) => setError(err instanceof ApiError && err.status !== 401 ? err.message : ''))
      .finally(() => setLoading(false))
  }, [])

  return <AuthContext.Provider value={{ user, loading, error }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
