import { ArrowRight, ArrowUpRight, Globe2, Smartphone } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import { boot } from '../../lib/boot'
import { useCatalogue } from '../../lib/useCatalogue'
import type { Country } from '../../lib/types'
import { useCurrency } from '../../context/CurrencyContext'
import { useDesignCopy } from '../../lib/design-copy'
import { destinationMedia } from '../../lib/destination-media'
import Flag from '../Flag'

export default function TravelDestinations() {
  const c = useDesignCopy()
  const { i18n } = useTranslation()
  const { formatPrice } = useCurrency()
  const { data, loading } = useCatalogue<Country[]>({
    seed: () => boot<Country[]>('countries'),
    load: () => api.get<Country[]>('/countries').then((r) => r.data),
    deps: [i18n.language],
  })
  const featured = Object.keys(destinationMedia)
    .map((slug) => data?.find((country) => country.slug === slug))
    .filter((country): country is Country => !!country)
  const others =
    data?.filter((country) => country.is_popular && !featured.includes(country)).slice(0, 6) ?? []
  return (
    <>
      <section className="destinations-section container-page">
        <div className="section-heading">
          <div>
            <h2>{c.popular}</h2>
            <p>{c.popularNote}</p>
          </div>
          <Link className="text-link" to="/destinations">
            {c.all}
            <ArrowRight size={18} />
          </Link>
        </div>
        <div className="travel-photo-grid" aria-busy={loading}>
          {featured.map((country) => (
            <Link
              key={country.id}
              to={'/destinations/' + country.slug}
              className="travel-photo-card"
            >
              <div className="photo-window">
                <img
                  src={destinationMedia[country.slug].src}
                  alt={destinationMedia[country.slug].place}
                  loading="lazy"
                  width="600"
                  height="450"
                />
                <span className="photo-arrow">
                  <ArrowUpRight size={21} />
                </span>
              </div>
              <div className="photo-card-details">
                <div className="photo-card-name">
                  <Flag iso2={country.iso2} alt="" />
                  <h3>{country.name}</h3>
                </div>
                <p>
                  {country.starting_price != null ? formatPrice(country.starting_price) : '—'}{' '}
                  <span>{c.from}</span>
                </p>
              </div>
            </Link>
          ))}
          {loading &&
            !featured.length &&
            [1, 2, 3, 4].map((i) => <div key={i} className="photo-skeleton" />)}
        </div>
        <div className="country-shortlist">
          {others.map((country) => (
            <Link key={country.id} to={'/destinations/' + country.slug}>
              <Flag iso2={country.iso2} alt="" />
              <span>{country.name}</span>
              <strong>{formatPrice(country.starting_price)}</strong>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
        {!loading && !data?.length && (
          <div className="empty-destinations">
            <p>{c.empty}</p>
            <Link to="/destinations" className="text-link">
              {c.all}
              <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </section>
      <section className="container-page travel-utilities">
        <Link className="device-prompt" to="/device-check">
          <Smartphone size={36} strokeWidth={1.4} />
          <div>
            <h3>{c.device}</h3>
            <p>{c.deviceNote}</p>
            <span className="text-link">
              {c.deviceCta}
              <ArrowRight size={18} />
            </span>
          </div>
        </Link>
        <Link className="global-prompt" to="/global">
          <Globe2 size={36} strokeWidth={1.4} />
          <div>
            <h3>{c.global}</h3>
            <p>{c.globalNote}</p>
            <span className="text-link">
              {c.globalCta}
              <ArrowRight size={18} />
            </span>
          </div>
        </Link>
      </section>
    </>
  )
}
