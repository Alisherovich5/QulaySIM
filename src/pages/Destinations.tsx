import { useEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useCurrency } from '../context/CurrencyContext'
import { useDesignCopy } from '../lib/design-copy'
import Seo from '../components/Seo'
import Flag from '../components/Flag'
import WorldPicker from '../components/destinations/WorldPicker'
import { api } from '../lib/api'
import { boot } from '../lib/boot'
import { useCatalogue } from '../lib/useCatalogue'
import { breadcrumbLd, destinationListLd } from '../lib/structured-data'
import type { SeoLang } from '../lib/seo'
import type { Country, Region } from '../lib/types'

/**
 * The destination catalogue, as a directory rather than a gallery.
 *
 * 207 countries is a reference list, and the two people who open it want
 * opposite things. Most already know where they are going and need to find one
 * name in seconds; the rest are deciding and want the popular routes, a
 * regional bundle, or the global plan. The page answers them in that order:
 * search first, then what people actually buy, then the alphabet.
 *
 * The previous version put a decorative photograph where the search should be,
 * hid the region choice inside a <select> in a sidebar, and rendered every
 * country as an identical 108px card — so finding Qatar meant reading past two
 * hundred boxes that differed only in a grey price, after pressing "show all".
 */

/** Warm the country page on hover: the visitor almost always clicks through. */
const warmed = new Set<string>()
function prefetch(slug: string) {
  if (warmed.has(slug)) return
  warmed.add(slug)
  void api.get('/countries/' + slug).catch(() => warmed.delete(slug))
}

function fold(value: string) {
  return value.toLocaleLowerCase()
}

