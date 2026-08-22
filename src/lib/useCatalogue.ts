import { useEffect, useRef, useState } from 'react'
import type { AxiosError } from 'axios'

import { nextData, type Rules } from './catalogue'

/**
 * The catalogue, as a page should hold it.
 *
 * Three steps, in one place: start from the copy baked into this page's HTML,
 * ask the API for a fresher one, and keep what is on screen if the answer does
 * not arrive. See catalogue.ts for why that third step is the whole point —
 * hand-written at six call sites, two of them had it wrong on the same day.
 *
 * `key` and `deps` are deliberately separate, because the call sites want two
 * different things:
 *
 *   - **key** identifies *which thing* is being shown. A destination page moving
 *     from Turkey to Georgia changes the key, and everything about the previous
 *     country is now wrong — so the data resets to the seed for the new key.
 *   - **deps** are reasons to *ask again* about the same thing: the visitor's
 *     language, a search box, a region filter. The list on screen stays until
 *     the new answer arrives, because it is still an answer about this thing.
 *
 * Getting those two confused is what the separation prevents: resetting on a
 * filter change flashes the whole catalogue, and *not* resetting on an identity
 * change shows Turkey's prices under Georgia's name.
 */
export function useCatalogue<T>(
  options: {
    seed: () => T | null
    load: () => Promise<T>
    /** Which thing is being shown. A change resets to the seed. */
    key?: string | number
    /** Reasons to ask again about the same thing. A change keeps what is shown. */
    deps?: unknown[]
    /** For a call site that only needs the catalogue in some layouts. */
    enabled?: boolean
  } & Rules,
): { data: T | null; loading: boolean; missing: boolean } {
  const { seed, load, key, deps = [], enabled = true, clearOnMissing } = options
  const [data, setData] = useState<T | null>(seed)
  const [loading, setLoading] = useState(enabled)
  const [missing, setMissing] = useState(false)
  const lastKey = useRef(key)

  useEffect(() => {
    if (!enabled) return

    // A new identity: nothing about the old one carries over.
    if (lastKey.current !== key) {
      lastKey.current = key
      setData(seed())
      setMissing(false)
    }

    let alive = true
    setLoading(true)

    load()
      .then((fresh) => {
        if (!alive) return
        setData((current) => nextData(current, { kind: 'ok', data: fresh }, { clearOnMissing }))
        setMissing(false)
      })
      .catch((error: unknown) => {
        if (!alive) return
        const status = (error as AxiosError)?.response?.status
        const gone = status === 404
        setData((current) =>
          nextData(current, gone ? { kind: 'missing' } : { kind: 'failed' }, { clearOnMissing }),
        )
        if (gone) setMissing(true)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })

    return () => {
      alive = false
    }
    // `seed` and `load` are rebuilt every render; the call site says through
    // `key` and `deps` when the work should actually run again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, clearOnMissing, key, ...deps])

  return { data, loading, missing }
}
