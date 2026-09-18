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

import { allGeo, type GeoFacts } from './geo'
import { absoluteUrl, OG_IMAGE, SITE_NAME, SITE_URL, type SeoLang } from './seo'

const LOGO = `${SITE_URL}/qulaysim-logo.svg`

/**
 * Who we are. Emitted once, on the home page.
 *
 * `sameAs` is how Google ties the site to the Telegram and Instagram accounts
 * and treats them as one entity — which is what produces a knowledge panel for
 * a brand name rather than three unrelated results.
 */
/**
 * A JSON-LD block as text that cannot end the script element holding it.
 *
 * `JSON.stringify` escapes what JSON needs and nothing else, so a `<` in the
 * data survives into the output verbatim — and inside
 * `<script type="application/ld+json">` the sequence `</script>` closes the tag
 * no matter what the surrounding quotes say. Everything after it is parsed as
 * markup. The values here are catalogue text: a country name and a description,
 * written in an admin panel and served by the API.
 *
 * `\u003c` is the same character to a JSON parser and inert to an HTML one.
 * U+2028 and U+2029 go with it — legal in JSON, line terminators in JavaScript,
 * and this string is read by both.
 *
 * The build has escaped this since the prerenderer was written; the runtime did
 * not, which meant the baked page was safe and the page React drew over it was
 * not. One function now, used by both.
 */
export function jsonLdText(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

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
    /* Every country the data works in, not the one country the customers are
       in. This was the bare string 'UZ', which described the audience and said
       nothing about the product: a search engine reading it learned that a
       company selling travel data for twenty-five countries serves one. Codes
       only — the coordinates belong on the page that is about a place, not on
       a list of thirty of them. */
    areaServed: allGeo().map((g) => ({
      '@type': 'Country',
      name: g.name,
      identifier: g.iso2,
    })),
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
  /** Where this destination is. Omitted for a country the geo table does not
      cover yet, rather than guessed at. */
  geo?: GeoFacts,
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
    ...(geo ? { areaServed: countryLd(geo) } : {}),
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

/**
 * The place a destination page is about.
 *
 * A `Country` with real coordinates, so the page declares a geography and not
 * only a price. `identifier` carries the ISO 3166-1 alpha-2 code, which is what
 * lets a consumer join this to its own map data instead of matching on a name
 * that is spelled differently in each of our three languages.
 */
export function countryLd(geo: GeoFacts): Record<string, unknown> {
  return {
    '@type': 'Country',
    name: geo.name,
    identifier: geo.iso2,
    alternateName: geo.iso3,
    geo: {
      '@type': 'GeoCoordinates',
      latitude: geo.lat,
      longitude: geo.lon,
    },
    containedInPlace: { '@type': 'Continent', name: geo.continent },
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

/**
 * The install guide, as steps a machine can follow.
 *
 * Google retired the HowTo rich result, which is the usual reason given for
 * dropping the markup — and the wrong one here. The audience that matters for
 * this page is an assistant being asked "how do I install an eSIM on iPhone",
 * and an assistant reading the page benefits from the steps being named as
 * steps rather than inferred from a heading and four paragraphs. It costs a
 * few hundred bytes on one page.
 *
 * The numbering is stripped: the copy reads "1. Settings → Mobile data" because
 * it is printed under a screenshot, and a `HowToStep` that repeats its own
 * position is describing the list rather than the action.
 */
export function howToLd(
  name: string,
  steps: string[],
  { totalTime, description }: { totalTime?: string; description?: string } = {},
): Record<string, unknown> | null {
  const clean = steps.map((s) => s.replace(/^\s*\d+[.)]\s*/, '').trim()).filter(Boolean)
  if (clean.length < 2) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    ...(description ? { description } : {}),
    ...(totalTime ? { totalTime } : {}),
    step: clean.map((text, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: text.length > 70 ? text.slice(0, 67).trimEnd() + '…' : text,
      text,
    })),
  }
}

/**
 * A guide page, said in the vocabulary an assistant files things under.
 *
 * The page already emits FAQPage and HowTo, which describe its *shape*. This
 * says what it is and who stands behind it: an article, in a named language,
 * published by the organisation whose `@id` the rest of the graph already
 * points at, and — the part that matters most for being cited — what it is
 * *about*, linked to the same entity the model already knows.
 *
 * `about.sameAs` is the lever. "eSIM" as a bare string is a token; the same
 * string with its Wikipedia and Wikidata identifiers is a node, and a system
 * deciding whether this page is a relevant answer to "what is an eSIM" is
 * matching nodes. It costs two URLs.
 *
 * Deliberately no `dateModified`. It is on every list of properties that help,
 * and the only value available here is the build time — which would claim the
 * text changed every time anything else in the repo did. Freshness that is not
 * real is the one signal it is worst to fake.
 */
const ESIM_ENTITY = {
  '@type': 'Thing',
  name: 'eSIM',
  sameAs: ['https://en.wikipedia.org/wiki/ESIM', 'https://www.wikidata.org/wiki/Q15096793'],
}

export function guideArticleLd({
  headline,
  description,
  path,
  lang,
}: {
  headline: string
  description: string
  path: string
  lang: SeoLang
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline,
    description,
    inLanguage: lang,
    url: absoluteUrl(path, lang),
    mainEntityOfPage: { '@type': 'WebPage', '@id': absoluteUrl(path, lang) },
    about: ESIM_ENTITY,
    publisher: { '@id': `${SITE_URL}/#organization` },
    image: OG_IMAGE,
  }
}
