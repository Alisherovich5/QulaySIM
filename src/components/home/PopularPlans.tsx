import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Clock, Wifi } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import type { PopularPlan } from '../../lib/types'
import Flag from '../Flag'
import Reveal from '../Reveal'
import { PriceTag, SectionHeading } from '../ui'

/**
 * Tariffs marked popular in the admin, on the landing page.
 *
 * The destinations grid above answers "where can I go"; this answers "what does
 * it actually cost", which is the question that decides whether someone starts a
 * purchase. One plan per destination — six tariffs for one country reads worse
 * than six countries, and the flags are what make the row scannable.
 *
 * Renders nothing when no plan is marked popular, rather than an empty heading.
 */
export default function PopularPlans() {
  const { t } = useTranslation()
  const [plans, setPlans] = useState<PopularPlan[] | null>(null)

  useEffect(() => {
    let alive = true
    api
      .get<PopularPlan[]>('/plans/popular', { params: { limit: 6 } })
      .then((r) => alive && setPlans(r.data))
      .catch(() => alive && setPlans([]))
    return () => {
      alive = false
    }
  }, [])

  if (!plans || plans.length === 0) return null

  return (
    <section className="border-t border-line bg-surface py-16">
      <div className="container-page">
        <SectionHeading
          align="center"
          title={t('home.popularPlansTitle')}
          subtitle={t('home.popularPlansSubtitle')}
        />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 50}>
              <Link
                to={`/destinations/${plan.country_slug}`}
                className="group flex h-full flex-col justify-between rounded-2xl border border-line bg-canvas p-5 transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 dark:border-white/10 dark:hover:border-accent-400/45"
              >
                <div className="flex items-start gap-3">
                  <Flag
                    iso2={plan.country_iso2}
                    alt=""
                    className="h-8 w-12 shrink-0 rounded-md object-cover ring-1 ring-line"
                  />
                  {/* The plan title is deliberately not shown: it reads
                      "Japan 3 GB · 15 days", which repeats the heading above it
                      and the spec row below it. Three copies of one fact is
                      noise, not emphasis. */}
                  <span className="min-w-0">
                    <p className="truncate font-700 text-ink">{plan.country_name}</p>
                    <p className="truncate text-xs text-slate-soft">
                      {t('home.popularPlansFrom')}
                    </p>
                  </span>
                </div>

                <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-soft">
                  <li className="flex items-center gap-1.5">
                    <Wifi size={13} className="text-brand-500" /> {plan.data_label}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Clock size={13} className="text-brand-500" />{' '}
                    {t('plan.validFor', { days: plan.validity_days })}
                  </li>
                  <li className="rounded-full bg-brand-50 px-2 py-0.5 font-600 text-brand-700 dark:bg-white/10 dark:text-accent-300">
                    {plan.network_type}
                  </li>
                </ul>

                <div className="mt-5 flex items-end justify-between border-t border-line pt-4">
                  <span className="min-w-0">
                    <PriceTag usd={plan.price_usd} size="sm" className="text-ink" />
                    {/* The note is why this is not just a number — "+ deposit"
                        has to travel with the price wherever it is shown. */}
                    <small className="mt-0.5 block truncate text-[11px] text-slate-soft">
                      {plan.price_note || t('plan.oneTime')}
                    </small>
                  </span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition duration-200 group-hover:bg-brand-600 group-hover:text-white dark:bg-white/10 dark:text-accent-300 dark:group-hover:bg-accent-400 dark:group-hover:text-brand-950">
                    <ArrowRight size={17} />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
