import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check } from 'lucide-react'
import Seo from '../components/Seo'
import type { SeoLang } from '../lib/seo'
import { breadcrumbLd } from '../lib/structured-data'
import { api } from '../lib/api'
import { boot } from '../lib/boot'
import type { Country, Plan, Region, RegionDetail } from '../lib/types'
import Flag from '../components/Flag'
import GlobalPlanExplorer from '../components/global/GlobalPlanExplorer'
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

  // Seeded from what the build baked into this page: the worldwide grid used to
  // be empty for anyone whose request was lost, on a route where requests are
  // lost in bursts. The fetch below still runs and replaces it.
  const [detail, setDetail] = useState<RegionDetail | null>(() => boot<RegionDetail>('global'))
  const [regions, setRegions] = useState<Region[]>([])
  const [countries, setCountries] = useState<Country[]>([])
  const [added, setAdded] = useState<number | null>(null)

  useEffect(() => {
    // Independent requests: the worldwide plans are the page, and losing the
    // region list should cost a section rather than the whole thing.
    api
      .get<RegionDetail>('/regions/global')
      .then((r) => setDetail(r.data))
      // A lost request must not wipe what the page already shows — only a real
      // empty answer should.
      .catch(() => setDetail((current) => current ?? boot<RegionDetail>('global')))
    api
      .get<Region[]>('/regions')
      .then((r) => setRegions(r.data))
      // Same rule as the plans above: keep what is on screen. Losing this list
      // used to remove the "other regions" strip entirely.
      .catch(() => {
        // Nothing: keep the strip that is already on screen.
      })
    // Our own country names, in the visitor's language. The browser's
    // Intl.DisplayNames knows Turkey as "Türkiye" and has no Uzbek data at all,
    // so a customer typing "Turkiya" was told no such country exists — on the
    // page whose whole job is answering "is my stop included?".
    api
      .get<Country[]>('/countries?limit=400')
      .then((r) => setCountries(r.data))
      // Without these names the coverage search falls back to Intl, which has
      // no Uzbek data — so an empty list here is worse than a stale one.
      .catch(() => {
        // Nothing: a stale name list beats no names at all.
      })
  }, [i18n.language])

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

  // Twenty-four of them, popular destinations first — the ones a customer here
  // recognises — then whatever else is covered, alphabetically by our own name.
  const heroFlags = useMemo(() => {
    const known = new Map(countries.map((c) => [c.iso2.toUpperCase(), c]))
    const rows = widest
      .map((iso2) => ({ iso2, country: known.get(iso2) }))
      .filter((row) => row.country)
      .map((row) => ({ iso2: row.iso2, name: row.country!.name, popular: row.country!.is_popular }))
    rows.sort((a, b) => Number(b.popular) - Number(a.popular) || a.name.localeCompare(b.name))
    return rows.slice(0, 24)
  }, [widest, countries])

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
          What was here: a green ball drawn in CSS with five flag pills floating
          around it. The owner's word for it was "aldov" — a prop. It said
          nothing true: the ball was not a map, the five countries were picked
          because they fit the layout, and the "+200" was decoration.
          
          What replaces it is the same claim made with evidence. The flags are
          the actual coverage list of the widest plan we sell, read from the
          API, and the count beside them is that list's real length. If a
          supplier drops thirty countries tomorrow, this strip shrinks —
          which is exactly the property a prop does not have. */}
      <section className="grid gap-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-12">
        <div>
          {widest.length > 0 && (
            <p className="text-xs font-700 uppercase tracking-[0.16em] text-brand-600 dark:text-accent-400">
              {t('global.eyebrow', { count: widest.length })}
            </p>
          )}
          <h1 className="mt-3 font-display text-3xl font-700 leading-[1.06] text-ink sm:text-[2.75rem]">
            {t('global.title')}
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-slate-soft">
            {t('global.lead')}
          </p>

          {/* Numbers, not adjectives — and every one of them computed from what
              is actually on sale a line above. */}
          <dl className="mt-7 flex flex-wrap items-end gap-x-8 gap-y-4 border-t border-line pt-5">
            <div>
              <dt className="text-xs text-slate-soft">{t('global.statCountries')}</dt>
              <dd className="font-display text-2xl font-700 tabular-nums text-ink">{widest.length || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-soft">{t('global.statPlans')}</dt>
              <dd className="font-display text-2xl font-700 tabular-nums text-ink">
                {detail?.plans.length ?? 0}
              </dd>
            </div>
            {cheapest != null && (
              <div>
                <dt className="text-xs text-slate-soft">{t('global.fromPrice')}</dt>
                <dd className="font-display text-2xl font-700 tabular-nums text-ink">
                  {formatPrice(cheapest)}
                </dd>
              </div>
            )}
          </dl>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href="#plans" className="btn btn-primary">
              {t('global.cta')}
              <ArrowRight size={17} aria-hidden />
            </a>
            <Link
              to="/guide/install-esim"
              className="focus-ring rounded-lg px-3 py-2 text-sm font-600 text-slate-soft hover:text-ink"
            >
              {t('global.howItWorks')}
            </Link>
          </div>
        </div>

        {/* The coverage itself. Real flags, real order, real remainder. */}
        <div className="rounded-2xl bg-surface p-5 ring-1 ring-line sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-sm font-700 text-ink">{t('global.coverageStripTitle')}</p>
            <p className="text-xs tabular-nums text-slate-soft">
              {t('global.coverageCount', { count: widest.length })}
            </p>
          </div>
          <ul className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-5 xl:grid-cols-6">
            {heroFlags.map(({ iso2, name }) => (
              <li
                key={iso2}
                title={name}
                className="flex flex-col items-center gap-1.5 rounded-lg bg-mist px-1.5 py-2"
              >
                <Flag iso2={iso2} className="h-4 w-6 rounded-[2px]" />
                <span className="line-clamp-2 w-full text-center text-[10px] leading-tight text-slate-soft">
                  {name}
                </span>
              </li>
            ))}
          </ul>
          {widest.length > heroFlags.length && (
            <p className="mt-3 text-xs text-slate-soft">
              {t('global.coverageMore', { count: widest.length - heroFlags.length })}
            </p>
          )}
        </div>
      </section>

      {/* The plans */}
      <h2 id="plans" className="mt-12 scroll-mt-24 text-xl font-700 sm:text-2xl">
        {t('global.plansTitle')}
      </h2>
      <p className="mt-1.5 text-sm text-slate-soft">{t('global.plansSubtitle')}</p>

      {detail && detail.plans.length > 0 ? (
        <GlobalPlanExplorer plans={detail.plans} onAdd={handleAdd} added={added} countries={countries} />
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
