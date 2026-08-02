import { useTranslation } from 'react-i18next'
import { Infinity as InfinityIcon, Layers, Share2, Signal, Tag, Timer } from 'lucide-react'

import type { DestinationFacts as Facts } from '../lib/destination-facts'

/**
 * The part of a destination page that is only true of that destination.
 *
 * Written for two readers at once. A visitor gets the answers they came for —
 * how much, how long, which network — without scrolling a grid of cards. A
 * search engine gets the several hundred characters of country-specific prose
 * that these pages were missing, which is what stops twenty-five plan lists
 * from reading as twenty-five copies of one page.
 *
 * Every value is computed from the plans rendered below it, so it cannot drift
 * out of date and cannot promise something the catalogue does not sell.
 */
export default function DestinationFacts({
  facts,
  country,
}: {
  facts: Facts
  country: string
}) {
  const { t } = useTranslation()

  const rows: { icon: typeof Layers; label: string; value: string }[] = [
    { icon: Layers, label: t('seo.factsPlans'), value: String(facts.planCount) },
    { icon: Tag, label: t('seo.factsFrom'), value: `$${facts.minPrice.toFixed(2)}` },
    {
      icon: Timer,
      label: t('seo.factsValidity'),
      value: t('seo.factsValidityValue', {
        days:
          facts.minDays === facts.maxDays
            ? facts.minDays
            : `${facts.minDays}–${facts.maxDays}`,
      }),
    },
  ]
  if (facts.networks.length) {
    rows.push({ icon: Signal, label: t('seo.factsNetworks'), value: facts.networks.join(' / ') })
  }
  rows.push({
    // Share2, not Wifi: the networks row above already owns the signal
    // metaphor, and two identical icons make the list read as one repeated fact.
    icon: Share2,
    label: t('seo.factsHotspot'),
    value: facts.hotspot ? t('seo.factsHotspotYes') : t('seo.factsHotspotNo'),
  })

  return (
    <section className="card mt-8 p-5 sm:p-6">
      {/* h2, not h1: the country name above it is the page's heading, and two
          h1s make a search engine guess which one the page is about. */}
      <h2 className="text-base font-700 sm:text-lg">{t('seo.factsTitle', { country })}</h2>

      <dl className="mt-4 grid gap-x-6 gap-y-3.5 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-start gap-3">
            <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600 dark:bg-white/10 dark:text-accent-400">
              <row.icon size={15} aria-hidden />
            </span>
            <div className="min-w-0">
              <dt className="text-xs font-600 uppercase tracking-[0.06em] text-slate-soft">
                {row.label}
              </dt>
              <dd className="mt-0.5 text-sm font-600 text-ink">{row.value}</dd>
            </div>
          </div>
        ))}
      </dl>

      {facts.hasUnlimited && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent-50 px-3 py-2 text-sm font-600 text-accent-700 dark:bg-accent-400/10 dark:text-accent-300">
          <InfinityIcon size={15} aria-hidden />
          {t('seo.factsUnlimited')}
        </p>
      )}
    </section>
  )
}
