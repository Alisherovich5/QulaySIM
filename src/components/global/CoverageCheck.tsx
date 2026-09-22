import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Search, X } from 'lucide-react'
import Flag from '../Flag'
import { useCurrency } from '../../context/CurrencyContext'
import type { Country, Plan } from '../../lib/types'

/**
 * "Is where I am going included?" — asked, and answered.
 *
 * What stood here was twenty-four flags out of a hundred and sixty-seven, under
 * a line admitting the other hundred and forty-three were not shown. That is
 * decoration wearing the clothes of an answer: a visitor could not tell whether
 * their own stop was in the list, which is the only thing they came to find
 * out.
 *
 * So the same data drives a control instead. Type a country, get a yes or a no,
 * and on a yes the plans that actually cover it with the cheapest of them
 * named. On a no, the link to that country's own page — which is the honest
 * answer, not a dead end.
 */

/** Case and the three apostrophes Uzbek is written with, folded together: a
 *  visitor typing the straight quote their keyboard makes must still find
 *  "Ko‘shma Shtatlar". */
function fold(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[‘’ʻʼ`´']/g, "'")
    .trim()
}

export default function CoverageCheck({
  covered,
  countries,
  plans,
  onPick,
}: {
  covered: readonly string[]
  countries: readonly Country[]
  plans: readonly Plan[]
  /** Handed up so the plan list below can filter to the same country. */
  onPick: (country: { iso2: string; name: string } | null) => void
}) {
  const { t } = useTranslation()
  const { formatPrice } = useCurrency()
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<Country | null>(null)

  const coveredSet = useMemo(
    () => new Set(covered.map((c) => c.toUpperCase())),
    [covered],
  )

  /* Every country we know, not only the covered ones. A visitor whose stop is
     not in a worldwide plan still needs to be told so, and sent somewhere
     useful — a search that silently omits them answers nothing. */
  const matches = useMemo(() => {
    const needle = fold(query)
    if (needle.length < 2) return []
    return countries
      .filter((c) => fold(c.name).includes(needle))
      .sort((a, b) => {
        const ai = fold(a.name).startsWith(needle) ? 0 : 1
        const bi = fold(b.name).startsWith(needle) ? 0 : 1
        return ai - bi || a.name.localeCompare(b.name)
      })
      .slice(0, 6)
  }, [countries, query])

  /* The plans that carry this country, cheapest first. Coverage is a filter and
     never a ranking — a plan either reaches the place or it does not. */
  const fits = useMemo(() => {
    if (!picked) return []
    const iso = picked.iso2.toUpperCase()
    return plans
      .filter((p) => (p.coverage ?? []).some((c) => c.toUpperCase() === iso))
      .sort((a, b) => a.price_usd - b.price_usd)
  }, [picked, plans])

  const isCovered = picked ? coveredSet.has(picked.iso2.toUpperCase()) || fits.length > 0 : false

  return (
    <div className="gl-check">
      {/* A real form, so the keyboard behaves the way a search box promises:
          Enter answers with the best match instead of doing nothing. It was a
          list you could only reach with the mouse. */}
      <form
        className="gl-check-field"
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          const first = matches[0]
          if (!first) return
          setPicked(first)
          setQuery(first.name)
          onPick({ iso2: first.iso2.toUpperCase(), name: first.name })
        }}
      >
        <Search size={20} aria-hidden />
        <input
          type="search"
          value={query}
          placeholder={t('global.checkPlaceholder')}
          aria-label={t('global.checkPlaceholder')}
          onChange={(e) => {
            setQuery(e.target.value)
            setPicked(null)
          }}
        />
        {query && (
          <button
            type="button"
            className="gl-check-clear focus-ring"
            aria-label={t('common.clear')}
            onClick={() => {
              setQuery('')
              setPicked(null)
              onPick(null)
            }}
          >
            <X size={16} aria-hidden />
          </button>
        )}
        {/* The fill comes from `bg-brand-600`, not the token: in the dark theme
            the token carries the TEXT green, and the fill is pinned by a rule in
            travel-palette.css that only matches the class. */}
        <button
          type="submit"
          className="gl-check-go focus-ring bg-brand-600 hover:bg-brand-700"
          aria-label={t('global.searchSubmit')}
        >
          <Search size={20} aria-hidden />
        </button>
      </form>

      {!picked && matches.length > 0 && (
        <ul className="gl-check-list">
          {matches.map((c) => (
            <li key={c.iso2}>
              <button
                type="button"
                className="focus-ring"
                onClick={() => {
                  setPicked(c)
                  setQuery(c.name)
                  onPick({ iso2: c.iso2.toUpperCase(), name: c.name })
                }}
              >
                <Flag iso2={c.iso2} className="h-4 w-6 rounded-[2px]" />
                <span>{c.name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {picked && (
        <div className={`gl-check-answer${isCovered ? ' is-yes' : ' is-no'}`} aria-live="polite">
          {isCovered ? (
            <>
              <p className="gl-check-verdict">
                <Check size={18} aria-hidden />
                {t('global.checkYes', { country: picked.name })}
              </p>
              <p className="gl-check-detail">
                {t('global.checkPlans', {
                  count: fits.length,
                  price: formatPrice(fits[0]?.price_usd ?? 0),
                })}
              </p>
              <a href="#plans" className="gl-check-cta focus-ring">
                {t('global.cta')}
                <ArrowRight size={16} aria-hidden />
              </a>
            </>
          ) : (
            <>
              <p className="gl-check-verdict">
                <X size={18} aria-hidden />
                {t('global.checkNo', { country: picked.name })}
              </p>
              <p className="gl-check-detail">{t('global.checkNoHint')}</p>
              <Link to={`/destinations/${picked.slug}`} className="gl-check-cta focus-ring">
                {t('global.checkNoCta', { country: picked.name })}
                <ArrowRight size={16} aria-hidden />
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  )
}
