import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'

export const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  // The refresh token lives in an httpOnly cookie, so it has to ride along.
  withCredentials: true,
})

/**
 * The access token is held in memory, never in localStorage.
 *
 * Anything in localStorage is readable by any script that manages to run on
 * the page, and it survives the tab. A variable does neither: a reload simply
 * re-mints the token from the httpOnly refresh cookie, which JavaScript cannot
 * read at all.
 */
let accessToken: string | null = null

export const tokenStore = {
  get: () => accessToken,
  set: (t: string) => {
    accessToken = t
  },
  clear: () => {
    accessToken = null
  },
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

/** Set by AuthProvider so a failed refresh can clear the in-memory session. */
let onAuthFailure: (() => void) | null = null

export function setAuthFailureHandler(handler: (() => void) | null) {
  onAuthFailure = handler
}

let refreshInFlight: Promise<string> | null = null

/**
 * Exchange the refresh cookie for a new access token.
 *
 * Concurrent callers share one in-flight request: refresh tokens are
 * single-use server-side, so two parallel refreshes would spend the same
 * token and the second would be rejected as replay.
 */
export function refreshSession(): Promise<string> {
  refreshInFlight ??= axios
    .post('/api/auth/refresh', {}, { withCredentials: true })
    .then(({ data }) => {
      accessToken = data.access_token
      return data.access_token as string
    })
    .finally(() => {
      refreshInFlight = null
    })
  return refreshInFlight
}

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean }

// Access tokens last 30 minutes. Without this, every request after that window
// would fail with 401 while the UI still looked signed in.
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
      const token = await refreshSession()
      original.headers.Authorization = `Bearer ${token}`
      return api(original)
    } catch {
      tokenStore.clear()
      onAuthFailure?.()
      return Promise.reject(error)
    }
  },
)
