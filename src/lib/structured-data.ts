/**
 * Structured data — the part of a page written for machines.
 *
 * This is what turns a plain blue link into a result with a price, a rating or
 * a set of expandable questions under it. For a catalogue competing against
 * Airalo and Holafly on the same queries, the visual difference in the results
 * page is worth more than several positions of rank.
 *
 * Everything here is built from data the page already has. Nothing is invented:
 * a price that appears in structured data but not on the page is a
 * misrepresentation Google penalises, and it is also just a lie to a customer.
 */

import { absoluteUrl, OG_IMAGE, SITE_NAME, SITE_URL, type SeoLang } from './seo'

const LOGO = `${SITE_URL}/qulaysim-logo.svg`

/**
 * Who we are. Emitted once, on the home page.
 *
 * `sameAs` is how Google ties the site to the Telegram and Instagram accounts
 * and treats them as one entity — which is what produces a knowledge panel for
 * a brand name rather than three unrelated results.
 */
export function organisationLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
    logo: LOGO,
    image: OG_IMAGE,
    sameAs: ['https://t.me/qulaysimuz', 'https://www.instagram.com/qulaysim'],
    areaServed: 'UZ',
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        url: `${SITE_URL}/support`,
        availableLanguage: ['uz', 'ru', 'en'],
      },
    ],
  }
}

/** The site itself, so the brand can win a sitelinks search box. */
export function webSiteLd(lang: SeoLang): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    inLanguage: lang,
    publisher: { '@id': `${SITE_URL}/#organization` },
  }
}

export interface BreadcrumbStep {
  name: string
  path: string
}

/**
 * The trail shown in place of the raw URL under a result.
 *
 * `item` is omitted on the last step on purpose: schema.org says the current
 * page should not link to itself, and Google drops a trail that does.
 */
export function breadcrumbLd(steps: BreadcrumbStep[], lang: SeoLang): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: steps.map((step, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: step.name,
      ...(i === steps.length - 1 ? {} : { item: absoluteUrl(step.path, lang) }),
    })),
  }
}

export interface OfferInput {
  name: string
  price: number
  currency: string
}

/**
 * A destination's plans, as one product with a price range.
 *
 * `lowPrice` is what shows in the results, so it has to be the real cheapest
 * plan actually on sale — computed from the list the page rendered, never
 * hardcoded. When the catalogue changes, this changes with it.
 *
 * Returns null when there is nothing to sell. An AggregateOffer with no offers
 * is invalid structured data, and a "from $0" result is worse than no rich
 * result at all.
 */
export function destinationLd(
  /** Already localised and already in the right word order — see seo.countryProductName. */
  productName: string,
  description: string,
  path: string,
  lang: SeoLang,
  offers: OfferInput[],
): Record<string, unknown> | null {
  const priced = offers.filter((o) => Number.isFinite(o.price) && o.price > 0)
  if (priced.length === 0) return null

  const currency = priced[0].currency
  const prices = priced.map((o) => o.price)

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: productName,
    description,
    brand: { '@type': 'Brand', name: SITE_NAME },
    category: 'Prepaid mobile data',
    url: absoluteUrl(path, lang),
    offers: {
      '@type': 'AggregateOffer',
      offerCount: priced.length,
      lowPrice: Math.min(...prices).toFixed(2),
      highPrice: Math.max(...prices).toFixed(2),
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      seller: { '@id': `${SITE_URL}/#organization` },
    },
  }
}

export interface QaPair {
  question: string
  answer: string
}

/**
 * The support page's questions, so they can appear expandable in the results.
 *
 * Only valid when the answers are genuinely on the page — Google spot-checks,
 * and a mismatch costs the rich result site-wide rather than on one page.
 */
export function faqLd(pairs: QaPair[]): Record<string, unknown> | null {
  if (pairs.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: pairs.map((p) => ({
      '@type': 'Question',
      name: p.question,
      acceptedAnswer: { '@type': 'Answer', text: p.answer },
    })),
  }
}

export interface ListedDestination {
  name: string
  slug: string
}

/**
 * The catalogue page, as a list Google can read.
 *
 * Without this the destinations page is a wall of links with no stated
 * relationship: a crawler has to infer that these ninety anchors are one
 * collection and that each is a product page. An ItemList says so, and is what
 * lets the page win a carousel rather than a single blue link.
 *
 * Capped, because the markup is repeated in every prerendered file and a list
 * of two hundred inflates every page for no extra benefit — Google reads the
 * first entries and follows the links for the rest.
 */
export function destinationListLd(
  items: ListedDestination[],
  lang: SeoLang,
  limit = 60,
): Record<string, unknown> | null {
  if (items.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: items.length,
    itemListElement: items.slice(0, limit).map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      url: absoluteUrl(`/destinations/${item.slug}`, lang),
    })),
  }
}
