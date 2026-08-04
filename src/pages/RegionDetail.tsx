import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { api } from '../lib/api'
import type { Country, Region } from '../lib/types'
import CountryCard from '../components/CountryCard'
import Reveal from '../components/Reveal'
import Seo from '../components/Seo'
import { Button } from '../components/ui'
import type { SeoLang } from '../lib/seo'
import { breadcrumbLd, destinationListLd } from '../lib/structured-data'

/**
 * One region's catalogue as its own page — the category tier the site lacked.
 *
 * "Yevropa uchun eSIM" and «eSIM Европа» are real queries with no page to
 * answer them: the country tier is too specific and the full catalogue too
 * general, and the region filter was a query parameter — invisible to a
 * crawler, unshareable as an address. These are the same seven groupings the
 * catalogue filter already uses, given addresses, metadata and a place in the
 * sitemap. Each links onward to its countries and sideways to its sibling
 * regions, so the catalogue tree is walkable in both directions.
 */
export default function RegionDetail() {
  const { slug } = useParams()
  const { t, i18n } = useTranslation()
  const [countries, setCountries] = useState<Country[]>([])
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(true)
  const [missing, setMissing] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    Promise.all([
      api.get<Country[]>('/countries', { params: { region: slug } }),
      api.get<Region[]>('/regions'),
    ])
      .then(([c, r]) => {
        setCountries(c.data)
        setRegions(r.data)
        // The regions endpoint is the authority on whether this slug exists;
        // an empty country list alone is a thin region, not a missing one.
        setMissing(!r.data.some((x) => x.slug === slug))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [slug, i18n.language])

  if (loading) {
    return <div className="container-page py-16 text-slate-soft">{t('common.loading')}</div>
  }

  if (missing || !slug) {
    return (
      <div className="container-page py-16">
        <Seo title={t('seo.notFoundTitle')} description={t('seo.notFoundDescription')} noindex />
        <p className="text-slate-soft">{t('destinations.noMatch')}</p>
        <Link to="/destinations" className="mt-4 inline-flex text-brand-600">
          {t('country.backToAll')}
        </Link>
      </div>
    )
  }

  const lang = (i18n.resolvedLanguage ?? 'uz') as SeoLang
  // The slug keys the translation; the API name is the fallback for a region
  // added before its translation lands — same convention as the old hero chips.
  const regionName = t(`region.${slug}`, {
    defaultValue: regions.find((r) => r.slug === slug)?.name ?? slug,
  })
  const path = `/destinations/region/${slug}`
  const prices = countries
    .map((c) => c.starting_price)
    .filter((p): p is number => p != null && p > 0)
  const minPrice = prices.length ? Math.min(...prices) : null

  const description =
    countries.length && minPrice != null
      ? t('seo.regionDescriptionRich', {
          region: regionName,
          count: countries.length,
          price: minPrice.toFixed(2),
        })
      : t('seo.destinationsDescription')

  const listLd = destinationListLd(countries, lang)
  const siblings = regions.filter((r) => r.slug !== slug)

  return (
    <div className="container-page py-8 sm:py-12">
      <Seo
        title={t('seo.regionTitle', { region: regionName })}
        description={description}
        jsonLd={[
          ...(listLd ? [listLd] : []),
          breadcrumbLd(
            [
              { name: t('nav.destinations'), path: '/destinations' },
              { name: regionName, path },
            ],
            lang,
          ),
        ]}
      />

      <Link
        to="/destinations"
        className="inline-flex items-center gap-1.5 text-sm font-600 text-slate-soft hover:text-brand-600"
      >
        <ArrowLeft size={16} /> {t('country.backToAll')}
      </Link>

      <h1 className="mt-6 text-2xl font-700 sm:text-3xl">
        {t('seo.regionTitle', { region: regionName }).split('—')[0].trim()}
      </h1>
      {countries.length > 0 && minPrice != null && (
        <p className="mt-2 leading-6 text-slate-soft">
          {t('seo.regionPageCount', { count: countries.length, price: minPrice.toFixed(2) })}
        </p>
      )}

      {countries.length === 0 ? (
        <p className="mt-10 text-slate-soft">{t('seo.regionEmpty')}</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((c, i) => (
            <Reveal key={c.id} delay={i * 40}>
              <CountryCard country={c} />
            </Reveal>
          ))}
        </div>
      )}

      {/* Sideways links: each hub names its siblings, so the seven pages
          reinforce one another instead of hanging separately off the
          catalogue. */}
      {siblings.length > 0 && (
        <section className="mt-12">
          <h2 className="text-base font-700 sm:text-lg">{t('seo.regionOthers')}</h2>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {siblings.map((r) => (
              <Link
                key={r.slug}
                to={`/destinations/region/${r.slug}`}
                className="focus-ring flex min-h-11 items-center rounded-xl bg-surface px-3.5 text-sm font-600 text-ink ring-1 ring-line transition hover:ring-brand-300 hover:text-brand-600"
              >
                {t(`region.${r.slug}`, { defaultValue: r.name })}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 flex justify-center">
        <Button to="/destinations" variant="ghost" className="px-6 py-3">
          {t('seo.regionAllCta')} <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  )
}
