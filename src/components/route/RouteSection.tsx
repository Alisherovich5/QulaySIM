// Beside the components it dresses rather than in design/, which pages are not
// allowed to reach into, and imported here rather than from main.tsx so the
// stylesheet rides with this lazy chunk instead of being downloaded by every
// visitor who only ever sees the home page.
import './route-page.css'
import { useCallback, useMemo, useState } from 'react'
import i18next from 'i18next'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Seo from '../Seo'
import DestinationSelector from './DestinationSelector'
import CountryPicker from './CountryPicker'
import RoutePlans from './RoutePlans'
import OrderSummary from './OrderSummary'
import { useCart } from '../../context/CartContext'
import { api } from '../../lib/api'
import { boot } from '../../lib/boot'
import { useCatalogue } from '../../lib/useCatalogue'
import { addStop, normaliseIso, pickThree, plansCovering, removeStop } from '../../lib/route-plan'
import { breadcrumbLd } from '../../lib/structured-data'
import type { SeoLang } from '../../lib/seo'
import type { Country, RegionDetail } from '../../lib/types'
import { ROUTE_PAGE_COPY } from '../../i18n/locales/route-page'

/* Registered here rather than in i18n/index.ts, and that is a size decision
   with a number behind it: forty-eight keys in three languages is 1.9 kB of
   the landing bundle, which has 150 kB to spend and was at 147.75. This route
   is lazy, so the copy now arrives with the chunk that uses it — and nobody
   who never opens this page pays for its Russian. Module scope, so it is in
   place before the component below renders a single key. */
for (const [lang, copy] of Object.entries(ROUTE_PAGE_COPY)) {
  i18next.addResourceBundle(lang, 'translation', copy, true, true)
}

/**
 * One eSIM for a trip with several stops — the whole of /marshrut, and the same
 * block again in the middle of the landing page.
 *
 * It is a component rather than a page because the owner asked for the planner
 * to appear on the home page too, where it replaced a static teaser for the
 * worldwide bundles. One implementation, mounted twice: the page passes
 * `as="h1"` and `seo`, the landing section takes the defaults and leaves both
 * to the page it sits in.
 *
 * The catalogue has held worldwide bundles all along — twenty of them, each
 * covering upwards of a hundred countries — and somebody travelling Turkey →
 * Italy → France still bought three separate eSIMs, because nothing on the way
 * in asked them where they were going. This page asks that first and answers
 * with tariffs that actually cover the answer.
 *
 * Coverage is a filter and never a ranking; the rule and its tests live in
 * lib/route-plan.ts, next to the reason.
 */

/** The itinerary the design is drawn with, used when the catalogue has them. */
const DEFAULT_STOPS = ['TR', 'IT', 'FR']

const NO_COUNTRIES: Country[] = []

/**
 * Daily bundles are a different product and they crowd out the trip ones.
 *
 * "Vietnam 2GB/Day" is the cheapest thing in the catalogue at every data size,
 * so a plain cheapest-first pick filled all three cards with one-day passes
 * beside a thirty-one-day one — a ladder nobody can climb. Three days is the
 * shortest trip this page is for.
 */
const MIN_TRIP_DAYS = 3

