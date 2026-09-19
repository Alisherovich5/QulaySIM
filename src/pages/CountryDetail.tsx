import { useState } from 'react'
import { bootIf } from '../lib/boot'
import { useCatalogue } from '../lib/useCatalogue'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { CountryDetail as CountryDetailType, Plan } from '../lib/types'
import PlanPicker from '../components/PlanPicker'
import { useDesignCopy } from '../lib/design-copy'
import { destinationPhoto } from '../lib/destination-media'
import Photo from '../components/media/Photo'
import Flag from '../components/Flag'
import Seo from '../components/Seo'
import DestinationFacts from '../components/DestinationFacts'
import RelatedDestinations from '../components/RelatedDestinations'
import { useCart } from '../context/CartContext'
import { SITE_URL, type SeoLang } from '../lib/seo'
import { descriptionParams, factsFor } from '../lib/destination-facts'
import { geoFor } from '../lib/geo'
import { breadcrumbLd, destinationLd } from '../lib/structured-data'

export default function CountryDetail() {
  const { slug } = useParams()
  const c = useDesignCopy()
  const [added, setAdded] = useState<number | null>(null)
  const { add } = useCart()
  const { t, i18n } = useTranslation()

  /**
   * Seeded from the data the build baked into this page, so the prices are on
   * screen in the first frame instead of ~350 ms later. `bootIf` refuses the
   * seed when the slug does not match, which is what stops a client-side
   * navigation from showing the previous country's tariffs — and `key` below is
   * what re-seeds when the visitor moves to another destination.
   *
   * `missing` is true only when the API actually said this destination does not
   * exist. The difference matters because this page carries its own indexing
   * instructions: treating every failure as "not found" meant a momentary API
   * outage turned a real destination page into a noindex 404, and a crawler
   * rendering it in that window would be told to drop a page that is fine. A
   * request that simply failed leaves the baked prices and metadata untouched.
   * See lib/catalogue.ts for the rule and its tests.
   */
  const {
    data: country,
    loading,
    missing,
  } = useCatalogue<CountryDetailType>({
    seed: () => bootIf<CountryDetailType>('country', slug),
    load: () => api.get<CountryDetailType>(`/countries/${slug}`).then((r) => r.data),
    key: slug,
    deps: [i18n.language],
    clearOnMissing: true,
  })

  const handleAdd = (plan: Plan) => {
    if (!country) return
    add(plan, country.name, country.iso2)
    setAdded(plan.id)
    // No jump to checkout. It used to navigate 350 ms later, which answered
    // the tap with a page nobody asked for: somebody comparing a 5 GB against
    // a 10 GB was thrown into a payment form for the first one they touched.
    // CartBar now offers the two real answers — go to the cart, or keep
    // choosing — from the bottom of the screen, where the thumb already is.
  }

  if (loading) {
    return <div className="container-page py-16 text-slate-soft">{t('country.loadingPlans')}</div>
  }
  if (!country) {
    return (
      <div className="container-page py-16">
        {/* An unknown slug is a 404 wearing a 200, and the one page on the site
            most likely to be linked to from somewhere stale. Kept out of the
            index so a deactivated destination stops being a search result —
            but only when the API confirmed it is gone, never on a failure that
            might just be the network. */}
        {missing && (
          <Seo title={t('seo.notFoundTitle')} description={t('seo.notFoundDescription')} noindex />
        )}
        <p className="text-slate-soft">{t('country.notFound')}</p>
        <Link to="/destinations" className="mt-4 inline-flex text-brand-600">
          {t('country.backToAll')}
        </Link>
      </div>
    )
  }

  const lang = (i18n.resolvedLanguage ?? 'uz') as SeoLang
  const path = `/destinations/${country.slug}`
  // The richer sentence whenever there are real plans to describe — it names the
  // plan count, the entry price, the validity range and the networks, so no two
  // destinations share a search snippet. The plain template is the fallback for
  // a country whose plans have not been priced yet.
  const facts = factsFor(country.plans)
  const photo = destinationPhoto(country.slug)
  const description = facts
    ? t('seo.countryDescriptionRich', descriptionParams(country.name, facts))
    : t('seo.countryDescription', { country: country.name })
  // Prices come from the plans this page is rendering, so the "from $x" in the
  // search result is the same number the visitor sees on arrival. A cached or
  // guessed figure here would be a promise the page then breaks.
  const geo = geoFor(country.iso2)
  const product = destinationLd(
    t('seo.countryProductName', { country: country.name }),
    description,
    path,
    lang,
    country.plans.map((p) => ({ name: p.title, price: p.price_usd, currency: 'USD' })),
    geo,
  )

  return (
    <div className="qs-page qs-country container-page">
      <Seo
        title={t('seo.countryTitle', { country: country.name })}
        description={description}
        image={`${SITE_URL}/api/og/${country.slug}.png`}
        geo={geo}
        jsonLd={[
          ...(product ? [product] : []),
          breadcrumbLd(
            [
              { name: t('nav.destinations'), path: '/destinations' },
              ...(country.region
                ? [
                    {
                      name: t(`region.${country.region.slug}`, {
                        defaultValue: country.region.name,
                      }),
                      path: `/destinations/region/${country.region.slug}`,
                    },
                  ]
                : []),
              { name: country.name, path },
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

      <div className="destination-intro">
        <div>
          <div className="destination-title">
            <Flag iso2={country.iso2} alt="" />
            <h1>{country.name}</h1>
          </div>
          <p>{c.countryNote}</p>
          <div className="destination-meta">
            {country.region && (
              <Link to={'/destinations/region/' + country.region.slug}>
                {t(`region.${country.region.slug}`, { defaultValue: country.region.name })}
              </Link>
            )}
            <span>{t('country.plansAvailable', { count: country.plans.length })}</span>
          </div>
        </div>
        {/* The photograph is the subject of this heading, not decoration
            behind it, so it keeps its alt text — "Istanbul" tells a screen
            reader something the country name beside it does not. Destinations
            we have no photograph of fall back to the still globe, which is what
            `is-globe` restyles: contained rather than cropped, and no scrim. */}
        <div className={'destination-photo' + (photo ? '' : ' is-globe')}>
          {photo ? (
            <Photo
              name={photo.name}
              alt={photo.place}
              // Half the width of a page that is itself capped, so the small
              // variant is right up to tablet size.
              sizes="(min-width: 1024px) 560px, 56vw"
              priority
            />
          ) : (
            <img src="/hero-globe@2x.webp" alt="" width={512} height={512} />
          )}
        </div>
      </div>
      <h2>{c.planTitle}</h2>
      <PlanPicker key={country.slug} plans={country.plans} onAdd={handleAdd} added={added} />
      {facts && (
        <div className="mt-10">
          <DestinationFacts facts={facts} country={country.name} />
        </div>
      )}

      <RelatedDestinations regionSlug={country.region?.slug} currentSlug={country.slug} />
    </div>
  )
}
