import { useEffect, useMemo, useRef, useState } from 'react'
import { boot } from '../lib/boot'
import { useCatalogue } from '../lib/useCatalogue'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowUpRight, Check, ChevronDown, Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '../context/CurrencyContext'
import Seo from '../components/Seo'
import type { SeoLang } from '../lib/seo'
import { breadcrumbLd, destinationListLd } from '../lib/structured-data'
import { api } from '../lib/api'
import type { Country, Region } from '../lib/types'
import CountryCard from '../components/CountryCard'
import Reveal from '../components/Reveal'
import { Card } from '../components/ui'
/* A stable identity for "nothing yet".
 *
 * `?? []` builds a new array on every render, which quietly defeats every
 * useMemo downstream — the filters and sorts below re-run on each keystroke
 * elsewhere in the page. One frozen constant costs nothing and keeps them memoised. */
const NO_COUNTRIES: Country[] = []
const NO_REGIONS: Region[] = []


export default function Destinations() {
  const [params, setParams] = useSearchParams()
  const [regionOpen, setRegionOpen] = useState(false)
  const barRef = useRef<HTMLDivElement>(null)

  // A click anywhere else closes the region menu — otherwise it stays open over
  // the grid while the visitor scrolls, which reads as a stuck page.
  useEffect(() => {
    if (!regionOpen) return
    const close = (event: MouseEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setRegionOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [regionOpen])

  const chipClass =
    'focus-ring inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 text-xs font-600 text-ink ring-1 ring-line hover:ring-brand-300'
  const { t, i18n } = useTranslation()
  const search = params.get('search') || ''
  const region = params.get('region') || ''

  // The build knows this list, so the first render shows it; the request below
  // replaces it, because the live catalogue is larger than the build's snapshot.
  // Both fetches previously had no `.catch` at all — a dropped request became an
  // unhandled rejection that our own error reporter then posted. useCatalogue
  // owns the whole rule; see lib/catalogue.ts.
  const { data: fetchedCountries, loading } = useCatalogue<Country[]>({
    seed: () => boot<Country[]>('countries'),
    load: () =>
      api
        .get<Country[]>('/countries', {
          params: { search: search || undefined, region: region || undefined },
        })
        .then((r) => r.data),
    deps: [search, region, i18n.language],
  })
  const countries = fetchedCountries ?? NO_COUNTRIES

  const { data: fetchedRegions } = useCatalogue<Region[]>({
    seed: () => null,
    load: () => api.get<Region[]>('/regions').then((r) => r.data),
    deps: [i18n.language],
  })
  const regions = fetchedRegions ?? NO_REGIONS

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  const { formatPrice } = useCurrency()

  // Only regions that actually sell a multi-country plan. A card without a
  // price would promise a product we do not have.
  //
  // The count is deliberately not part of the test. Countries are mapped to
  // Europe, Asia and so on, so the worldwide region legitimately has none — and
  // requiring one hid the global plan, which is the product the whole section
  // exists to sell.
  const regionCards = useMemo(
    () => regions.filter((r) => r.starting_price != null),
    [regions],
  )

  const heading = useMemo(() => {
    if (search) return t('destinations.resultsFor', { query: search })
    if (region) return regions.find((r) => r.slug === region)?.name || t('destinations.title')
    return t('destinations.allDestinations')
  }, [search, region, regions, t])

  const seoLang = (i18n.resolvedLanguage ?? 'uz') as SeoLang
  const listLd = destinationListLd(countries, seoLang)

  return (
    <div className="container-page py-8 sm:py-12">
      <Seo
        title={t('seo.destinationsTitle')}
        description={t('seo.destinationsDescription')}
        jsonLd={[
          // Built from what the page is actually showing, so a filtered view
          // never advertises destinations it is not listing.
          ...(listLd ? [listLd] : []),
          breadcrumbLd([{ name: t('nav.destinations'), path: '/destinations' }], seoLang),
        ]}
      />
      <h1 className="text-2xl font-700 sm:text-3xl">{t('destinations.title')}</h1>
      <p className="mt-2 leading-6 text-slate-soft">{t('destinations.subtitle')}</p>

      {/* One bar, and it follows the page down.
          Before: a full-width search box, then a second row of region pills
          under a "Mintaqa" label — two blocks and four lines of chrome above a
          grid the visitor came to read, and both scrolled away the moment they
          started reading. Now the search and the region live on one line, the
          regions open on demand instead of sitting there permanently, and the
          bar stays reachable at the top of the screen. The header publishes its
          own height, so the offset survives the promo banner being dismissed. */}
      <div
        ref={barRef}
        className="sticky top-[var(--header-h,104px)] z-40 -mx-4 mt-6 border-y border-line bg-canvas/95 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-xl sm:border sm:px-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-soft" />
            <input
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
              placeholder={t('destinations.searchPlaceholder')}
              aria-label={t('destinations.searchPlaceholder')}
              className="focus-ring w-full rounded-lg bg-mist py-2 pl-9 pr-9 text-sm text-ink ring-1 ring-line placeholder:text-slate-soft [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button
                type="button"
                onClick={() => updateParam('search', '')}
                aria-label={t('destinations.all')}
                className="focus-ring absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-soft hover:bg-surface hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setRegionOpen((open) => !open)}
              aria-expanded={regionOpen}
              className={`focus-ring inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-600 ring-1 transition ${
                region
                  ? 'bg-brand-600 text-white ring-brand-600'
                  : regionOpen
                    ? 'bg-mist text-ink ring-line'
                    : 'bg-surface text-slate-soft ring-line hover:text-ink'
              }`}
            >
              {region ? regions.find((r) => r.slug === region)?.name : t('destinations.region')}
              <ChevronDown size={14} aria-hidden />
            </button>
            {regionOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-56 rounded-xl bg-surface p-1.5 shadow-xl ring-1 ring-line">
                <button
                  type="button"
                  onClick={() => {
                    updateParam('region', '')
                    setRegionOpen(false)
                  }}
                  className={`focus-ring flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition ${
                    !region ? 'bg-brand-50 font-600 text-brand-700 dark:bg-brand-800/40 dark:text-accent-400' : 'text-ink hover:bg-mist'
                  }`}
                >
                  {t('destinations.all')}
                  {!region && <Check size={14} aria-hidden />}
                </button>
                {/* Only regions that can actually filter something. The
                    worldwide region holds no countries — it exists for the
                    multi-country plans — so picking it emptied the page
                    completely, which is what "the countries disappeared" turns
                    out to mean. It is offered below as what it really is: a
                    different page. */}
                {regions
                  .filter((r) => r.country_count > 0)
                  .map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      updateParam('region', r.slug)
                      setRegionOpen(false)
                    }}
                    className={`focus-ring flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition ${
                      region === r.slug
                        ? 'bg-brand-50 font-600 text-brand-700 dark:bg-brand-800/40 dark:text-accent-400'
                        : 'text-ink hover:bg-mist'
                    }`}
                  >
                    <span className="truncate">{r.name}</span>
                    {/* The number of destinations behind the label: the answer
                        before the click rather than after it. */}
                    {r.country_count > 0 && (
                      <span className="shrink-0 text-xs tabular-nums text-slate-soft">{r.country_count}</span>
                    )}
                    {region === r.slug && <Check size={14} aria-hidden />}
                  </button>
                  ))}
                <Link
                  to="/global"
                  onClick={() => setRegionOpen(false)}
                  className="focus-ring mt-1 flex w-full items-center justify-between gap-3 rounded-lg border-t border-line px-3 py-2 text-sm font-600 text-brand-600 hover:bg-mist dark:text-accent-400"
                >
                  {t('destinations.worldwide')}
                  <ArrowUpRight size={14} aria-hidden />
                </Link>
              </div>
            )}
          </div>
        </div>

        {(search || region) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {search && (
              <button type="button" onClick={() => updateParam('search', '')} className={chipClass}>
                “{search}”
                <X size={12} aria-hidden />
              </button>
            )}
            {region && (
              <button type="button" onClick={() => updateParam('region', '')} className={chipClass}>
                {regions.find((r) => r.slug === region)?.name}
                <X size={12} aria-hidden />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                updateParam('search', '')
                updateParam('region', '')
              }}
              className="focus-ring rounded-lg px-2 py-1 text-xs font-600 text-brand-600 hover:underline dark:text-accent-400"
            >
              {t('global.filterReset')}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <p className="mt-12 text-slate-soft">{t('destinations.loading')}</p>
      ) : (
        <>
          <h2 className="mt-10 text-lg font-700">{heading}</h2>
          {countries.length === 0 ? (
            <Card className="mt-5 p-10 text-center text-slate-soft">
              {/* A region with no destinations is not "no match" — it is the
                  worldwide region, which holds plans rather than countries.
                  Reachable by a shared or bookmarked link even now that the
                  filter no longer offers it, and a bare "nothing found" would
                  read as a broken catalogue. */}
              {regions.some((r) => r.slug === region && r.country_count === 0) ? (
                <>
                  <p>{t('destinations.worldwideNotAList')}</p>
                  <Link
                    to="/global"
                    className="focus-ring mt-3 inline-block font-600 text-brand-600 hover:underline dark:text-accent-400"
                  >
                    {t('destinations.worldwide')}
                  </Link>
                </>
              ) : (
                t('destinations.noMatch')
              )}
            </Card>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {countries.map((c, i) => (
                <Reveal key={c.id} delay={i * 40}>
                  <CountryCard country={c} />
                </Reveal>
              ))}
            </div>
          )}

          {/* One eSIM for a whole trip, presented as a product rather than as a
              list of links. These were text chips under an SEO heading at the
              bottom of the page, so the regional plans — which already exist,
              are priced, and cover up to 55 countries each — were invisible: a
              customer going to three countries bought three separate eSIMs
              because nothing told them they did not have to.

              Still real addresses, unlike the filter chips higher up: a chip
              rewrites this page's query string, which neither a crawler nor a
              shared link can hold onto.

              Only regions that actually sell a multi-country plan appear. One
              without a price would be a card promising something we cannot
              deliver, which is worse than a shorter list. */}
          {regionCards.length > 0 && (
            <section className="mt-12">
              <h2 className="text-base font-700 sm:text-lg">{t('destinations.regionsTitle')}</h2>
              <p className="mt-1 text-sm text-slate-soft">{t('destinations.regionsSubtitle')}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                        {/* No count for the worldwide plan: its coverage comes
                            from the wholesaler, not from our region mapping, and
                            inventing "200+ countries" would be a number nobody
                            has checked. */}
                        {r.country_count > 0
                          ? t('destinations.regionCountries', { count: r.country_count })
                          : t('destinations.regionWorldwide')}
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
            </section>
          )}
        </>
      )}
    </div>
  )
}
