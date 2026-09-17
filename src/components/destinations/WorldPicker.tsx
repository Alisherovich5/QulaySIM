import './world-picker.css'
import { useMemo, useState } from 'react'
import { ArrowRight, BarChart3, ChevronRight, Globe, Map as MapIcon, Minus, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import Flag from '../Flag'
import { useCurrency } from '../../context/CurrencyContext'
import { numericFor } from '../../lib/isoNumeric'
import { CENTROIDS, LAND_PATH, MAP_HEIGHT, MAP_WIDTH } from '../../data/world-map.generated'
import type { Country, Region } from '../../lib/types'

type Tab = 'countries' | 'regions' | 'global'

/** How far a zoom step moves. Three steps is enough to separate the Gulf
 *  markers, which is the only cluster the catalogue actually produces. */
const ZOOM_STEPS = [1, 1.6, 2.4] as const

/**
 * The destination picker: a list of the places people go, and the same places
 * on a map.
 *
 * The map is not a globe. The globe on the account page is a WebGL scene worth
 * its weight because the customer turns it; this one is a picture that has to
 * answer "where is that" at a glance, and an SVG does it in 56KB of path with
 * no context to lose and nothing to fall back from. The geometry is projected
 * at build time — see scripts/build-world-map.mjs.
 *
 * Selecting is one-way on purpose: the list drives the map. A marker opens the
 * card for its country, and the card is the only thing that navigates, so a
 * mis-tap on a 10px circle never costs a page load.
 */
export default function WorldPicker({
  countries,
  regions,
  popular,
  search,
  onSearch,
}: {
  countries: Country[]
  regions: Region[]
  popular: Country[]
  search: string
  onSearch: (value: string) => void
}) {
  const { t } = useTranslation()
  const { formatPrice } = useCurrency()
  const [tab, setTab] = useState<Tab>('countries')
  /* The design opens with a country already chosen, and it is the right
     default: an empty map with nine pins and no card does not show a first-time
     visitor what a pin is for. */
  const [selected, setSelected] = useState<string | null>(null)
  const firstSlug = popular[0]?.slug ?? null
  const [zoom, setZoom] = useState(0)

  /* The list is what the search filters; the map follows it. Searching is why
     the whole catalogue is here and not just the promoted nine — somebody
     typing "Peru" wants an answer, not the popular list unchanged. */
  const listed = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase()
    const source = needle ? countries : popular
    if (!needle) return source
    return source.filter((c) => c.name.toLocaleLowerCase().includes(needle)).slice(0, 12)
  }, [countries, popular, search])

  const pins = useMemo(
    () =>
      listed
        .map((c) => {
          const numeric = numericFor(c.iso2)
          const point = numeric ? CENTROIDS[numeric] : undefined
          return point ? { country: c, x: point[0], y: point[1] } : null
        })
        .filter((p): p is { country: Country; x: number; y: number } => p !== null),
    [listed],
  )

  const active = pins.find((p) => p.country.slug === (selected ?? firstSlug)) ?? null

  /* The viewBox is the zoom: scaling a transform would scale the stroke widths
     and the markers with it, and a 2px coastline drawn at 2.4x is a 5px one. */
  const scale = ZOOM_STEPS[zoom]
  const vw = MAP_WIDTH / scale
  const vh = MAP_HEIGHT / scale
  const cx = active ? active.x : MAP_WIDTH / 2
  const cy = active ? active.y : MAP_HEIGHT / 2
  const vx = Math.min(Math.max(cx - vw / 2, 0), MAP_WIDTH - vw)
  const vy = Math.min(Math.max(cy - vh / 2, 0), MAP_HEIGHT - vh)

  const tabs: { key: Tab; label: string; icon: typeof Globe }[] = [
    { key: 'countries', label: t('destinations.tabCountries'), icon: Globe },
    { key: 'regions', label: t('destinations.tabRegions'), icon: MapIcon },
    { key: 'global', label: t('destinations.tabGlobal'), icon: BarChart3 },
  ]

  return (
    <section className="wp">
      <div className="wp-controls">
        <div className="wp-search">
          <Search size={20} aria-hidden />
          <label htmlFor="wp-search" className="sr-only">
            {t('destinations.searchCountry')}
          </label>
          <input
            id="wp-search"
            type="search"
            name="country"
            autoComplete="off"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder={t('destinations.searchCountry')}
          />
        </div>

        {/* A radio group, not three buttons: it is one choice with three
            values, and that is what a screen reader should be told. */}
        <div className="wp-tabs" role="tablist" aria-label={t('nav.destinations')}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`wp-tab ${tab === key ? 'is-on' : ''}`}
              onClick={() => setTab(key)}
            >
              <Icon size={19} aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="wp-body">
        <div className="wp-list">
          <h2>{tab === 'regions' ? t('destinations.regionsTitle') : t('home.popularTitle')}</h2>

          {tab === 'regions' ? (
            <ul>
              {regions.map((region) => (
                <li key={region.id}>
                  <Link to={`/destinations/region/${region.slug}`} className="wp-row">
                    <span className="wp-row-mark" aria-hidden>
                      <MapIcon size={18} />
                    </span>
                    <span className="wp-row-name">{region.name}</span>
                    <ChevronRight size={20} aria-hidden className="wp-row-go" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : tab === 'global' ? (
            <ul>
              <li>
                <Link to="/global" className="wp-row">
                  <span className="wp-row-mark" aria-hidden>
                    <Globe size={18} />
                  </span>
                  <span className="wp-row-name">{t('nav.global')}</span>
                  <ChevronRight size={20} aria-hidden className="wp-row-go" />
                </Link>
              </li>
            </ul>
          ) : (
            <ul>
              {listed.map((country) => (
                <li key={country.id}>
                  {/* Selects rather than navigates: the row's job here is to
                      put the place on the map. The card that opens is what
                      goes to its tariffs. */}
                  <button
                    type="button"
                    className={`wp-row ${(selected ?? firstSlug) === country.slug ? 'is-on' : ''}`}
                    onClick={() => setSelected(country.slug)}
                    onMouseEnter={() => setSelected(country.slug)}
                  >
                    <Flag iso2={country.iso2} w={160} className="wp-row-flag" />
                    <span className="wp-row-name">{country.name}</span>
                    <span className="wp-row-price">
                      {t('destinations.fromPrice', { price: formatPrice(country.starting_price) })}
                    </span>
                    <ChevronRight size={20} aria-hidden className="wp-row-go" />
                  </button>
                </li>
              ))}
              {listed.length === 0 && <li className="wp-empty">{t('destinations.noResults')}</li>}
            </ul>
          )}

          {/* The alphabet further down the same page, not another route: the panel is
              a shortlist and the full index is already below it. */}
          <a href="#hammasi" className="wp-all">
            {t('destinations.allCountries')}
            <ArrowRight size={18} aria-hidden />
          </a>
        </div>

        <div className="wp-map">
          <svg
            viewBox={`${vx} ${vy} ${vw} ${vh}`}
            role="img"
            aria-label={t('destinations.mapLabel')}
            /* `meet`, not `slice`: the projection is 2.5:1 and the panel is nearer
               4:3, so slicing crops away Asia and Australia — the half of the
               map with most of the catalogue on it. Fitting leaves a band of
               the panel's own colour above and below, which is what the design
               shows. */
            preserveAspectRatio="xMidYMid meet"
          >
            <path d={LAND_PATH} className="wp-land" />
            {pins.map((pin) => (
              <g key={pin.country.id}>
                <circle
                  cx={pin.x}
                  cy={pin.y}
                  r={active?.country.id === pin.country.id ? 7 / scale : 5 / scale}
                  className={`wp-pin ${active?.country.id === pin.country.id ? 'is-on' : ''}`}
                  onClick={() => setSelected(pin.country.slug)}
                >
                  <title>{pin.country.name}</title>
                </circle>
              </g>
            ))}
          </svg>

          {active && (
            <div className="wp-card">
              <Flag iso2={active.country.iso2} w={160} className="wp-card-flag" />
              <div className="wp-card-text">
                <p className="wp-card-name">{active.country.name}</p>
                <p className="wp-card-price">
                  {t('destinations.fromPrice', { price: formatPrice(active.country.starting_price) })}
                </p>
              </div>
              <Link to={`/destinations/${active.country.slug}`} className="wp-card-cta">
                {t('destinations.seePlans')}
              </Link>
            </div>
          )}

          <div className="wp-zoom">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(z + 1, ZOOM_STEPS.length - 1))}
              aria-label={t('destinations.zoomIn')}
              disabled={zoom === ZOOM_STEPS.length - 1}
            >
              <Plus size={20} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(z - 1, 0))}
              aria-label={t('destinations.zoomOut')}
              disabled={zoom === 0}
            >
              <Minus size={20} aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
