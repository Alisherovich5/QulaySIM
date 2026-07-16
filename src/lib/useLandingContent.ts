import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from './api'
import type { LandingContent } from './types'

/**
 * Fetches admin-managed landing content for the active language.
 * Returns `null` until loaded (or on error) so sections can fall back to
 * their i18n defaults and never render empty.
 */
export function useLandingContent(): LandingContent | null {
  const { i18n } = useTranslation()
  const lang = i18n.language?.split('-')[0] || 'en'
  const [data, setData] = useState<LandingContent | null>(null)

  useEffect(() => {
    let alive = true
    api
      .get<LandingContent>('/content/landing', { params: { lang } })
      .then((r) => {
        if (alive) setData(r.data)
      })
      .catch(() => {
        if (alive) setData(null)
      })
    return () => {
      alive = false
    }
  }, [lang])

  return data
}