export default function RouteSection({ as = 'h2', seo = false }: { as?: 'h1' | 'h2'; seo?: boolean }) {
  const Heading = as
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { add } = useCart()
  const lang = (i18n.resolvedLanguage ?? 'uz') as SeoLang

  const [stops, setStops] = useState<readonly string[]>(DEFAULT_STOPS)
  const [picking, setPicking] = useState(false)
  const [summary, setSummary] = useState<number | null>(null)

  const countriesQuery = useCatalogue<Country[]>({
    seed: () => boot<Country[]>('countries'),
    load: () => api.get<Country[]>('/countries?limit=400').then((r) => r.data),
    deps: [i18n.language],
  })

  /* The worldwide region carries the multi-country plans and, on each of them,
     the ISO-2 list this whole page turns on. */
  const plansQuery = useCatalogue<RegionDetail>({
    seed: () => boot<RegionDetail>('region:global'),
    load: () => api.get<RegionDetail>('/regions/global').then((r) => r.data),
    deps: [i18n.language],
  })

  const countries = countriesQuery.data ?? NO_COUNTRIES
  const catalogue = useMemo(() => plansQuery.data?.plans ?? [], [plansQuery.data])

  /* ISO-2 codes are the state; the country objects are looked up for display.
     Storing the objects instead would freeze a country's name in whatever
     language it was added in, and this site switches language mid-page. */
  const byIso = useMemo(() => {
    const map = new Map<string, Country>()
    for (const country of countries) map.set(normaliseIso(country.iso2), country)
    return map
  }, [countries])

  const chosen = useMemo(
    () =>
      stops
        .map((iso) => byIso.get(iso) ?? ({ iso2: iso, name: iso, id: -1 } as unknown as Country))
        .filter(Boolean),
    [stops, byIso],
  )

  const covering = useMemo(
    () => plansCovering(catalogue, stops).filter((plan) => plan.validity_days >= MIN_TRIP_DAYS),
    [catalogue, stops],
  )
  const plans = useMemo(() => pickThree(covering), [covering])

  /* "Covered" is about the itinerary, not about the three cards: with nothing
     chosen there is nothing to cover, and the badge says so instead. */
  const covered = stops.length > 0 && covering.length > 0

  const onAdd = useCallback((country: Country) => {
    setStops((prev) => addStop(prev, country.iso2))
    setPicking(false)
  }, [])

  const onRemove = useCallback((iso2: string) => {
    setStops((prev) => removeStop(prev, iso2))
  }, [])

  const chosenPlan = plans.find((plan) => plan.id === summary) ?? null

  const confirm = useCallback(() => {
    if (!chosenPlan) return
    /* The cart line carries one country, so it carries the first stop — the
       plan itself is a worldwide bundle and the checkout shows its own title.
       Inventing a fake "3 countries" pseudo-country here would put a name in
       the order that no country page could ever resolve. */
    const first = chosen[0]
    add(chosenPlan, first?.name ?? '', first?.iso2 ?? '')
    setSummary(null)
    navigate('/checkout')
  }, [add, chosen, chosenPlan, navigate])

  const word = stops.length >= 1 && stops.length <= 9 ? t(`rp.num${stops.length}`) : String(stops.length)

  return (
    <div className="rp">
      {seo && (
        <Seo
          title={t('rp.seoTitle')}
          description={t('rp.seoDesc')}
          jsonLd={[breadcrumbLd([{ name: t('rp.seoTitle'), path: '/marshrut' }], lang)]}
        />
      )}

      <div className="rp-wrap">
        <header className="rp-hero">
          <Heading className="rp-title">
            {stops.length === 0 ? (
              t('rp.titleEmpty')
            ) : (
              <>
                {t('rp.titleStops', { word })}{' '}
                <span className="rp-title-b">{t('rp.titleOne')}</span>
              </>
            )}
          </Heading>
          <p className="rp-sub">{t('rp.sub')}</p>
        </header>

        <DestinationSelector
          stops={chosen}
          covered={covered}
          onRemove={onRemove}
          onAdd={() => setPicking(true)}
        />

        <RoutePlans
          plans={plans}
          loading={plansQuery.loading && catalogue.length === 0}
          onChoose={(plan) => setSummary(plan.id)}
        />

      </div>

      {picking && (
        <CountryPicker
          countries={countries}
          chosen={stops}
          onAdd={onAdd}
          onClose={() => setPicking(false)}
        />
      )}

      {chosenPlan && (
        <OrderSummary
          plan={chosenPlan}
          stops={chosen}
          onConfirm={confirm}
          onClose={() => setSummary(null)}
        />
      )}
    </div>
  )
}
