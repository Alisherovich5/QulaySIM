import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from './api'
import type { LandingContent, Promo } from './types'

/** Shared across the app so the strip on every page costs one request, not one per mount. */
let cached: { lang: string; promo: Promo | null } | null = null
let inFlight: Promise<Promo | null> | null = null

/**
 * The live promo banner, or null.
 *
 * The strip sits in the navigation, so it renders on every page — hence the
 * module-level cache and the shared in-flight promise. Without them, moving
 * between pages would refetch the same banner each time.
 */
export function usePromo(): Promo | null {
  const { i18n } = useTranslation()
  const lang = i18n.language?.split('-')[0] || 'en'
  const [promo, setPromo] = useState<Promo | null>(
    cached && cached.lang === lang ? cached.promo : null,
  )

  useEffect(() => {
    let alive = true
    if (cached && cached.lang === lang) {
      setPromo(cached.promo)
      return
    }
    inFlight ??= api
      .get<LandingContent>('/content/landing', { params: { lang } })
      .then((r) => r.data?.promo ?? null)
      // A missing banner is not an error worth surfacing — the strip falls back
      // to its built-in wording.
      .catch(() => null)
      .finally(() => {
        inFlight = null
      })

    inFlight.then((value) => {
      cached = { lang, promo: value }
      if (alive) setPromo(value)
    })
    return () => {
      alive = false
    }
  }, [lang])

  return promo
}
