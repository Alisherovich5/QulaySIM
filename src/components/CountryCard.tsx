import { Link } from 'react-router-dom'
import PriceTag from './PriceTag'
import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Country } from '../lib/types'
import Flag from './Flag'
import { api } from '../lib/api'

/** Slugs already asked for, so hovering along a list does not refetch. */
const warmed = new Set<string>()

function prefetchCountry(slug: string): void {
  if (warmed.has(slug)) return
  warmed.add(slug)
  // Deliberately ignored: this is a hint, and a failed hint must be invisible.
  void api.get(`/countries/${slug}`).catch(() => warmed.delete(slug))
}

export default function CountryCard({ country }: { country: Country }) {
  const { t } = useTranslation()
  return (
    <Link
      to={`/destinations/${country.slug}`}
      // Warm the destination before the click. The catalogue is cacheable now,
      // so this request lands in the browser's own cache and the page that
      // opens has its prices already — on this route a request costs ~350 ms,
      // and hovering buys most of that back for free.
      onMouseEnter={() => prefetchCountry(country.slug)}
      onFocus={() => prefetchCountry(country.slug)}
      // Cards below the fold are not laid out until they approach the viewport.
      // A destinations page carries two hundred of them.
      style={{ contentVisibility: 'auto', containIntrinsicSize: '78px' }}
      className="card group flex items-center gap-4 p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-brand-500/8 hover:ring-brand-200"
    >
      <Flag
        iso2={country.iso2}
        alt={`${country.name} flag`}
        className="h-10 w-14 shrink-0 rounded-md object-cover ring-1 ring-line"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-600 text-ink">{country.name}</p>
        <p className="text-sm text-slate-soft">
          {t('common.from')}{' '}
          <PriceTag usd={country.starting_price} size="sm" inline className="text-brand-600" />
        </p>
      </div>
      <ArrowUpRight
        size={18}
        className="text-slate-soft transition group-hover:text-brand-600"
      />
    </Link>
  )
}
