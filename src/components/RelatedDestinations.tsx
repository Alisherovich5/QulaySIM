import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { api } from '../lib/api'
import Flag from './Flag'
import type { Country } from '../lib/types'

const MAX = 6

/**
 * Links from one destination to its neighbours.
 *
 * Every country page used to be a dead end: the only way out was back to the
 * full list. That leaves each page hanging off the catalogue by a single link,
 * which is both a poor route for someone comparing Turkey against Georgia and a
 * poor one for a crawler — pages reachable by one path from one hub get visited
 * rarely and carry little of the site's authority.
 *
 * Grouping by region rather than by popularity is deliberate. It builds a real
 * cluster of related pages that reinforce each other on "eSIM for the Caucasus"
 * style queries, and it matches how somebody actually plans a trip.
 */
export default function RelatedDestinations({
  regionSlug,
  currentSlug,
}: {
  regionSlug: string | undefined
  currentSlug: string
}) {
  const { t, i18n } = useTranslation()
  const [siblings, setSiblings] = useState<Country[]>([])

  useEffect(() => {
    if (!regionSlug) return
    let alive = true
    api
      .get<Country[]>('/countries', { params: { region: regionSlug } })
      .then((r) => {
        if (!alive) return
        setSiblings(r.data.filter((c) => c.slug !== currentSlug).slice(0, MAX))
      })
      .catch(() => {
        // A missing "you might also like" strip is not worth an error state.
      })
    return () => {
      alive = false
    }
  }, [regionSlug, currentSlug, i18n.language])

  if (siblings.length === 0) return null

  return (
    <section className="mt-12">
      <h2 className="text-base font-700 sm:text-lg">{t('seo.relatedTitle')}</h2>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {siblings.map((c) => (
          <Link
            key={c.slug}
            to={`/destinations/${c.slug}`}
            className="focus-ring flex min-h-11 items-center gap-2.5 rounded-xl bg-surface px-3.5 text-sm font-600 text-ink ring-1 ring-line transition hover:ring-brand-300 hover:text-brand-600"
          >
            <Flag iso2={c.iso2} w={40} alt="" className="h-4 w-6 rounded-[3px] object-cover" />
            <span>{c.name}</span>
            {c.starting_price != null && (
              <span className="text-xs font-600 text-slate-soft">
                {t('common.from')} ${c.starting_price.toFixed(2)}
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
