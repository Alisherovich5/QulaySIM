/**
 * Data the build baked into the page, for the first render.
 *
 * Measured from Tashkent, one API request costs about 350 ms of network against
 * 2–4 ms of work on the server — three handshakes across a continent — and the
 * app could not even start asking until its JavaScript had loaded and run. So a
 * visitor watched an empty tariff grid for roughly a second before the first
 * price appeared, on a page whose prices had been known since build time.
 *
 * The prerender step now writes them into the document as a JSON data block.
 * Reading it costs nothing and cannot fail the page: anything unexpected here
 * returns null and the app falls back to fetching, which is what it did before.
 *
 * Parsed once. The element is left in the document rather than removed — it is
 * inert data, and a second component mounting later (or a language switch
 * remounting a page) would otherwise find nothing.
 */

let cache: Record<string, unknown> | null | undefined

function read(): Record<string, unknown> | null {
  if (cache !== undefined) return cache
  cache = null
  try {
    const node = document.getElementById('__DATA__')
    if (node?.textContent) {
      const parsed = JSON.parse(node.textContent)
      if (parsed && typeof parsed === 'object') cache = parsed as Record<string, unknown>
    }
  } catch {
    // A malformed block is a build bug, not a reason to blank the page.
  }
  return cache
}

/** The baked value under `key`, or null when this page carries none. */
export function boot<T>(key: string): T | null {
  const data = read()
  const value = data?.[key]
  return (value ?? null) as T | null
}

/**
 * The baked value, but only when it is the one this route asked for.
 *
 * A prerendered country page carries that country. Navigating client-side to a
 * different one must not seed the new page with the old country's prices — the
 * check is what keeps "instant" from becoming "wrong".
 */
export function bootIf<T extends { slug?: string }>(key: string, slug: string | undefined): T | null {
  const value = boot<T>(key)
  if (!value || !slug) return null
  return value.slug === slug ? value : null
}
