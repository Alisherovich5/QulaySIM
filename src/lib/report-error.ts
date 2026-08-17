/**
 * Crashes in a customer's browser, reported to our own API.
 *
 * Not the Sentry browser SDK, and that is a considered choice rather than a
 * shortcut. The SDK is around 30 KB on every page load, over a connection where
 * a round trip costs ~350 ms, to catch an event that happens to a small fraction
 * of visitors — and the size budget introduced in the same review would have
 * been spent on it. This is a few hundred bytes and reports the three things
 * that actually get a bug fixed: what broke, where, and in which build.
 *
 * Server-side crashes still go to Sentry when a DSN is configured; the endpoint
 * logs these at error level, so they arrive there too without a second SDK.
 *
 * Everything here is best-effort. A reporter that can throw would turn one
 * broken component into a broken page.
 */

/** Same coarse page names the timing reports use. */
function routeName(pathname: string): string {
  const path = pathname.replace(/^\/(uz|ru|en)(?=\/|$)/, '') || '/'
  if (path === '/') return 'home'
  if (path.startsWith('/destinations/region/')) return 'region'
  if (path.startsWith('/destinations/')) return 'country'
  if (path.startsWith('/guide/')) return 'guide'
  const first = path.split('/')[1] ?? ''
  return /^[a-z-]{1,24}$/.test(first) ? first : 'other'
}

/** One message per session per kind: a render loop must not become a flood. */
const seen = new Set<string>()

export function reportError(error: unknown, source = ''): void {
  try {
    const message = String(
      (error as { message?: unknown })?.message ?? error ?? 'unknown',
    ).slice(0, 300)
    const key = `${message}|${source}`
    if (seen.has(key) || seen.size > 20) return
    seen.add(key)

    const body = JSON.stringify({
      message,
      source: source.slice(0, 200),
      route: routeName(location.pathname),
      // Set at build time by Vite, so a fixed bug stops being counted.
      build: (import.meta.env.VITE_BUILD ?? '').toString().slice(0, 40),
    })
    const url = '/api/client-errors'
    if (navigator.sendBeacon?.(url, new Blob([body], { type: 'application/json' }))) return
    void fetch(url, {
      method: 'POST',
      body,
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch {
    // Nothing to do about a failure to report a failure.
  }
}

/** Catch what React's error boundaries never see. */
export function installErrorReporting(): void {
  if (typeof window === 'undefined') return
  window.addEventListener('error', (event) => {
    reportError(event.error ?? event.message, `${event.filename}:${event.lineno}`)
  })
  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, 'unhandledrejection')
  })
}
