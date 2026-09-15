import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCurrency } from '../context/CurrencyContext'
import type { Country } from '../lib/types'
import Flag from './Flag'
import { api } from '../lib/api'
const warmed = new Set<string>()
function prefetchCountry(slug: string) {
  if (warmed.has(slug)) return
  warmed.add(slug)
  void api.get('/countries/' + slug).catch(() => warmed.delete(slug))
}
export default function CountryCard({ country }: { country: Country }) {
  const { t } = useTranslation()
  const { formatPrice } = useCurrency()
  return (
    <Link
      to={'/destinations/' + country.slug}
      onMouseEnter={() => prefetchCountry(country.slug)}
      onFocus={() => prefetchCountry(country.slug)}
      className="country-card"
    >
      <Flag iso2={country.iso2} alt="" />
      <div>
        <h3>{country.name}</h3>
        <p>
          {t('common.from')} {formatPrice(country.starting_price)}
        </p>
      </div>
      <ArrowUpRight size={19} />
    </Link>
  )
}
