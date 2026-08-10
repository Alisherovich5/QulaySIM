import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Globe2, Plane, QrCode, ShieldCheck } from 'lucide-react'
import Seo from '../components/Seo'
import type { SeoLang } from '../lib/seo'
import { breadcrumbLd } from '../lib/structured-data'
import { api } from '../lib/api'
import type { Plan, Region, RegionDetail } from '../lib/types'
import PlanCard from '../components/PlanCard'
import Reveal from '../components/Reveal'
import { Card } from '../components/ui'
import { useCart } from '../context/CartContext'
import { useCurrency } from '../context/CurrencyContext'

/**
 * The page for the product a traveller with several stops actually wants.
 *
 * These plans existed all along — six worldwide and thirty-six regional, priced
 * and sellable — reachable only as small text links at the foot of the
 * destinations page. So somebody visiting three countries bought three separate
 * eSIMs, because nothing told them they did not have to. The catalogue was never
 * the gap; the shop window was.
 *
 * Built as its own address rather than a section, because it is a different
 * decision from "which country am I going to": a customer who does not yet know
 * their whole itinerary is exactly the person this is for, and that customer has
 * no country page to arrive on.
 */
export default function Global() {
  const { t, i18n } = useTranslation()
  const { formatPrice } = useCurrency()
  const { add } = useCart()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<RegionDetail | null>(null)
  const [regions, setRegions] = useState<Region[]>([])
  const [added, setAdded] = useState<number | null>(null)

  useEffect(() => {
    // Independent requests: the worldwide plans are the page, and losing the
    // region list should cost a section rather than the whole thing.
    api
      .get<RegionDetail>('/regions/global')
      .then((r) => setDetail(r.data))
      .catch(() => setDetail(null))
    api
      .get<Region[]>('/regions')
      .then((r) => setRegions(r.data))
      .catch(() => setRegions([]))
  }, [i18n.language])

  // Regions that actually sell a multi-country plan. The worldwide one is this
  // page, so it is not offered again as an alternative to itself.
  const regionCards = useMemo(
    () => regions.filter((r) => r.starting_price != null && r.slug !== 'global'),
    [regions],
  )

  const cheapest = detail?.starting_price ?? null

  const handleAdd = (plan: Plan) => {
    // No ISO code: a worldwide eSIM belongs to no country, so the cart shows the
    // plan's own name rather than a flag it cannot choose.
    add(plan, t('global.cartLabel'), '')
    setAdded(plan.id)
    setTimeout(() => navigate('/checkout'), 350)
  }

  const lang = (i18n.language.split('-')[0] || 'uz') as SeoLang

  return (
    <div className="container-page py-8 sm:py-12">
      {/* `Seo` reads the path from the router itself, so it is not passed. */}
      <Seo
        title={t('global.seoTitle')}
        description={t('global.seoDescription')}
        jsonLd={breadcrumbLd([{ name: t('global.title'), path: '/global' }], lang)}
      />

      {/* Hero. The headline is the offer, not the category: "one eSIM, every
          country" is the thing that makes someone stop, and "Global tariflar"
          is not. */}
      <div className="rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 px-6 py-10 text-white sm:px-10 sm:py-14">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-600 backdrop-blur">
          <Globe2 size={14} aria-hidden />
          {t('global.eyebrow')}
        </span>
        <h1 className="mt-4 max-w-2xl text-3xl font-700 leading-tight sm:text-5xl">
          {t('global.title')}
        </h1>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
          {t('global.lead')}
        </p>

        {cheapest != null && (
          <p className="mt-6 text-sm text-white/80">
            {t('global.fromPrice')}{' '}
            <span className="text-xl font-700 text-white">{formatPrice(cheapest)}</span>
          </p>
        )}
      </div>

      {/* Why, in three lines. A traveller weighing this against buying per
          country needs the comparison spelled out once. */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Plane, key: 'reasonOne' },
          { icon: QrCode, key: 'reasonTwo' },
          { icon: ShieldCheck, key: 'reasonThree' },
        ].map(({ icon: Icon, key }) => (
          <Card key={key} className="flex gap-3 p-5">
            <Icon size={20} className="mt-0.5 shrink-0 text-brand-500 dark:text-accent-400" aria-hidden />
            <div>
              <p className="font-700 text-ink">{t(`global.${key}Title`)}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-soft">{t(`global.${key}Text`)}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* The plans */}
      <h2 className="mt-12 text-xl font-700 sm:text-2xl">{t('global.plansTitle')}</h2>
      <p className="mt-1.5 text-sm text-slate-soft">{t('global.plansSubtitle')}</p>

      {detail && detail.plans.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {detail.plans.map((plan, i) => (
            <Reveal key={plan.id} delay={i * 50}>
              <PlanCard plan={plan} onAdd={handleAdd} added={added === plan.id} />
            </Reveal>
          ))}
        </div>
      ) : (
        <Card className="mt-6 p-6 text-sm text-slate-soft">{t('global.plansEmpty')}</Card>
      )}

      {/* The cheaper alternative, said plainly. A customer going only around
          Europe should buy the Europe plan, and hiding that to sell the dearer
          worldwide one would be the kind of trick that costs a second purchase. */}
      {regionCards.length > 0 && (
        <>
          <h2 className="mt-14 text-xl font-700 sm:text-2xl">{t('global.regionsTitle')}</h2>
          <p className="mt-1.5 text-sm text-slate-soft">{t('global.regionsSubtitle')}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {regionCards.map((r) => (
              <Link
                key={r.slug}
                to={`/destinations/region/${r.slug}`}
                className="focus-ring lift group flex items-center justify-between gap-3 rounded-2xl bg-surface p-4 ring-1 ring-line transition hover:ring-brand-300"
              >
                <span className="min-w-0">
                  <span className="block truncate font-700 text-ink group-hover:text-brand-600">
                    {t(`region.${r.slug}`, { defaultValue: r.name })}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-soft">
                    {t('destinations.regionCountries', { count: r.country_count })}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[11px] text-slate-soft">
                    {t('destinations.priceFrom')}
                  </span>
                  <span className="block font-700 text-brand-600 dark:text-accent-400">
                    {formatPrice(r.starting_price)}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </>
      )}

      {/* How it works, three steps, ending at the guide rather than repeating it. */}
      <Card className="mt-14 p-6 sm:p-8">
        <h2 className="text-xl font-700">{t('global.howTitle')}</h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {['howOne', 'howTwo', 'howThree'].map((key, i) => (
            <li key={key} className="flex gap-3">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-500/10 text-sm font-700 text-brand-600 dark:text-accent-400">
                {i + 1}
              </span>
              <p className="text-sm leading-relaxed text-slate-soft">{t(`global.${key}`)}</p>
            </li>
          ))}
        </ol>
        <Link
          to="/esim-ornatish"
          className="focus-ring mt-6 inline-flex min-h-11 items-center gap-1.5 text-sm font-600 text-brand-600 hover:underline dark:text-accent-400"
        >
          <Check size={15} aria-hidden />
          {t('global.howLink')}
        </Link>
      </Card>
    </div>
  )
}
