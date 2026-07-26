import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { api, setAuthFailureHandler, tokenStore } from '../lib/api'
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

interface TokenResponse {
  access_token: string
  refresh_token?: string
}

function storeTokens(data: TokenResponse) {
  tokenStore.set(data.access_token)
  if (data.refresh_token) tokenStore.setRefresh(data.refresh_token)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)

  const loadMe = async () => {
    if (!tokenStore.get()) {
      setLoading(false)
      return
    }
    try {
      const { data } = await api.get<Customer>('/auth/me')
      setCustomer(data)
    } catch {
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
    storeTokens(data)
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
    storeTokens(data)
    const me = await api.get<Customer>('/auth/me')
    setCustomer(me.data)
  }

  const logout = () => {
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
