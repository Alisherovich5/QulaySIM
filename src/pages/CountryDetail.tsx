import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ShoppingBag } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import type { CountryDetail as CountryDetailType, Plan } from '../lib/types'
import PlanCard from '../components/PlanCard'
import Flag from '../components/Flag'
import Reveal from '../components/Reveal'
import Seo from '../components/Seo'
import DestinationFacts from '../components/DestinationFacts'
import RelatedDestinations from '../components/RelatedDestinations'
import { Button } from '../components/ui'
import { useCart } from '../context/CartContext'
import { SITE_URL, type SeoLang } from '../lib/seo'
import { descriptionParams, factsFor } from '../lib/destination-facts'
import { breadcrumbLd, destinationLd } from '../lib/structured-data'

export default function CountryDetail() {
  const { slug } = useParams()
  const [country, setCountry] = useState<CountryDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  /**
   * True only when the API actually said this destination does not exist.
   *
   * The difference matters now that this page carries its own indexing
   * instructions. Treating every failure as "not found" meant a momentary API
   * outage turned a real destination page into a noindex 404 — and if a crawler
   * happened to render it during that window, it would be told to drop a page
   * that is perfectly fine. A request that simply failed leaves this false, and
   * the metadata the build baked into the page stays untouched.
   */
  const [missing, setMissing] = useState(false)
  const [added, setAdded] = useState<number | null>(null)
  const { add } = useCart()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    api
      .get<CountryDetailType>(`/countries/${slug}`)
      .then((r) => {
        setCountry(r.data)
        setMissing(false)
      })
      .catch((error: unknown) => {
        setCountry(null)
        setMissing((error as { response?: { status?: number } })?.response?.status === 404)
      })
      .finally(() => setLoading(false))
  }, [slug, i18n.language])

  const handleAdd = (plan: Plan) => {
    if (!country) return
    add(plan, country.name, country.iso2)
    setAdded(plan.id)
    // Straight to checkout rather than leaving the customer on the plan list
    // wondering what happened. The brief flash of the "added" state is kept so
    // the tap is acknowledged before the page changes.
    setTimeout(() => navigate('/checkout'), 350)
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
  const description = facts
    ? t('seo.countryDescriptionRich', descriptionParams(country.name, facts))
    : t('seo.countryDescription', { country: country.name })
  // Prices come from the plans this page is rendering, so the "from $x" in the
  // search result is the same number the visitor sees on arrival. A cached or
  // guessed figure here would be a promise the page then breaks.
  const product = destinationLd(
    t('seo.countryProductName', { country: country.name }),
    description,
    path,
    lang,
    country.plans.map((p) => ({ name: p.title, price: p.price_usd, currency: 'USD' })),
  )

  return (
    <div className="container-page py-8 sm:py-12">
      <Seo
        title={t('seo.countryTitle', { country: country.name })}
        description={description}
        image={`${SITE_URL}/api/og/${country.slug}.png`}
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

      <div className="mt-6 flex items-center gap-3 sm:gap-5">
        <Flag
          iso2={country.iso2}
          w={160}
          alt={`${country.name} flag`}
          className="h-14 w-20 rounded-lg object-cover ring-1 ring-line sm:h-16 sm:w-24"
        />
        <div>
          <h1 className="text-2xl font-700 sm:text-3xl">{country.name}</h1>
          <p className="mt-1 text-sm leading-5 text-slate-soft sm:text-base">
            {country.region ? (
              // A link, not a label: the region hub is this page's category
              // tier, and every country page linking up to it is what makes
              // the hub rank for "region + eSIM" queries.
              <Link
                to={`/destinations/region/${country.region.slug}`}
                className="focus-ring rounded font-600 text-brand-600 hover:underline dark:text-accent-400"
              >
                {t(`region.${country.region.slug}`, { defaultValue: country.region.name })}
              </Link>
            ) : null}
            {country.region ? ' · ' : ''}
            {t('country.plansAvailable', { count: country.plans.length })}
          </p>
        </div>
      </div>

      {facts && <DestinationFacts facts={facts} country={country.name} />}

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {country.plans.map((plan, i) => (
          <Reveal key={plan.id} delay={i * 60}>
            <PlanCard plan={plan} onAdd={handleAdd} added={added === plan.id} />
          </Reveal>
        ))}
      </div>

      <RelatedDestinations regionSlug={country.region?.slug} currentSlug={country.slug} />

      <div className="mt-10 flex justify-center">
        <Button to="/checkout" variant="ghost" className="px-6 py-3">
          <ShoppingBag size={18} /> {t('common.goToCart')}
        </Button>
      </div>
    </div>
  )
}
