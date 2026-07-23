import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Country } from '../lib/types'
import { useCurrency } from '../context/CurrencyContext'
import Flag from './Flag'

export default function CountryCard({ country }: { country: Country }) {
  const { t } = useTranslation()
  const { formatPrice } = useCurrency()
  return (
    <Link
      to={`/destinations/${country.slug}`}
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
          <span className="font-600 text-brand-600">{formatPrice(country.starting_price)}</span>
        </p>
      </div>
      <ArrowUpRight
        size={18}
        className="text-slate-soft transition group-hover:text-brand-600"
      />
    </Link>
  )
}
