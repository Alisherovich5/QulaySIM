import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Globe2, Search, X } from 'lucide-react'
import PlanCard from '../PlanCard'
import Flag from '../Flag'
import { Card } from '../ui'
import type { Country, Plan } from '../../lib/types'

/**
 * The worldwide catalogue, filtered rather than pre-selected.
 *
 * A destination page shows seven tariffs because every country stocks roughly
 * the same shapes and a longer list is a spreadsheet. This page is the opposite
 * case: twenty shapes that differ in ways that matter — 2 to 100 GB, 1 to 180
 * days, 66 to 167 countries — for a customer who already knows roughly what
 * they need.
 *
 * The first version put every control on the page at once: three rows of pills
 * under a heading, taking a third of the screen before a single plan appeared.
 * This one behaves the way a catalogue is expected to behave now — one bar that
 * follows you down the page, menus that open only when asked, more than one
 * choice per menu, and a row of what you have chosen that you can take back one
 * piece at a time.
 *
 * The country search is the important control, and it is not a nicety. The
 * cheapest bundles are cheap because they omit a third of the world: 20 GB for
 * 31 days costs a third of the 30-day one because it covers 106 countries
 * rather than 167. Sold on price alone that row is a trap — the customer finds
 * out on arrival, abroad, where nothing can be fixed. So a plan that does not
 * cover the chosen country is removed rather than quietly ranked lower.
 */

interface Props {
  plans: Plan[]
  onAdd: (plan: Plan) => void
  added: number | null
  /** Our own destinations, for their names in the visitor's language. */
  countries: Country[]
}

type Sort = 'price' | 'data' | 'coverage'

/** Buckets rather than exact durations: 15 and 31 days are the same trip. */
const DURATIONS: { key: string; test: (days: number) => boolean }[] = [
  { key: 'week', test: (d) => d <= 7 },
  { key: 'twoWeeks', test: (d) => d > 7 && d <= 15 },
  { key: 'month', test: (d) => d > 15 && d <= 31 },
  { key: 'longer', test: (d) => d > 31 },
]

