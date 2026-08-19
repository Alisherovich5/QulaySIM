/*
 * The copy of the storefront that lives on the phone.
 *
 * Written for one measured condition: 40% packet loss on the visitor's link,
 * with the origin answering in 4 ms. On a connection like that the first
 * request of a page load is a coin flip, and losing it means a blank screen —
 * which is what "the tariffs disappeared" looked like from the customer's side.
 *
 * The retry-and-remember belts in lib/resilient.ts cover the data once the app
 * is running. This covers the part before that: the HTML, the JavaScript and
 * the fonts, which no amount of application code can rescue because none of it
 * has loaded yet.
 *
 * Three rules, and a fourth that matters more than the others:
 *
 *   navigation  network first, 4 s patience, then the last copy of that page
 *   /assets, /fonts   cache first — the names carry a content hash, so a hit is
 *                     never the wrong file
 *   public /api GETs  the cached answer immediately, refreshed in the background
 *   everything else   not our business: passed straight through
 *
 * The fourth rule: auth, checkout, account and every request with a body go to
 * the network untouched, always. A cached answer to "who is signed in" is a
 * security bug wearing a performance costume, and a replayed checkout charges
 * somebody twice.
 */

const VERSION = 'v1'
const SHELL = `qs-shell-${VERSION}`
const ASSETS = `qs-assets-${VERSION}`
const DATA = `qs-data-${VERSION}`
const MINE = [SHELL, ASSETS, DATA]

/** Mirrors the backend's public cache prefixes — the reads that are identical
 *  for every visitor. Anything outside this list is never stored. */
const PUBLIC_API = ['/api/countries', '/api/regions', '/api/plans', '/api/currency', '/api/content']

/** Long enough to beat a lossy handshake, short enough that a stuck request
 *  does not hold a blank page open. Measured: a good load is under 200 ms. */
const NAV_TIMEOUT_MS = 4000

const isAsset = (url) =>
  url.pathname.startsWith('/assets/') ||
  url.pathname.startsWith('/fonts/') ||
  /\.(?:woff2|png|webp|svg|jpg|jpeg|ico)$/.test(url.pathname)

const isPublicApi = (url) =>
  PUBLIC_API.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`))

/**
 * The cache key for a catalogue answer, with the language written into it.
 *
 * The API translates country and plan names and picks the language from the
 * Accept-Language header, so one URL has three different right answers. Keying
 * on the URL alone would serve a Russian visitor the Uzbek catalogue — so the
 * language goes in the key rather than being left to the response's Vary header,
 * which is correct today and would break this silently if it ever changed.
 */
function dataKey(request) {
  const lang = (request.headers.get('accept-language') || 'uz').split(',')[0].split('-')[0]
  const url = new URL(request.url)
  url.searchParams.set('__l', lang)
  return new Request(url.toString(), { headers: { 'accept-language': lang } })
}

self.addEventListener('install', () => {
  // Nothing is precached: the asset names are build hashes this file cannot
  // know, and the HTML is better fetched than guessed. Taking over at once
  // matters more, so a visitor who reloads on a bad link is already covered.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.filter((n) => n.startsWith('qs-') && !MINE.includes(n)).map((n) => caches.delete(n)))
      await self.clients.claim()
    })(),
  )
})

/** A response, or the cache if the network takes too long. */
async function networkFirst(request, cacheName, timeoutMs) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const network = fetch(request)
    .then((response) => {
      if (response.ok) void cache.put(request, response.clone())
      return response
    })

  if (!cached) return network

  const timeout = new Promise((resolve) => setTimeout(() => resolve(null), timeoutMs))
  const winner = await Promise.race([network.catch(() => null), timeout])
  return winner ?? cached
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)
  if (cached) return cached
  const response = await fetch(request)
  if (response.ok) void cache.put(request, response.clone())
  return response
}

/** The cached answer now, a fresh one for next time. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DATA)
  const key = dataKey(request)
  const cached = await cache.match(key)

  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) void cache.put(key, response.clone())
      return response
    })
    .catch(() => null)

  if (cached) {
    // The refresh is deliberately not awaited: the page gets the old answer in
    // a millisecond, and the new one lands before the next visit.
    void refresh
    return cached
  }
  const fresh = await refresh
  if (fresh) return fresh
  return new Response(JSON.stringify({ detail: 'offline' }), {
    status: 504,
    headers: { 'content-type': 'application/json' },
  })
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL, NAV_TIMEOUT_MS))
    return
  }
  if (isAsset(url)) {
    event.respondWith(cacheFirst(request, ASSETS))
    return
  }
  if (isPublicApi(url)) {
    event.respondWith(staleWhileRevalidate(request))
  }
  // Anything else — /api/auth, /api/account, /api/checkout, third parties —
  // falls through to the network with no involvement from this file.
})

/** The way out. If this ever needs to be switched off, the page posts
 *  `{type: 'kill'}` and the next load is served entirely by the network. */
self.addEventListener('message', (event) => {
  if (event.data?.type !== 'kill') return
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(names.filter((n) => n.startsWith('qs-')).map((n) => caches.delete(n)))
      await self.registration.unregister()
    })(),
  )
})