export default function Destinations() {
  const [params, setParams] = useSearchParams()
  const c = useDesignCopy()
  const { t, i18n } = useTranslation()
  const { formatPrice } = useCurrency()
  const regionsRef = useRef<HTMLElement>(null)

  const search = params.get('search') || ''
  const region = params.get('region') || ''
  const lang = (i18n.resolvedLanguage ?? 'uz') as SeoLang

  const { data, loading } = useCatalogue<Country[]>({
    seed: () => boot<Country[]>('countries'),
    load: () => api.get<Country[]>('/countries').then((r) => r.data),
    deps: [i18n.language],
  })
  const { data: regions } = useCatalogue<Region[]>({
    seed: () => null,
    load: () => api.get<Region[]>('/regions').then((r) => r.data),
    deps: [i18n.language],
  })

  const all = useMemo(() => data ?? [], [data])
  const filtering = Boolean(search || region)

  const countries = useMemo(() => {
    const q = fold(search)
    return all.filter(
      (country) =>
        (!region || country.region?.slug === region) &&
        (!q || fold(country.name).includes(q) || fold(country.slug).includes(q) || fold(country.iso2) === q),
    )
  }, [all, region, search])

  /* Grouped by first letter. A directory of this length is unusable as one
     run of two hundred lines: the letter is what people navigate by. */
  const groups = useMemo(() => {
    const map = new Map<string, Country[]>()
    for (const country of [...countries].sort((a, b) => a.name.localeCompare(b.name, lang))) {
      const letter = country.name.charAt(0).toLocaleUpperCase(lang)
      const bucket = map.get(letter)
      if (bucket) bucket.push(country)
      else map.set(letter, [country])
    }
    return [...map.entries()]
  }, [countries, lang])

  /* Letters earn their space at two hundred names and cost it at twelve:
     filtering to the Middle East produced eight headings for eight rows.
     Below the threshold the list is simply alphabetical. */
  const grouped = countries.length > 40

  const popular = useMemo(() => all.filter((country) => country.is_popular).slice(0, 9), [all])
  const sellableRegions = useMemo(
    () => (regions ?? []).filter((item) => item.slug !== 'global' && item.country_count > 0),
    [regions],
  )

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }

  /* `?scope=regions` used to switch a tab that no longer exists. The regional
     plans are a section on this page now, so the old link still lands on them
     instead of on nothing. */
  useEffect(() => {
    if (params.get('scope') !== 'regions') return
    regionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [params])

  const list = destinationListLd(countries, lang)

  return (
    <div className="qs-page dst container-page">
      <Seo
        title={t('seo.destinationsTitle')}
        description={t('seo.destinationsDescription')}
        jsonLd={[
          ...(list ? [list] : []),
          breadcrumbLd([{ name: t('nav.destinations'), path: '/destinations' }], lang),
        ]}
      />

      {/* 1 — the question, the control that answers it, and the map.
       *
       * The search, the promoted list and the map are one panel now rather than
       * three stacked blocks: they are all answering "where", and stacked they
       * put the map — the part that shows a visitor somewhere they had not
       * thought of — below the fold on every laptop. */}
      <header className="dst-head">
        <h1 className="dst-pick-title">
          {(() => {
            const word = t('destinations.pickWord')
            const [before, after] = t('destinations.pickTitle', { word: '\u0000' }).split('\u0000')
            return (
              <>
                {before}
                <span>{word}</span>
                {after}
              </>
            )
          })()}
        </h1>
      </header>

      <WorldPicker
        countries={all}
        regions={sellableRegions}
        popular={popular}
        search={search}
        onSearch={(value) => update('search', value)}
      />

      {/* 3 — a regional eSIM is a product, not a filter, so it gets its own block */}
      {!filtering && sellableRegions.length ? (
        <section className="dst-block" id="mintaqalar" ref={regionsRef}>
          <div className="dst-block__head">
            <h2>{t('destinations.regionsTitle')}</h2>
            <p>{t('destinations.regionsSubtitle')}</p>
          </div>
          <ul className="dst-regions">
            {sellableRegions.map((item) => (
              <li key={item.id}>
                <Link to={'/destinations/region/' + item.slug}>
                  {/* The count is repeated as an attribute so the tablet layout
                      can show it under the name without duplicating it for a
                      screen reader — the visible column is hidden there. */}
                  <span
                    className="dst-regions__name"
                    data-count={t('destinations.regionCountries', { count: item.country_count })}
                  >
                    {item.name}
                  </span>
                  <span className="dst-regions__count">
                    {t('destinations.regionCountries', { count: item.country_count })}
                  </span>
                  <span className="dst-regions__price">
                    {item.starting_price != null ? (
                      <>
                        <span>{t('common.from')}</span> {formatPrice(item.starting_price)}
                      </>
                    ) : null}
                  </span>
                  <ArrowRight size={17} aria-hidden />
                </Link>
              </li>
            ))}
            {/* The worldwide plan is not a region, and its sentence does not
                fit the three-column rhythm — it gets its own row shape. */}
            <li className="dst-regions__global">
              <Link to="/global">
                <span>
                  <span className="dst-regions__name">{t('destinations.worldwide')}</span>
                  <span className="dst-regions__note">{t('destinations.worldwideNotAList')}</span>
                </span>
                <ArrowRight size={17} aria-hidden />
              </Link>
            </li>
          </ul>
        </section>
      ) : null}

      {/* 4 — the directory itself */}
      <section className="dst-block dst-index" id="hammasi">
        {/* "All destinations" over two search results is a lie; the count
            line under the search box already names what is on screen. */}
        {!filtering ? (
          <div className="dst-block__head">
            <h2>{t('destinations.allDestinations')}</h2>
          </div>
        ) : null}

        {/* The region names appear twice on this page — as a filter here and
            as a purchasable regional eSIM above. One visible word says which
            is which; without it the repetition is the confusion the old
            sidebar had, only spread further apart. */}
        <div className="dst-filter">
          <span className="dst-filter__label" id="dst-region-label">
            {t('destinations.region')}
          </span>
          <div className="dst-chips" role="group" aria-labelledby="dst-region-label">
          <button type="button" aria-pressed={!region} onClick={() => update('region', '')}>
            {t('destinations.all')}
          </button>
          {(regions ?? [])
            .filter((item) => item.slug !== 'global')
            .map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={region === item.slug}
                onClick={() => update('region', region === item.slug ? '' : item.slug)}
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>

        {grouped ? (
          <nav className="dst-alpha" aria-label={t('destinations.alphabet')}>
            {groups.map(([letter]) => (
              <a key={letter} href={`#harf-${letter}`}>
                {letter}
              </a>
            ))}
          </nav>
        ) : null}

        {loading && !all.length ? (
          <ul className="dst-rows" aria-busy="true">
            {Array.from({ length: 9 }, (_, i) => (
              <li key={i} className="dst-row dst-row--ghost" />
            ))}
          </ul>
        ) : null}

        {grouped ? (
          groups.map(([letter, items]) => (
            <div className="dst-letter" id={`harf-${letter}`} key={letter}>
              <h3>{letter}</h3>
              <ul className="dst-rows">
                {items.map((country) => (
                  <CountryRow key={country.id} country={country} price={formatPrice(country.starting_price)} />
                ))}
              </ul>
            </div>
          ))
        ) : (
          <ul className="dst-rows">
            {groups.flatMap(([, items]) => items).map((country) => (
              <CountryRow key={country.id} country={country} price={formatPrice(country.starting_price)} />
            ))}
          </ul>
        )}

        {!loading && !countries.length ? (
          <div className="empty-destinations">
            <h2>{c.empty}</h2>
            <p className="mt-3 text-slate-soft">{t('destinations.noMatch')}</p>
            <div className="dst-empty__actions">
              <button type="button" className="text-link" onClick={() => setParams({})}>
                {c.clear}
                <ArrowRight size={18} aria-hidden />
              </button>
              {/* A country we do not sell on its own is often inside the global
                  plan, so the dead end offers the way that still works. */}
              <Link className="text-link" to="/global">
                {t('destinations.worldwide')}
                <ArrowRight size={18} aria-hidden />
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}

function CountryRow({ country, price }: { country: Country; price: string }) {
  return (
    <li>
      <Link
        className="dst-row"
        to={'/destinations/' + country.slug}
        onMouseEnter={() => prefetch(country.slug)}
        onFocus={() => prefetch(country.slug)}
      >
        <Flag iso2={country.iso2} w={80} />
        <span className="dst-row__name">{country.name}</span>
        <span className="dst-row__price">{price}</span>
      </Link>
    </li>
  )
}
