import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Globe2, Search, SlidersHorizontal, X } from 'lucide-react'
import PlanCard from '../PlanCard'
import Reveal from '../Reveal'
import { Card } from '../ui'
import type { Country, Plan } from '../../lib/types'

/**
 * The worldwide catalogue, filtered rather than pre-selected.
 *
 * A destination page shows seven tariffs because every country stocks roughly
 * the same shapes and a longer list is a spreadsheet. This page is the opposite
 * case: twenty shapes that differ in ways that matter — 3 to 100 GB, 1 to 180
 * days, and 66 to 167 countries — for a customer who already knows roughly what
 * they need. Twenty cards in a grid is a wall; twenty cards behind three
 * filters is a catalogue.
 *
 * The country search is the important one, and it is not a nicety. The cheapest
 * worldwide bundles are cheap because they omit a third of the world: 20 GB for
 * 31 days costs a third of the 30-day one because it covers 106 countries
 * rather than 167. Sold on price alone, that row is a trap — the customer finds
 * out on arrival, abroad, where nothing can be fixed. So the search answers
 * "is my stop included?" before any money moves, and a plan that does not cover
 * the typed country is removed rather than quietly ranked lower.
 */

interface Props {
  plans: Plan[]
  onAdd: (plan: Plan) => void
  added: number | null
  /** Our own destinations, for their names in the visitor's language. */
  countries: Country[]
}

type Sort = 'price' | 'data'

/** Buckets rather than exact durations: 15 and 31 days are the same trip. */
const DURATIONS: { key: string; max: number }[] = [
  { key: 'week', max: 7 },
  { key: 'twoWeeks', max: 15 },
  { key: 'month', max: 31 },
  { key: 'longer', max: Number.POSITIVE_INFINITY },
]

