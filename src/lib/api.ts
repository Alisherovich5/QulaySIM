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

/**
 * The API sets a readable companion cookie next to the httpOnly refresh token.
 * It carries no credential — only the fact that a session exists — so an
 * anonymous visitor does not start every page load with a failing refresh.
 */
export function hasSessionCookie(): boolean {
  return document.cookie.split('; ').some((c) => c.startsWith('qs_session='))
}

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

/**
 * Turn a 429 into a message that says how long to wait.
 *
 * The API returns Retry-After in seconds. Without it the customer only learns
 * that something is wrong, not that waiting fixes it — which reads as a broken
 * signup form rather than a limit.
 */
export function tooManyAttemptsMessage(
  err: unknown,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  const headers = (err as { response?: { headers?: Record<string, string> } })?.response?.headers
  const raw = Number(headers?.['retry-after'])
  if (!Number.isFinite(raw) || raw <= 0) return t('auth.tooManyAttempts')
  const minutes = Math.ceil(raw / 60)
  return minutes <= 1
    ? t('auth.tooManyAttemptsSoon')
    : t('auth.tooManyAttemptsIn', { minutes })
}

/**
 * Turn a 422 from the auth endpoints into a message in the customer's language.
 *
 * The API attaches a stable code to each password rule, so the reason can be
 * translated rather than shown as English prose or swallowed into a generic
 * failure. The generic version is what made registration look broken: someone
 * typing "parol123" was told only that it did not work.
 *
 * An unrecognised code falls back to the server's own text — wrong language but
 * still an actual reason, which beats "something went wrong".
 */
const PASSWORD_CODES: Record<string, string> = {
  password_too_short: 'auth.pwTooShort',
  string_too_short: 'auth.pwTooShort',
  password_too_long: 'auth.pwTooLong',
  string_too_long: 'auth.pwTooLong',
  password_too_common: 'auth.pwTooCommon',
  password_too_repetitive: 'auth.pwTooRepetitive',
  password_contains_personal: 'auth.pwPersonal',
}

export function validationMessage(
  err: unknown,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string | null {
  const errors = (err as { response?: { data?: { errors?: { type?: string; msg?: string }[] } } })
    ?.response?.data?.errors
  if (!Array.isArray(errors) || errors.length === 0) return null
  const first = errors[0]
  const key = first.type ? PASSWORD_CODES[first.type] : undefined
  if (key) return t(key, { min: 8, max: 128 })
  // Strip Pydantic's "Value error, " prefix before showing server text.
  return first.msg?.replace(/^Value error,\s*/, '') ?? null
}
