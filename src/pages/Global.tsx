import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, Globe2, Plane, QrCode, ShieldCheck } from 'lucide-react'
import Seo from '../components/Seo'
import type { SeoLang } from '../lib/seo'
import { breadcrumbLd } from '../lib/structured-data'
import { api } from '../lib/api'
import type { Plan, Region, RegionDetail } from '../lib/types'
import Flag from '../components/Flag'
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

      {/* Hero.
          The first version was a flat green block with the copy in the left half
          and nothing in the right — which is what made it read as a placeholder
          rather than a product page. It now works as two columns on a wide screen:
          the offer on the left, and on the right the thing being sold, drawn as a
          stack of country chips over a lit globe.

          The headline is the offer, not the category: "one eSIM, every country"
          makes someone stop; "Global tariflar" does not. */}
      <div className="relative overflow-hidden rounded-3xl bg-brand-800 text-white">
        {/* Two glows and a fine grid. Depth without an image to download: a plain
            gradient over a large area is exactly what looks cheap. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_15%_10%,#0f9b7d_0%,transparent_55%),radial-gradient(90%_80%_at_95%_100%,#0b6b6b_0%,transparent_60%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:56px_56px]"
        />

        <div className="relative grid items-center gap-10 px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-600 ring-1 ring-white/20 backdrop-blur">
              <Globe2 size={14} aria-hidden />
              {t('global.eyebrow')}
            </span>
            {/* `text-white` explicitly: the global stylesheet gives headings the
                ink colour, which beats the colour inherited from the hero — in the
                light theme the headline came out near-black on dark green. */}
            <h1 className="mt-4 text-3xl font-700 leading-[1.08] text-white sm:text-5xl">
              {t('global.title')}
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 sm:text-base">
              {t('global.lead')}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-4">
              <a
                href="#plans"
                className="focus-ring inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 font-700 text-brand-800 shadow-lg shadow-black/20 transition hover:bg-white/90"
              >
                {t('global.cta')}
                <ArrowRight size={17} aria-hidden />
              </a>
              {cheapest != null && (
                <span className="text-sm text-white/75">
                  {t('global.fromPrice')}{' '}
                  <span className="font-700 text-white">{formatPrice(cheapest)}</span>
                </span>
              )}
            </div>
          </div>

          {/* The product, drawn. Country chips floating over a globe says
              "works in these places" faster than a sentence does, and it fills
              the half of the panel that was empty. */}
          <div aria-hidden className="relative hidden h-[300px] lg:block">
            <div className="absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_32%_28%,#2ee6b0_0%,#0e8f7a_38%,#075a55_72%,#04333a_100%)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6),inset_-24px_-24px_60px_rgba(0,0,0,0.45)]" />
            <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-white/15" />
            {[
              { code: 'TR', top: '4%', left: '6%' },
              { code: 'AE', top: '22%', left: '68%' },
              { code: 'DE', top: '52%', left: '0%' },
              { code: 'TH', top: '74%', left: '58%' },
              { code: 'US', top: '86%', left: '14%' },
            ].map((c) => (
              <span
                key={c.code}
                style={{ top: c.top, left: c.left }}
                className="absolute inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-700 text-brand-900 shadow-lg shadow-black/25"
              >
                <Flag iso2={c.code} className="h-3 w-4 rounded-[2px]" />
                {c.code}
              </span>
            ))}
            <span className="absolute bottom-[38%] right-[2%] inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-3 py-1 text-[11px] font-700 text-white shadow-lg shadow-black/30">
              +200
            </span>
          </div>
        </div>
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
      <h2 id="plans" className="mt-12 scroll-mt-24 text-xl font-700 sm:text-2xl">
        {t('global.plansTitle')}
      </h2>
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
