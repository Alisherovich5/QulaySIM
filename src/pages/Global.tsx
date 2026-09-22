import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Globe, Layers, Tag } from 'lucide-react'
import Seo from '../components/Seo'
import type { SeoLang } from '../lib/seo'
import { breadcrumbLd } from '../lib/structured-data'
import { api } from '../lib/api'
import { boot } from '../lib/boot'
import { useCatalogue } from '../lib/useCatalogue'
import type { Country, Plan, Region, RegionDetail } from '../lib/types'
import GlobalPlanExplorer from '../components/global/GlobalPlanExplorer'
import CoverageCheck from '../components/global/CoverageCheck'
import { Card } from '../components/ui'
import { useCart } from '../context/CartContext'
import { useCurrency } from '../context/CurrencyContext'
/* A stable identity for "nothing yet".
 *
 * `?? []` builds a new array on every render, which quietly defeats every
 * useMemo downstream — the filters and sorts below re-run on each keystroke
 * elsewhere in the page. One frozen constant costs nothing and keeps them memoised. */
const NO_REGIONS: Region[] = []
const NO_COUNTRIES: Country[] = []

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

  // Seeded from what the build baked into this page: the worldwide grid used to
  // be empty for anyone whose request was lost, on a route where requests are
  // lost in bursts. The fetch below still runs and replaces it.
  const [added, setAdded] = useState<number | null>(null)
  const [picked, setPicked] = useState<{ iso2: string; name: string } | null>(null)

  // Three independent requests: losing the region list should cost a section,
  // not the page. Each keeps what is on screen when its request is lost — the
  // rule lives in useCatalogue now, stated once. See lib/catalogue.ts.
  const { data: detail } = useCatalogue<RegionDetail>({
    seed: () => boot<RegionDetail>('global'),
    load: () => api.get<RegionDetail>('/regions/global').then((r) => r.data),
    deps: [i18n.language],
  })
  const { data: fetchedRegions } = useCatalogue<Region[]>({
    seed: () => null,
    load: () => api.get<Region[]>('/regions').then((r) => r.data),
    deps: [i18n.language],
  })
  const regions = fetchedRegions ?? NO_REGIONS
  // Our own country names, in the visitor's language. The browser's
  // Intl.DisplayNames knows Turkey as "Türkiye" and has no Uzbek data at all,
  // so a customer typing "Turkiya" was told no such country exists — on the
  // page whose whole job is answering "is my stop included?". A stale name list
  // beats no names at all, which is exactly what keep-on-failure gives.
  const { data: fetchedCountries } = useCatalogue<Country[]>({
    seed: () => null,
    load: () => api.get<Country[]>('/countries?limit=400').then((r) => r.data),
    deps: [i18n.language],
  })
  const countries = fetchedCountries ?? NO_COUNTRIES

  // Regions that actually sell a multi-country plan. The worldwide one is this
  // page, so it is not offered again as an alternative to itself.
  const regionCards = useMemo(
    () => regions.filter((r) => r.starting_price != null && r.slug !== 'global'),
    [regions],
  )

  const cheapest = detail?.starting_price ?? null

  // The widest coverage list we actually sell. Everything the hero claims is
  // read from this, so the page cannot promise more than the catalogue holds.
  const widest = useMemo(() => {
    let best: string[] = []
    for (const plan of detail?.plans ?? []) {
      const codes = plan.coverage ?? []
      if (codes.length > best.length) best = codes
    }
    return best
  }, [detail])

  const handleAdd = (plan: Plan) => {
    // No ISO code: a worldwide eSIM belongs to no country, so the cart shows the
    // plan's own name rather than a flag it cannot choose.
    add(plan, t('global.cartLabel'), '')
    setAdded(plan.id)
    setTimeout(() => navigate('/checkout'), 350)
  }

  const lang = (i18n.language.split('-')[0] || 'uz') as SeoLang

  return (
    <div className="qs-page qs-global container-page">
      {/* `Seo` reads the path from the router itself, so it is not passed. */}
      <Seo
        title={t('global.seoTitle')}
        description={t('global.seoDescription')}
        jsonLd={breadcrumbLd([{ name: t('global.title'), path: '/global' }], lang)}
      />

      {/* The hero, laid out the way the decision is made.
       *
       * Two columns rather than one centred stack: the left half carries the
       * claim, the numbers behind it and the control that answers "is my stop
       * included?", and the right half carries the product. A centred column
       * put the search — the only thing on this page a visitor can act on —
       * below the fold on a laptop.
       *
       * Every figure is still read from the catalogue, so the page cannot
       * promise more countries or a lower price than we actually sell. */}
      <section className="gl-hero">
        <div className="gl-hero-copy">
          {/* Two lines, two colours, and the full sentence still one heading
              for anything that reads the page aloud. The stops sit outside the
              translated strings because they are punctuation, not words —
              which is also what lets them carry their own colour. */}
          <h1 className="gl-title">
            <span className="gl-title-line">
              {t('global.titleLead')}
              <span className="gl-title-dot">.</span>
            </span>
            <span className="gl-title-line is-accent">
              {t('global.titleTrail')}
              <span className="gl-title-dot">.</span>
            </span>
          </h1>
          <p className="gl-lead">{t('global.lead', { count: widest.length })}</p>

          {/* Numbers, not adjectives — every one computed from what the
              catalogue actually holds. */}
          <dl className="gl-figures">
            <div>
              <Globe size={22} strokeWidth={1.75} aria-hidden />
              <dd>{widest.length}</dd>
              <dt>{t('global.statCountries')}</dt>
            </div>
            <div>
              <Layers size={22} strokeWidth={1.75} aria-hidden />
              <dd>{detail?.plans.length ?? 0}</dd>
              <dt>{t('global.statPlans')}</dt>
            </div>
            {cheapest != null && (
              <div>
                <Tag size={22} strokeWidth={1.75} aria-hidden />
                <dd>{formatPrice(cheapest)}</dd>
                <dt>{t('global.fromPrice')}</dt>
              </div>
            )}
          </dl>

        </div>

        {/* Outside the copy column on purpose: on a wide screen the search runs
            under both halves, which is where the design puts it and where a
            wide field belongs. Between copy and art in the DOM so that on a
            phone it comes before the illustration — it is the one thing on
            this page a visitor can act on. */}
        <CoverageCheck
          covered={widest}
          countries={countries}
          plans={detail?.plans ?? []}
          onPick={setPicked}
        />

        {/* One finished illustration, not a scene assembled in the browser.
            Width and height are on the tag so the column reserves its box
            before the file arrives — this hero is the largest paint on the
            page, and without them it lands by pushing the search down. */}
        <div className="gl-hero-art">
          <picture>
            <source srcSet="/global-esim-phone.webp" type="image/webp" />
            <img
              src="/global-esim-phone.png"
              alt=""
              width={1374}
              height={1145}
              fetchPriority="high"
              decoding="async"
            />
          </picture>
        </div>
      </section>

      {/* The plans. The title travels with the control bar rather than sitting
          above it — see the `heading` prop. */}
      {detail && detail.plans.length > 0 ? (
        <GlobalPlanExplorer
          plans={detail.plans}
          onAdd={handleAdd}
          added={added}
          countries={countries}
          pickedCountry={picked}
          heading={
            <h2 id="plans" className="gl-plans-title">
              {t('global.plansTitle')}
            </h2>
          }
          note={<p className="gl-plans-note">{t('global.plansSubtitle')}</p>}
        />
      ) : (
        <>
          <h2 id="plans" className="mt-12 scroll-mt-24 text-xl font-700 sm:text-2xl">
            {t('global.plansTitle')}
          </h2>
          <Card className="mt-6 p-6 text-sm text-slate-soft">{t('global.plansEmpty')}</Card>
        </>
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
