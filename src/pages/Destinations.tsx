import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChevronDown, Globe, Search, SlidersHorizontal, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useCurrency } from '../context/CurrencyContext'
import Seo from '../components/Seo'
import RegionRail from '../components/destinations/RegionRail'
import TicketCard from '../components/destinations/TicketCard'
import { LAND_PATH, MAP_HEIGHT, MAP_WIDTH } from '../data/world-map.generated'
import { api } from '../lib/api'
import { slugsFor } from '../lib/region-filter'
import { boot } from '../lib/boot'
import { useCatalogue } from '../lib/useCatalogue'
import { breadcrumbLd, destinationListLd } from '../lib/structured-data'
import type { SeoLang } from '../lib/seo'
import type { Country } from '../lib/types'

/**
 * The destination catalogue, to the approved design.
 *
 * Two hundred and seven countries, and the two people who open the page want
 * opposite things: one already knows where they are going and needs to find a
 * name in seconds, the other is deciding. The layout answers both at once — a
 * region rail and a search for the first, an alphabet and a wall of tickets for
 * the second — rather than making either of them press a tab first.
 */

/** Warm the country page on hover: the visitor almost always clicks through. */
const warmed = new Set<string>()
function prefetch(slug: string) {
  if (warmed.has(slug)) return
  warmed.add(slug)
  void api.get('/countries/' + slug).catch(() => warmed.delete(slug))
}

/**
 * Case- and apostrophe-insensitive, because Uzbek writes the same word four
 * ways. `Oʻzbekiston`, `O'zbekiston`, `O‘zbekiston` and `O`zbekiston` are one
 * country to a person and four strings to `includes`.
 */