/** Lowercased, accent- and apostrophe-free, so "Türkiye" meets "turkiye". */
const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[‘’ʻʼ']/g, '')
    .toLowerCase()
    .trim()

export default function GlobalPlanExplorer({ plans, onAdd, added, countries }: Props) {
  const { t, i18n } = useTranslation()
  const [sizes, setSizes] = useState<Set<number>>(new Set())
  const [durations, setDurations] = useState<Set<string>>(new Set())
  const [country, setCountry] = useState<{ iso2: string; name: string } | null>(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('price')
  const [openMenu, setOpenMenu] = useState<'size' | 'duration' | 'sort' | null>(null)
  const [coverageOf, setCoverageOf] = useState<Plan | null>(null)

  const lang = i18n.language.split('-')[0] || 'uz'
  const barRef = useRef<HTMLDivElement>(null)

  // Any click outside the bar closes whichever menu is open. Without it they
  // stack up and the page ends with three menus hanging open over the plans.
  useEffect(() => {
    if (!openMenu) return
    const close = (event: MouseEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [openMenu])

  const intl = useMemo(() => {
    try {
      return new Intl.DisplayNames([lang, 'en'], { type: 'region' })
    } catch {
      return null
    }
  }, [lang])

  // Our own name first: the API returns it in the visitor's language, and it is
  // the spelling a customer here actually types ("Turkiya", not "Türkiye").
  const ours = useMemo(() => {
    const map: Record<string, string> = {}
    for (const c of countries) if (c.iso2) map[c.iso2.toUpperCase()] = c.name
    return map
  }, [countries])

  const nameFor = (code: string) => {
    if (ours[code]) return ours[code]
    try {
      return intl?.of(code) ?? code
    } catch {
      return code
    }
  }

  const sizeOptions = useMemo(
    () => [...new Set(plans.map((p) => p.data_amount_mb))].sort((a, b) => a - b),
    [plans],
  )

  /** Every country any worldwide plan covers, for the search suggestions. */
  const covered = useMemo(() => {
    const codes = [...new Set(plans.flatMap((p) => p.coverage ?? []))]
    return codes
      .map((iso2) => ({ iso2, name: nameFor(iso2) }))
      .sort((a, b) => a.name.localeCompare(b.name, lang))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans, ours, lang])

  const suggestions = useMemo(() => {
    const needle = fold(query)
    if (needle.length < 2) return []
    const starts = covered.filter((c) => fold(c.name).startsWith(needle) || fold(c.iso2) === needle)
    const contains = covered.filter(
      (c) => !starts.includes(c) && needle.length >= 3 && fold(c.name).includes(needle),
    )
    return [...starts, ...contains].slice(0, 6)
  }, [query, covered])

  const shown = useMemo(() => {
    const list = plans.filter((plan) => {
      if (sizes.size && !sizes.has(plan.data_amount_mb)) return false
      if (durations.size) {
        const bucket = DURATIONS.find((d) => d.test(plan.validity_days))
        if (!bucket || !durations.has(bucket.key)) return false
      }
      if (country && !(plan.coverage ?? []).includes(country.iso2)) return false
      return true
    })
    return list.sort((a, b) => {
      if (sort === 'price') return a.price_usd - b.price_usd
      if (sort === 'coverage') return (b.coverage?.length ?? 0) - (a.coverage?.length ?? 0)
      return a.data_amount_mb - b.data_amount_mb || a.validity_days - b.validity_days
    })
  }, [plans, sizes, durations, country, sort])

  function toggle<T>(set: Set<T>, value: T) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  const dirty = sizes.size > 0 || durations.size > 0 || country != null
  const clearAll = () => {
    setSizes(new Set())
    setDurations(new Set())
    setCountry(null)
    setQuery('')
  }

  const trigger = (active: boolean, open: boolean) =>
    `focus-ring inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-600 ring-1 transition ${
      active
        ? 'bg-brand-600 text-white ring-brand-600'
        : open
          ? 'bg-mist text-ink ring-line'
          : 'bg-surface text-slate-soft ring-line hover:text-ink'
    }`

  const item = (selected: boolean) =>
    `focus-ring flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition ${
      selected
        ? 'bg-brand-50 font-600 text-brand-700 dark:bg-brand-800/40 dark:text-accent-400'
        : 'text-ink hover:bg-mist'
    }`

  const removable =
    'focus-ring inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 text-xs font-600 text-ink ring-1 ring-line hover:ring-brand-300'

  return (
    <>
      {/* The bar follows the page down. With twenty plans in a three-column
          grid the controls are otherwise a scroll away the moment you start
          reading — which is exactly when a filter is wanted. */}
      <div
        ref={barRef}
        className="sticky top-[var(--header-h,104px)] z-40 -mx-4 mt-6 border-y border-line bg-canvas/95 px-4 py-3 backdrop-blur-md sm:mx-0 sm:rounded-xl sm:border sm:px-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Search, with real suggestions. Typing used to be answered with
              silence: a name that matched nothing left the list unchanged, and
              there was no way to tell "not covered" from "spelled differently". */}
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-soft"
            />
            <input
              type="search"
              value={country ? country.name : query}
              onChange={(e) => {
                setCountry(null)
                setQuery(e.target.value)
              }}
              placeholder={t('global.filterCountryPlaceholder')}
              aria-label={t('global.filterCountry')}
              className="focus-ring w-full rounded-lg bg-mist py-2 pl-9 pr-9 text-sm text-ink ring-1 ring-line placeholder:text-slate-soft [&::-webkit-search-cancel-button]:hidden"
            />
            {(query || country) && (
              <button
                type="button"
                onClick={() => {
                  setQuery('')
                  setCountry(null)
                }}
                aria-label={t('global.filterClear')}
                className="focus-ring absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-slate-soft hover:bg-surface hover:text-ink"
              >
                <X size={14} />
              </button>
            )}

            {!country && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 overflow-hidden rounded-xl bg-surface p-1.5 shadow-xl ring-1 ring-line">
                {suggestions.map((s) => (
                  <li key={s.iso2}>
                    <button
                      type="button"
                      onClick={() => {
                        setCountry(s)
                        setQuery('')
                      }}
                      className="focus-ring flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-mist"
                    >
                      <Flag iso2={s.iso2} className="h-3.5 w-5 shrink-0 rounded-[2px]" />
                      <span className="truncate text-ink">{s.name}</span>
                      {/* How many plans include it — the answer to the question
                          being asked, before the click rather than after. */}
                      <span className="ml-auto shrink-0 text-xs tabular-nums text-slate-soft">
                        {plans.filter((p) => (p.coverage ?? []).includes(s.iso2)).length}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {!country && query.trim().length >= 2 && suggestions.length === 0 && (
              <p className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-xl bg-surface px-3 py-2.5 text-xs text-slate-soft shadow-xl ring-1 ring-line">
                {t('global.filterCountryUnknown')}
              </p>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'size' ? null : 'size')}
              className={trigger(sizes.size > 0, openMenu === 'size')}
              aria-expanded={openMenu === 'size'}
            >
              {t('global.filterData')}
              {sizes.size > 0 && <span className="tabular-nums">· {sizes.size}</span>}
              <ChevronDown size={14} aria-hidden />
            </button>
            {openMenu === 'size' && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-44 rounded-xl bg-surface p-1.5 shadow-xl ring-1 ring-line">
                {sizeOptions.map((mb) => (
                  <button
                    key={mb}
                    type="button"
                    onClick={() => setSizes(toggle(sizes, mb))}
                    className={item(sizes.has(mb))}
                  >
                    {Math.round(mb / 1024)} GB
                    {sizes.has(mb) && <Check size={14} aria-hidden />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'duration' ? null : 'duration')}
              className={trigger(durations.size > 0, openMenu === 'duration')}
              aria-expanded={openMenu === 'duration'}
            >
              {t('global.filterDuration')}
              {durations.size > 0 && <span className="tabular-nums">· {durations.size}</span>}
              <ChevronDown size={14} aria-hidden />
            </button>
            {openMenu === 'duration' && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 rounded-xl bg-surface p-1.5 shadow-xl ring-1 ring-line">
                {DURATIONS.map((d) => (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => setDurations(toggle(durations, d.key))}
                    className={item(durations.has(d.key))}
                  >
                    {t(`global.duration.${d.key}`)}
                    {durations.has(d.key) && <Check size={14} aria-hidden />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'sort' ? null : 'sort')}
              className={trigger(false, openMenu === 'sort')}
              aria-expanded={openMenu === 'sort'}
            >
              {t(`global.sort.${sort}`)}
              <ChevronDown size={14} aria-hidden />
            </button>
            {openMenu === 'sort' && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 rounded-xl bg-surface p-1.5 shadow-xl ring-1 ring-line">
                {(['price', 'data', 'coverage'] as Sort[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSort(key)
                      setOpenMenu(null)
                    }}
                    className={item(sort === key)}
                  >
                    {t(`global.sort.${key}`)}
                    {sort === key && <Check size={14} aria-hidden />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* What is applied, and how to take it back. A filter you cannot see is
            a filter you forget you set — and then the catalogue looks empty. */}
        {dirty && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {country && (
              <button
                type="button"
                onClick={() => setCountry(null)}
                className="focus-ring inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-2.5 py-1 text-xs font-600 text-white"
              >
                <Flag iso2={country.iso2} className="h-3 w-4 rounded-[1px]" />
                {country.name}
                <X size={12} aria-hidden />
              </button>
            )}
            {[...sizes]
              .sort((a, b) => a - b)
              .map((mb) => (
                <button key={mb} type="button" onClick={() => setSizes(toggle(sizes, mb))} className={removable}>
                  {Math.round(mb / 1024)} GB
                  <X size={12} aria-hidden />
                </button>
              ))}
            {[...durations].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setDurations(toggle(durations, key))}
                className={removable}
              >
                {t(`global.duration.${key}`)}
                <X size={12} aria-hidden />
              </button>
            ))}
            <button
              type="button"
              onClick={clearAll}
              className="focus-ring rounded-lg px-2 py-1 text-xs font-600 text-brand-600 hover:underline dark:text-accent-400"
            >
              {t('global.filterReset')}
            </button>
            <span className="ml-auto text-xs tabular-nums text-slate-soft">
              {t('global.resultCount', { shown: shown.length, total: plans.length })}
            </span>
          </div>
        )}
      </div>

      {!dirty && (
        <p className="mt-4 text-sm tabular-nums text-slate-soft">
          {t('global.resultCount', { shown: shown.length, total: plans.length })}
        </p>
      )}

      {shown.length > 0 ? (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((plan) => (
            <div key={plan.id} className="flex h-full flex-col">
              <PlanCard plan={plan} onAdd={onAdd} added={added === plan.id} />
              {(plan.coverage?.length ?? 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setCoverageOf(plan)}
                  className="focus-ring mt-1 flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-600 text-slate-soft hover:text-brand-600 dark:hover:text-accent-400"
                >
                  <Globe2 size={13} aria-hidden />
                  {t('global.coverageLink')}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <Card className="mt-4 p-6 text-sm text-slate-soft">{t('global.filterEmpty')}</Card>
      )}

      {/* Which countries, in full. A count is a claim; the list is the evidence,
          and it is what stops a refund request in a foreign airport. */}
      {coverageOf && (
        <div
          className="fixed inset-0 z-[80] grid place-items-center bg-ink/45 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={t('global.coverageTitle')}
          onClick={() => setCoverageOf(null)}
        >
          <div
            className="flex h-[min(80vh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-line"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-3">
              <div>
                <h3 className="text-sm font-700">{coverageOf.title}</h3>
                <p className="text-xs text-slate-soft">
                  {t('global.coverageCount', { count: coverageOf.coverage?.length ?? 0 })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCoverageOf(null)}
                aria-label={t('global.filterClear')}
                className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-soft hover:bg-mist hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
                {[...(coverageOf.coverage ?? [])]
                  .map((code) => ({ code, name: nameFor(code) }))
                  .sort((a, b) => a.name.localeCompare(b.name, lang))
                  .map(({ code, name }) => (
                    <li key={code} className="flex items-center gap-1.5 text-slate-soft">
                      <Flag iso2={code} className="h-3 w-4 shrink-0 rounded-[1px]" />
                      <span className="truncate">{name}</span>
                    </li>
                  ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