export default function GlobalPlanExplorer({ plans, onAdd, added, countries }: Props) {
  const { t, i18n } = useTranslation()
  const [size, setSize] = useState<number | null>(null)
  const [duration, setDuration] = useState<string | null>(null)
  const [country, setCountry] = useState('')
  const [sort, setSort] = useState<Sort>('price')
  const [coverageOf, setCoverageOf] = useState<Plan | null>(null)

  const lang = i18n.language.split('-')[0] || 'uz'

  // Localised country names straight from the browser, so 167 names per plan
  // cost no bytes and no translation work. Falls back to the bare code where a
  // locale has no name for a territory.
  const names = useMemo(() => {
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

  const intlName = (code: string) => {
    try {
      return names?.of(code) ?? code
    } catch {
      return code
    }
  }

  const nameFor = (code: string) => ours[code] ?? intlName(code)

  /** Lowercased, accent- and apostrophe-free, so "Türkiye" meets "turkiye". */
  const fold = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u2018\u2019\u02bb\u02bc']/g, '')
      .toLowerCase()
      .trim()

  const sizes = useMemo(
    () => [...new Set(plans.map((p) => p.data_amount_mb))].sort((a, b) => a - b),
    [plans],
  )

  // A typed country is matched against the name in the current language and
  // against the code, so "Tur", "Turkiya", "Turkey" and "TR" all work.
  const matchedCode = useMemo(() => {
    const q = country.trim().toLowerCase()
    if (q.length < 2) return null
    const codes = [...new Set(plans.flatMap((p) => p.coverage ?? []))]
    const exact = codes.find((c) => c.toLowerCase() === q)
    if (exact) return exact
    // Every name we have for a country: ours in this language, and the
    // browser's. A visitor may type either, and neither list is complete —
    // ours covers only the destinations we sell, the browser's has no Uzbek.
    const namesOf = (code: string) => [ours[code], intlName(code)].filter(Boolean).map(fold)
    const needle = fold(q)
    return (
      codes.find((c) => namesOf(c).some((n) => n === needle)) ??
      codes.find((c) => namesOf(c).some((n) => n.startsWith(needle))) ??
      codes.find((c) => needle.length >= 4 && namesOf(c).some((n) => n.includes(needle))) ??
      null
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, plans, lang, ours])

  const shown = useMemo(() => {
    const list = plans.filter((plan) => {
      if (size != null && plan.data_amount_mb !== size) return false
      if (duration != null) {
        const index = DURATIONS.findIndex((d) => d.key === duration)
        const lower = index === 0 ? 0 : DURATIONS[index - 1].max
        if (plan.validity_days <= lower || plan.validity_days > DURATIONS[index].max) return false
      }
      // Only once the typed text resolves to a real country: half a word must
      // not empty the page.
      if (matchedCode && !(plan.coverage ?? []).includes(matchedCode)) return false
      return true
    })
    return list.sort((a, b) =>
      sort === 'price' ? a.price_usd - b.price_usd : a.data_amount_mb - b.data_amount_mb || a.validity_days - b.validity_days,
    )
  }, [plans, size, duration, matchedCode, sort])

  const dirty = size != null || duration != null || country.trim() !== ''

  const chip = (active: boolean) =>
    `focus-ring whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-600 transition ${
      active
        ? 'bg-brand-600 text-white shadow-sm'
        : 'bg-mist text-slate-soft ring-1 ring-line hover:text-ink'
    }`

  return (
    <>
      <div className="mt-6 rounded-2xl bg-surface p-4 ring-1 ring-line sm:p-5">
        <div className="flex items-center gap-2 text-xs font-700 uppercase tracking-wide text-slate-soft">
          <SlidersHorizontal size={14} aria-hidden />
          {t('global.filterTitle')}
        </div>

        {/* The country search sits first and full width: it is the question a
            customer actually has, and the one the price alone answers wrongly. */}
        <div className="relative mt-3">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-soft"
          />
          <input
            type="search"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder={t('global.filterCountryPlaceholder')}
            aria-label={t('global.filterCountry')}
            className="focus-ring w-full rounded-xl bg-mist py-2.5 pl-9 pr-9 text-sm text-ink ring-1 ring-line placeholder:text-slate-soft"
          />
          {country && (
            <button
              type="button"
              onClick={() => setCountry('')}
              aria-label={t('global.filterClear')}
              className="focus-ring absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-lg text-slate-soft hover:bg-surface hover:text-ink"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {country.trim().length >= 2 && (
          <p className="mt-2 text-xs text-slate-soft">
            {matchedCode
              ? t('global.filterCountryFound', { country: nameFor(matchedCode), count: shown.length })
              : t('global.filterCountryUnknown')}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-600 text-slate-soft">{t('global.filterData')}</span>
          <button type="button" onClick={() => setSize(null)} className={chip(size == null)}>
            {t('global.filterAll')}
          </button>
          {sizes.map((mb) => (
            <button key={mb} type="button" onClick={() => setSize(mb)} className={chip(size === mb)}>
              {Math.round(mb / 1024)} GB
            </button>
          ))}
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs font-600 text-slate-soft">{t('global.filterDuration')}</span>
          <button type="button" onClick={() => setDuration(null)} className={chip(duration == null)}>
            {t('global.filterAll')}
          </button>
          {DURATIONS.map((d) => (
            <button
              key={d.key}
              type="button"
              onClick={() => setDuration(duration === d.key ? null : d.key)}
              className={chip(duration === d.key)}
            >
              {t(`global.duration.${d.key}`)}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-xs font-600 text-slate-soft">{t('global.filterSort')}</span>
            <button type="button" onClick={() => setSort('price')} className={chip(sort === 'price')}>
              {t('global.sortPrice')}
            </button>
            <button type="button" onClick={() => setSort('data')} className={chip(sort === 'data')}>
              {t('global.sortData')}
            </button>
          </div>
          {dirty && (
            <button
              type="button"
              onClick={() => {
                setSize(null)
                setDuration(null)
                setCountry('')
              }}
              className="focus-ring rounded-lg px-2 py-1 text-xs font-600 text-brand-600 hover:underline"
            >
              {t('global.filterReset')}
            </button>
          )}
        </div>
      </div>

      <p className="mt-4 text-sm text-slate-soft">
        {t('global.resultCount', { shown: shown.length, total: plans.length })}
      </p>

      {shown.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((plan, i) => (
            <Reveal key={plan.id} delay={Math.min(i, 6) * 40}>
              <div className="flex h-full flex-col">
                <PlanCard plan={plan} onAdd={onAdd} added={added === plan.id} />
                {(plan.coverage?.length ?? 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => setCoverageOf(plan)}
                    className="focus-ring -mt-1 flex items-center justify-center gap-1.5 rounded-b-2xl px-3 py-2 text-xs font-600 text-brand-600 hover:bg-mist"
                  >
                    <Globe2 size={13} aria-hidden />
                    {t('global.coverageLink')}
                  </button>
                )}
              </div>
            </Reveal>
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
                className="focus-ring grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-soft hover:bg-mist hover:text-ink"
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
                      <Check size={12} className="shrink-0 text-brand-500" aria-hidden />
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
