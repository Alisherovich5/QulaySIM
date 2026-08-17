/**
 * What the site actually felt like, reported by the visitor's own browser.
 *
 * Lighthouse on a developer's laptop measures a laptop. The customer here is on
 * a mid-range Android on 4G in Tashkent, three handshakes from a server in
 * Europe, on a route that loses packets in bursts. Every performance target in
 * the plan is a p75 of real visits, and a p75 cannot be produced any other way.
 *
 * Three rules this file follows, because it runs while someone is trying to buy
 * something:
 *
 *   1. It never delays the page. The library is imported dynamically after the
 *      first idle moment, so it is not in the critical path.
 *   2. It never breaks the page. Every failure is swallowed — a measurement that
 *      can throw is worse than no measurement.
 *   3. It sends nothing about the person. The route is a coarse name, never the
 *      URL: a URL carries query strings, and those carry things a timing sample
 *      has no business keeping.
 *
 * `sendBeacon` is what makes the report survive the visitor leaving, which is
 * exactly when the last metrics (CLS, INP) are known.
 */

/** A page name, not a path: `/destinations/turkey` is one kind of page. */
function routeName(pathname: string): string {
  const path = pathname.replace(/^\/(uz|ru|en)(?=\/|$)/, '') || '/'
  if (path === '/') return 'home'
  if (path === '/destinations') return 'destinations'
  if (path.startsWith('/destinations/region/')) return 'region'
  if (path.startsWith('/destinations/')) return 'country'
  if (path.startsWith('/guide/')) return 'guide'
  const first = path.split('/')[1] ?? ''
  // Only known page names, so a stray path cannot turn into a metric label.
  return /^[a-z-]{1,24}$/.test(first) ? first : 'other'
}

function send(metric: { name: string; value: number }): void {
  try {
    const body = JSON.stringify({
      metric: metric.name,
      // CLS is a ratio and needs its decimals; the rest are milliseconds where
      // a fraction is noise.
      value: metric.name === 'CLS' ? Number(metric.value.toFixed(3)) : Math.round(metric.value),
      route: routeName(location.pathname),
      // A coarse split, and the one that matters: a fast laptop average hides a
      // slow phone, and the phone is the customer.
      phone: window.matchMedia('(max-width: 640px)').matches,
    })
    const url = '/api/rum'
    if (navigator.sendBeacon?.(url, new Blob([body], { type: 'application/json' }))) return
    // Older Safari: a keepalive fetch is the fallback, and it may still be cut
    // off — losing a sample is acceptable, blocking the unload is not.
    void fetch(url, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'application/json' } })
  } catch {
    // Deliberately silent — see the note at the top of this file.
  }
}

let started = false

/** Begin reporting. Safe to call more than once; only the first call counts. */
export function startVitals(): void {
  if (started || typeof window === 'undefined') return
  started = true

  const begin = () => {
    import('web-vitals')
      .then(({ onCLS, onFCP, onINP, onLCP, onTTFB }) => {
        onLCP(send)
        onINP(send)
        onCLS(send)
        onTTFB(send)
        onFCP(send)
      })
      .catch(() => {
        // No measurement is a shame; a broken shop is not acceptable.
      })
  }

  if ('requestIdleCallback' in window) {
    ;(window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(begin)
  } else {
    setTimeout(begin, 2000)
  }
}