const APOSTROPHES = /[‘’ʻʼ`´']/g
function fold(value: string, lang: string) {
  return value.toLocaleLowerCase(lang).replace(APOSTROPHES, '')
}

type Sort = 'name' | 'cheap' | 'dear'
const SORTS: Sort[] = ['name', 'cheap', 'dear']
const SORT_KEY: Record<Sort, string> = {
  name: 'dx.sortName',
  cheap: 'dx.sortCheap',
  dear: 'dx.sortDear',
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default function Destinations() {
  const [params, setParams] = useSearchParams()
  const { t, i18n } = useTranslation()
  const { formatPrice } = useCurrency()
  const [sheet, setSheet] = useState(false)

  const lang = (i18n.resolvedLanguage ?? 'uz') as SeoLang
  const search = params.get('search') ?? ''
  const region = params.get('region') ?? ''
  const sort = (SORTS.includes(params.get('sort') as Sort) ? params.get('sort') : 'name') as Sort

  /* `useCatalogue` has no reload of its own; bumping a counter it depends on is
     the retry, and it re-runs the same fetch the first render did. */
  const [attempt, setAttempt] = useState(0)
  const { data, loading, missing } = useCatalogue<Country[]>({
    seed: () => boot<Country[]>('countries'),
    load: () => api.get<Country[]>('/countries').then((r) => r.data),
    deps: [i18n.language, attempt],
  })

  const all = useMemo(() => data ?? [], [data])

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params)
      if (value) next.set(key, value)
      else next.delete(key)
      setParams(next, { replace: true })
    },
    [params, setParams],
  )

  /* Region first, then text. The alphabet is built from this set rather than
     from the whole catalogue, so a letter is only ever offered when pressing
     it would land on something. */
  /* Which rail entries have anything behind them. Computed from the catalogue
     rather than declared, so a region cannot be offered into an empty page. */
  const available = useMemo(() => {
    const have = new Set(all.map((c) => c.region?.slug).filter(Boolean) as string[])
    const keys = new Set<string>()
    for (const key of ['europe', 'asia', 'middle-east', 'americas', 'africa', 'oceania'])
      if (slugsFor(key).some((slug) => have.has(slug))) keys.add(key)
    return keys
  }, [all])

  const inRegion = useMemo(() => {
    const slugs = slugsFor(region)
    if (!slugs.length) return all
    return all.filter((c) => c.region && slugs.includes(c.region.slug))
  }, [all, region])

  const matched = useMemo(() => {
    const q = fold(search.trim(), lang)
    if (!q) return inRegion
    return inRegion.filter(
      (c) =>
        fold(c.name, lang).includes(q) ||
        fold(c.slug, lang).includes(q) ||
        c.iso2.toLowerCase() === q,
    )
  }, [inRegion, search, lang])

  const sorted = useMemo(() => {
    const copy = [...matched]
    if (sort === 'name') return copy.sort((a, b) => a.name.localeCompare(b.name, lang))
    const price = (c: Country) => c.starting_price ?? Number.POSITIVE_INFINITY
    return copy.sort((a, b) =>
      sort === 'cheap' ? price(a) - price(b) : (b.starting_price ?? -1) - (a.starting_price ?? -1),
    )
  }, [matched, sort, lang])

  /* Letters only mean anything while the list is alphabetical. Sorted by price
     the headings would cut the order they exist to describe, so the groups
     collapse into one run and the alphabet goes with them. */
  const groups = useMemo(() => {
    if (sort !== 'name') return null
    const map = new Map<string, Country[]>()
    for (const c of sorted) {
      const letter = c.name.charAt(0).toLocaleUpperCase(lang)
      const bucket = map.get(letter)
      if (bucket) bucket.push(c)
      else map.set(letter, [c])
    }
    return [...map.entries()]
  }, [sorted, sort, lang])

  const live = useMemo(() => new Set((groups ?? []).map(([letter]) => letter)), [groups])
  const [active, setActive] = useState<string | null>(null)

  /* The first letter that exists is lit before anybody presses one: the design
     shows A marked, and an alphabet with nothing marked reads as disabled. */
  const marked = active && live.has(active) ? active : (groups?.[0]?.[0] ?? null)

  useEffect(() => setSheet(false), [region])

  const jump = (letter: string) => {
    setActive(letter)
    document.getElementById(`dx-${letter}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const clear = () => setParams(new URLSearchParams(), { replace: true })

  const list = destinationListLd(sorted, lang)

  return (
    <>
      <Seo
        title={t('seo.destinationsTitle')}
        description={t('seo.destinationsDescription')}
        jsonLd={[
          breadcrumbLd([{ name: t('nav.destinations'), path: '/destinations' }], lang),
          ...(list ? [list] : []),
        ]}
      />

      <div className="dx">
        <aside className="dx-side">
          <p className="dx-eyebrow">{t('dx.eyebrow')}</p>
          <h2 className="dx-side-title">{t('dx.sideTitle')}</h2>
          <p className="dx-side-lead">{t('dx.sideLead')}</p>

          <hr />

          <h3 className="dx-regions-title">{t('dx.regionsTitle')}</h3>
          <RegionRail value={region} available={available} onChange={(key) => update('region', key)} />

          {/* Decoration, and only that: a world with one light on it. It is not
              the visitor's position and never reads as one — no label, no
              "you are here", and the dot does not move. */}
          <div className="dx-side-map" aria-hidden>
            <svg viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`} role="presentation">
              <path className="dx-land" d={LAND_PATH} />
              <circle className="dx-dot" cx={MAP_WIDTH * 0.27} cy={MAP_HEIGHT * 0.62} r={4.5} />
            </svg>
          </div>
          <p className="dx-side-caption">
            {t('dx.mapTop')}
            <br />
            {t('dx.mapBottom')}
          </p>
        </aside>

        <div className="dx-rule" aria-hidden />

        <main className="dx-main">
          <div className="dx-head">
            <h1 className="dx-title">{t('dx.title')}</h1>
            <Globe size={56} strokeWidth={1.4} aria-hidden className="dx-title-globe" />
            <p className="dx-head-aside">
              <span>
                {t('dx.asideTop')}
                <br />
                {t('dx.asideBottom')}
              </span>
            </p>
          </div>

          <div className="dx-tools">
            <div className="dx-search">
              <Search size={20} aria-hidden />
              <label htmlFor="dx-search" className="sr-only">
                {t('dx.search')}
              </label>
              <input
                id="dx-search"
                type="search"
                value={search}
                onChange={(e) => update('search', e.target.value)}
                placeholder={t('dx.search')}
                className="focus-ring"
              />
            </div>
            <div className="dx-sort">
              <label htmlFor="dx-sort" className="sr-only">
                {t('dx.sortLabel')}
              </label>
              <select
                id="dx-sort"
                value={sort}
                onChange={(e) => update('sort', e.target.value)}
                className="focus-ring"
              >
                {SORTS.map((key) => (
                  <option key={key} value={key}>
                    {t(SORT_KEY[key])}
                  </option>
                ))}
              </select>
              <ChevronDown size={20} aria-hidden />
            </div>
            {/* Inside the row rather than under it: on a phone the three
                controls share two lines, and a button in its own block below
                them left the sort stranded beside a search box squeezed to a
                hundred pixels. */}
            <button
              type="button"
              className="dx-region-open focus-ring"
              onClick={() => setSheet(true)}
            >
              <SlidersHorizontal size={18} aria-hidden />
              {t('dx.openRegions')}
            </button>
          </div>

          {groups && (
            <div className="dx-alphabet" role="group" aria-label={t('dx.alphabet')}>
              {ALPHABET.map((letter) => (
                <button
                  key={letter}
                  type="button"
                  disabled={!live.has(letter)}
                  onClick={() => jump(letter)}
                  className={`dx-letter focus-ring ${marked === letter ? 'is-on' : ''}`}
                >
                  {letter}
                </button>
              ))}
            </div>
          )}

          {loading && all.length === 0 && (
            <div className="dx-group">
              <div className="dx-grid">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="dx-ticket dx-skeleton" aria-hidden />
                ))}
              </div>
            </div>
          )}

          {missing && all.length === 0 && (
            <div className="dx-empty">
              <p>{t('dx.error')}</p>
              <button type="button" className="focus-ring" onClick={() => setAttempt((n) => n + 1)}>
                {t('dx.retry')}
              </button>
            </div>
          )}

          {!loading && !missing && sorted.length === 0 && (
            <div className="dx-empty">
              <p>{t('dx.empty')}</p>
              <button type="button" className="focus-ring" onClick={clear}>
                {t('dx.clear')}
              </button>
            </div>
          )}

          {groups
            ? groups.map(([letter, items]) => (
                <section key={letter} id={`dx-${letter}`} className="dx-group">
                  <div className="dx-group-head">
                    <h2 className="dx-group-letter">{letter}</h2>
                  </div>
                  <div className="dx-grid">
                    {items.map((country) => (
                      <TicketCard
                        key={country.id}
                        country={country}
                        price={formatPrice(country.starting_price)}
                        onPrefetch={() => prefetch(country.slug)}
                      />
                    ))}
                  </div>
                </section>
              ))
            : sorted.length > 0 && (
                <section className="dx-group">
                  <div className="dx-grid">
                    {sorted.map((country) => (
                      <TicketCard
                        key={country.id}
                        country={country}
                        price={formatPrice(country.starting_price)}
                        onPrefetch={() => prefetch(country.slug)}
                      />
                    ))}
                  </div>
                </section>
              )}
        </main>

      </div>

      {sheet && (
        <>
          <div className="dx-sheet-back" onClick={() => setSheet(false)} aria-hidden />
          <div className="dx-sheet" role="dialog" aria-label={t('dx.regionsTitle')}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="dx-regions-title">{t('dx.regionsTitle')}</h3>
              <button
                type="button"
                onClick={() => setSheet(false)}
                aria-label={t('dx.closeRegions')}
                className="focus-ring grid h-11 w-11 place-items-center rounded-xl"
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <RegionRail value={region} available={available} onChange={(key) => update('region', key)} />
          </div>
        </>
      )}
    </>
  )
}
