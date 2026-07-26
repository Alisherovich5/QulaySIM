import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

const TOKEN_KEY = 'fastsim_token'
const REFRESH_KEY = 'fastsim_refresh'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setRefresh: (t: string) => localStorage.setItem(REFRESH_KEY, t),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

api.interceptors.request.use((config) => {
  const token = tokenStore.get()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * Access tokens are short-lived (30 minutes). Without this, every request
 * after that window fails with 401 while the UI still looks signed in.
 *
 * On the first 401 we swap the refresh token for a new pair and replay the
 * original request once. Refresh tokens are single-use server-side, so
 * concurrent 401s must share one refresh call rather than each spending the
 * token — otherwise the second is rejected as replay and logs the user out.
 */
type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

let refreshInFlight: Promise<string> | null = null

/** Set by AuthProvider so a failed refresh can clear the in-memory session. */
let onAuthFailure: (() => void) | null = null

export function setAuthFailureHandler(handler: (() => void) | null) {
  onAuthFailure = handler
}

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) throw new Error('no refresh token')

  // A bare axios call: going through `api` would re-enter this interceptor.
  const { data } = await axios.post('/api/auth/refresh', { refresh_token: refreshToken })
  tokenStore.set(data.access_token)
  if (data.refresh_token) tokenStore.setRefresh(data.refresh_token)
  return data.access_token
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined
    const isAuthCall = original?.url?.startsWith('/auth/')

    if (error.response?.status !== 401 || !original || original._retried || isAuthCall) {
      return Promise.reject(error)
    }

    original._retried = true

    try {
      refreshInFlight ??= refreshAccessToken().finally(() => {
        refreshInFlight = null
      })
      const token = await refreshInFlight
      original.headers.Authorization = `Bearer ${token}`
      return api(original)
    } catch {
      tokenStore.clear()
      onAuthFailure?.()
      return Promise.reject(error)
    }
  },
)
