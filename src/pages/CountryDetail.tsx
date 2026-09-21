import { useState } from 'react'
import { bootIf } from '../lib/boot'
import { useCatalogue } from '../lib/useCatalogue'
import { Link, useNavigate, useParams } from 'react-router-dom'
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
import DestinationNetworks from '../components/DestinationNetworks'
import { countryFaq } from '../lib/networks-copy'
import { geoFor } from '../lib/geo'
import { breadcrumbLd, destinationLd, faqLd } from '../lib/structured-data'

export default function CountryDetail() {
  const { slug } = useParams()
  const c = useDesignCopy()
  const [added, setAdded] = useState<number | null>(null)
  const { add } = useCart()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

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
    /* Straight to the cart, at the owner's instruction.
     *
     * It worked this way once and was taken out, on the reasoning that somebody
     * weighing 5 GB against 10 GB would be thrown into a payment form by the
     * first row they touched. What makes it safe now is that the list itself is
     * the comparison: every row already shows its size, days, network and
     * price, so nobody has to open a plan to read it. The tap is a decision,
     * not a look. */
    navigate('/checkout')
  }

  // Only when there is nothing to show. The seed above already holds this
  // country's plans — they were baked into the HTML by the build — and
  // returning early on `loading` threw them away: the page rendered a one-line
  // "loading plans" for ~700 ms and then grew to five thousand pixels, which
  // measured as a cumulative layout shift of 0.73 on every destination page.
  // The threshold for "good" is 0.1, and destination pages are what search
  // sends people to.
  if (loading && !country) {
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
          ...(() => {
            const qa = countryFaq(country.iso2, country.name, facts, lang as 'uz' | 'ru' | 'en')
            const ld = faqLd(qa.map((x) => ({ question: x.q, answer: x.a })))
            return ld ? [ld] : []
          })(),
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

      <div className={"destination-intro" + (photo ? "" : " is-plain")}>
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
            reader something the country name beside it does not.
            
            A destination we have no photograph of gets no picture at all. It
            used to get a globe: the same still of Europe and Africa on all one
            hundred and ninety of them, including Australia, where it showed
            the wrong half of the planet. A generic image is not neutral — it
            says this page had nothing specific to show. */}
        {photo && (
          <div className="destination-photo">
            <Photo
              name={photo.name}
              alt={photo.place}
              // Half the width of a page that is itself capped, so the small
              // variant is right up to tablet size.
              sizes="(min-width: 1024px) 560px, 56vw"
              priority
            />
          </div>
        )}
      </div>
      <h2>{c.planTitle}</h2>
      <PlanPicker key={country.slug} plans={country.plans} onAdd={handleAdd} added={added} />
      {facts && (
        <div className="mt-10">
          <DestinationFacts facts={facts} country={country.name} />
        </div>
      )}

      <DestinationNetworks iso2={country.iso2} country={country.name} facts={facts} />

      <RelatedDestinations regionSlug={country.region?.slug} currentSlug={country.slug} />
    </div>
  )
}
