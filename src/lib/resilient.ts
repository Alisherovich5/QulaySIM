/**
 * Making the catalogue survive the network it is actually served over.
 *
 * Measured from Tashkent on an ordinary evening: 40% packet loss to every
 * destination tested, including 8.8.8.8, and a TLS handshake that took four
 * seconds. The origin answered in 4 ms and an independent host 27 ms away saw
 * zero loss — so nothing was wrong with the server, and nothing we do there can
 * fix it. What reaches the customer is a request that sometimes never completes.
 *
 * That is what "the tariffs disappeared" was. A dropped request rejects, the
 * page that was waiting on it clears, and 207 countries become an empty screen
 * on a connection where a second attempt would have worked.
 *
 * Two belts, both on the safe half of the API — public catalogue reads, which
 * are identical for every visitor and free to repeat:
 *
 *   1. Retry. A lost packet is not an error, it is a thing that happens; at 40%
 *      loss two extra attempts turn a 40% failure rate into 6%.
 *   2. Last-good. Whatever did arrive is kept, so the attempt after that still
 *      has something true to show. Stale prices are announced (see StaleNotice)
 *      rather than passed off as current.
 *
 * Deliberately not covered: auth, checkout, account, and anything with a body.
 * Repeating those can charge somebody twice, and a cached answer to "who am I"
 * is a security bug, not a resilience feature.
 */

import type { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

/** The prefixes the API itself marks public — mirrored from the backend's cache middleware. */
const PUBLIC_PREFIXES = ['/countries', '/regions', '/plans', '/currency', '/content']

const ATTEMPTS = 3
/** Short, because the visitor is waiting: ~0.25 s then ~0.9 s, with jitter so
 *  a page firing three requests at once does not retry them in lockstep. */
const BACKOFF_MS = [250, 900]

const STORE_PREFIX = 'qs:snap:1:'
const MAX_ENTRIES = 80
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

/** Fired when a page is showing something older than this moment. */
export const STALE_EVENT = 'qs:stale-data'

type Retriable = InternalAxiosRequestConfig & { _attempt?: number }

export function isPublicRead(config?: InternalAxiosRequestConfig): boolean {
  const method = (config?.method ?? 'get').toLowerCase()
  if (method !== 'get') return false
  const url = config?.url ?? ''
  return PUBLIC_PREFIXES.some((p) => url === p || url.startsWith(`${p}/`) || url.startsWith(`${p}?`))
}

/** Worth another attempt: nothing came back, or the server said it had a bad
 *  moment. A 4xx is an answer — repeating it just wastes the visitor's time. */
export function isTransient(error: AxiosError): boolean {
  const status = error.response?.status
  if (status === undefined) return error.code !== 'ERR_CANCELED'
  return status >= 500 || status === 429
}

function keyFor(config: InternalAxiosRequestConfig, language: string): string {
  const params = config.params ? JSON.stringify(config.params) : ''
  return `${STORE_PREFIX}${language}:${config.url}${params}`
}

/**
 * The last answer that arrived, per URL and per language.
 *
 * localStorage rather than memory because the point is the visit *after* the
 * one that failed, and rather than a Cache API entry because this has to work
 * where a service worker does not run at all — a private window, an iOS
 * home-screen webview, the first load of a browser that has not installed one
 * yet. Every call is guarded: quota exceeded and a disabled storage both throw,
 * and neither is a reason to fail a page.
 */
export const snapshot = {
  put(key: string, data: unknown): void {
    try {
      localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: data }))
    } catch {
      // Out of quota, or storage denied. Prune once and give up quietly —
      // losing the belt is not worth losing the response.
      snapshot.prune(true)
      try {
        localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: data }))
      } catch {
        /* nothing left to do */
      }
    }
  },

  get(key: string): { data: unknown; age: number } | null {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const parsed = JSON.parse(raw) as { t?: number; d?: unknown }
      if (typeof parsed?.t !== 'number' || parsed.d === undefined) return null
      const age = Date.now() - parsed.t
      if (age > MAX_AGE_MS) {
        localStorage.removeItem(key)
        return null
      }
      return { data: parsed.d, age }
    } catch {
      return null
    }
  },

  /** Keep the store small: drop what expired, then the oldest over the cap. */
  prune(aggressive = false): void {
    try {
      const entries: { key: string; t: number }[] = []
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i)
        if (!key?.startsWith(STORE_PREFIX)) continue
        let t = 0
        try {
          t = (JSON.parse(localStorage.getItem(key) ?? '{}') as { t?: number }).t ?? 0
        } catch {
          t = 0
        }
        entries.push({ key, t })
      }
      const now = Date.now()
      const doomed = entries.filter((e) => !e.t || now - e.t > MAX_AGE_MS)
      const keep = entries.filter((e) => !doomed.includes(e)).sort((a, b) => b.t - a.t)
      const cap = aggressive ? Math.floor(MAX_ENTRIES / 2) : MAX_ENTRIES
      for (const entry of [...doomed, ...keep.slice(cap)]) localStorage.removeItem(entry.key)
    } catch {
      /* storage unavailable */
    }
  },
}

function announceStale(age: number): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(STALE_EVENT, { detail: { age } }))
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Wire both belts onto an axios instance.
 *
 * `language` is read lazily rather than captured: the visitor can switch
 * language mid-session and the catalogue comes back translated, so a Russian
 * answer must never be served out of the Uzbek slot.
 */
export function installResilience(instance: AxiosInstance, language: () => string): void {
  snapshot.prune()

  instance.interceptors.response.use(
    (response) => {
      if (isPublicRead(response.config)) {
        snapshot.put(keyFor(response.config, language()), response.data)
      }
      return response
    },
    async (error: AxiosError) => {
      const config = error.config as Retriable | undefined
      if (!config || !isPublicRead(config) || !isTransient(error)) return Promise.reject(error)

      const attempt = config._attempt ?? 0
      if (attempt < ATTEMPTS - 1) {
        config._attempt = attempt + 1
        const base = BACKOFF_MS[attempt] ?? BACKOFF_MS[BACKOFF_MS.length - 1]
        await wait(base + Math.random() * base * 0.4)
        return instance(config)
      }

      // Every attempt is gone. If this page has been seen before, showing what
      // it looked like beats showing nothing — and the notice says which it is.
      const cached = snapshot.get(keyFor(config, language()))
      if (!cached) return Promise.reject(error)
      announceStale(cached.age)
      return {
        data: cached.data,
        status: 200,
        statusText: 'stale',
        headers: {},
        config,
        request: undefined,
      } as AxiosResponse
    },
  )
}
