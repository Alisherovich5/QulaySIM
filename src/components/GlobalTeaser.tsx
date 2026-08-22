import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { api } from '../lib/api'
import { boot } from '../lib/boot'
import { useCatalogue } from '../lib/useCatalogue'
import type { Plan, RegionDetail } from '../lib/types'
import PlanCard from './PlanCard'
import { useCart } from '../context/CartContext'

/**
 * Worldwide plans, offered where the customer already is.
 *
 * The worldwide catalogue lived on one page nobody had a reason to open. A
 * traveller looking at Turkey with Georgia and Armenia on the same trip was
 * never told that one eSIM covers all three — so they bought three, or bought
 * one and topped up on arrival at someone else's price.
 *
 * Three plans, not twenty: this is a prompt, not the catalogue. The link
 * carries the rest.
 */

interface Props {
  /** Rendered under a country's own tariffs, or on the home page. */
  variant?: 'inline' | 'section'
  className?: string
}

export default function GlobalTeaser({ variant = 'inline', className = '' }: Props) {
  const { t, i18n } = useTranslation()
  const { add } = useCart()
  const navigate = useNavigate()
  const [added, setAdded] = useState<number | null>(null)

  // This strip sits on the home page, and an empty strip under a heading about
  // worldwide coverage reads as broken. The keep-on-failure rule lives in
  // useCatalogue; see lib/catalogue.ts.
  const { data: fetchedPlans } = useCatalogue<Plan[]>({
    seed: () => boot<RegionDetail>('global')?.plans ?? null,
    load: () => api.get<RegionDetail>('/regions/global').then((r) => r.data.plans ?? []),
    deps: [i18n.language],
  })
  const plans = fetchedPlans ?? []

  // Widest coverage first, then cheapest, one per size.
  //
  // Sorting on price alone put the three narrowest bundles on the page: they
  // are cheap precisely because they drop a third of the world, and this strip
  // has no country search for the customer to check against. On the worldwide
  // page that trade is visible and theirs to make; offered blind at the foot of
  // a country page it is a trap. So a teaser only ever shows plans at or near
  // the widest coverage we sell.
  const picks = useMemo(() => {
    const widest = Math.max(0, ...plans.map((p) => p.coverage?.length ?? 0))
    const eligible = widest > 0 ? plans.filter((p) => (p.coverage?.length ?? 0) >= widest * 0.9) : plans
    const bySize = new Map<number, Plan>()
    for (const plan of [...eligible].sort((a, b) => a.price_usd - b.price_usd)) {
      if (!bySize.has(plan.data_amount_mb)) bySize.set(plan.data_amount_mb, plan)
    }
    return [...bySize.values()].sort((a, b) => a.price_usd - b.price_usd).slice(0, 3)
  }, [plans])

  if (picks.length === 0) return null

  const handleAdd = (plan: Plan) => {
    // No ISO code: a worldwide eSIM belongs to no country, so the cart shows
    // the plan's own name rather than a flag it cannot choose.
    add(plan, t('global.cartLabel'), '')
    setAdded(plan.id)
    setTimeout(() => navigate('/checkout'), 350)
  }

  return (
    <section
      className={`${variant === 'section' ? 'container-page py-12 sm:py-16' : 'mt-14'} ${className}`}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-700 sm:text-2xl">{t('globalTeaser.title')}</h2>
          <p className="mt-1.5 max-w-xl text-sm text-slate-soft">{t('globalTeaser.lead')}</p>
        </div>
        <Link
          to="/global"
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-600 text-brand-600 hover:underline dark:text-accent-400"
        >
          {t('globalTeaser.all')} <ArrowRight size={15} aria-hidden />
        </Link>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {picks.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onAdd={handleAdd} added={added === plan.id} />
        ))}
      </div>
    </section>
  )
}
