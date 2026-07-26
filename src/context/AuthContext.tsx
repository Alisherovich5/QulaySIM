import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  api,
  hasSessionCookie,
  refreshSession,
  setAuthFailureHandler,
  tokenStore,
} from '../lib/api'
import type { Customer } from '../lib/types'

interface AuthState {
  customer: Customer | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    email: string,
    fullName: string,
    password: string,
    referralCode?: string,
  ) => Promise<void>
  logout: () => void
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  // The access token lives in memory, so a reload starts with nothing. The
  // httpOnly refresh cookie is what actually carries the session across
  // reloads: exchange it once on boot, then load the customer.
  const loadMe = async () => {
    // No session cookie means nobody is signed in; skip the round trip that
    // would only ever come back 401.
    if (!hasSessionCookie()) {
      setLoading(false)
      return
    }
    try {
      await refreshSession()
      const { data } = await api.get<Customer>('/auth/me')
      setCustomer(data)
    } catch {
      // No valid cookie — the visitor is simply signed out.
      tokenStore.clear()
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMe()
  }, [])

  // When a refresh fails the interceptor has already cleared storage; this
  // drops the stale customer so the UI stops pretending to be signed in.
  useEffect(() => {
    setAuthFailureHandler(() => setCustomer(null))
    return () => setAuthFailureHandler(null)
  }, [])

  const login = async (email: string, password: string) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    const { data } = await api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    tokenStore.set(data.access_token)
    const me = await api.get<Customer>('/auth/me')
    setCustomer(me.data)
  }

  const register = async (
    email: string,
    fullName: string,
    password: string,
    referralCode?: string,
  ) => {
    const { data } = await api.post('/auth/register', {
      email,
      full_name: fullName,
      password,
      referral_code: referralCode || null,
    })
    tokenStore.set(data.access_token)
    const me = await api.get<Customer>('/auth/me')
    setCustomer(me.data)
  }

  const logout = () => {
    // Fire-and-forget: revoke the refresh token and clear the cookie server
    // side. The local session is dropped regardless of the outcome.
    api.post('/auth/logout', {}).catch(() => undefined)
    tokenStore.clear()
    setCustomer(null)
  }

  const refresh = async () => {
    const me = await api.get<Customer>('/auth/me')
    setCustomer(me.data)
  }

  return (
    <AuthContext.Provider value={{ customer, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
