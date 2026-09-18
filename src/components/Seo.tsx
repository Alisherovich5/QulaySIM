import { jsonLdText } from '../lib/structured-data'
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

import type { GeoFacts } from '../lib/geo'
import {
  alternatesFor,
  absoluteUrl,
  langFromPath,
  OG_IMAGE,
  OG_LOCALE,
  SEO_LANGS,
  SITE_NAME,
  xDefaultFor,
  type SeoLang,
} from '../lib/seo'

/**
 * The head of one page.
 *
 * React 19 hoists `<title>`, `<meta>` and `<link>` into `<head>` wherever they
 * are rendered, so this needs no helmet library — but it does mean index.html
 * must not declare the same tags. Two `<title>` elements do not merge; the
 * browser keeps the first, which would be the static one, and every page would
 * go on sharing a single title. index.html was stripped of its SEO tags for
 * exactly this reason.
 *
 * Before this existed, every route served `<title>QulaySIM — sayohat uchun
 * qulay eSIM</title>` and, worse, `<link rel="canonical" href="https://
 * qulaysim.uz/">`. That canonical was not merely unhelpful: it told Google that
 * /destinations/turkiye, /support and /device-check were all the home page, and
 * asked for every one of them to be dropped from the index in its favour. The
 * catalogue was instructing search engines not to list the catalogue.
 */

export interface JsonLd {
  [key: string]: unknown
}

interface Props {
  /** Without the site name — that is appended here so it is never forgotten. */
  title: string
  description: string
  /**
   * Keep it out of the index.
   *
   * For pages that need a session or are a step in a flow: they have no content
   * a searcher could want, and a checkout page in the results is a bad result.
   * robots.txt already disallows crawling them, but a URL that is linked from
   * elsewhere can still be indexed without being crawled — only a meta tag
   * actually removes it, and a crawler has to be allowed in to read the tag.
   */
  noindex?: boolean
  /** Absolute URL. Defaults to the shared card. */
  image?: string
  /** og:type — `website` for most pages, `article` for anything long-form. */
  type?: string
  /** Structured data, already shaped. One object or several. */
  jsonLd?: JsonLd | JsonLd[]
  /**
   * The place this page is about.
   *
   * A catalogue of travel data plans is a geographic product, and every page of
   * it was shipping without a single geographic signal: nothing said that
   * /destinations/turkiye is about Türkiye rather than about a SIM card. The
   * `geo.*` trio and ICBM are the long-standing way to say it, still read by
   * several crawlers and by every tool that builds a map from a site.
   *
   * Left off a page that is about no particular place — the checkout, the
   * account — rather than defaulted to the company's own address, which would
   * claim each of those pages is about Tashkent.
   */
  geo?: GeoFacts
}

export default function Seo({
  title,
  description,
  noindex = false,
  image = OG_IMAGE,
  type = 'website',
  jsonLd,
  geo,
}: Props) {
  const { pathname } = useLocation()

  /**
   * Retire the build's tags once React has rendered its own.
   *
   * React 19 hoists into `<head>`; it does not replace what is already there.
   * So on a prerendered page the baked `<title>` and the rendered one both
   * exist, and measurement showed exactly that: two titles, two canonicals and
   * two descriptions on every page the build had baked. Identical text today,
   * but two canonical tags is a state Google resolves by ignoring both, and the
   * two only stay identical for as long as nothing diverges.
   *
   * This runs inside `<Seo>` deliberately, not once at app start: a route that
   * renders no `<Seo>` — CountryDetail while its plans are still loading — must
   * keep the baked tags, because they are the only correct ones it has. The
   * sweep happens if and only if something has replaced them.
   */
  useEffect(() => {
    for (const node of document.head.querySelectorAll('[data-prerendered]')) {
      node.remove()
    }
  }, [])

  // useLocation gives the path with the router basename already stripped, so on
  // /ru/support it reports /support. The language has to come from the real
  // address bar, and the canonical has to be rebuilt from both.
  const fullPath = typeof window === 'undefined' ? pathname : window.location.pathname
  const lang: SeoLang = langFromPath(fullPath)
  const canonical = absoluteUrl(fullPath, lang)
  const alternates = alternatesFor(fullPath)

  const full = `${title} | ${SITE_NAME}`
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : []

  return (
    <>
      <title>{full}</title>
      <meta name="description" content={description} />

      {/* A page that is not indexed needs no canonical and no alternates —
          they only describe how a page should be indexed, and saying both
          things at once is a contradiction crawlers report as an error. */}
      {noindex ? (
        <meta name="robots" content="noindex, follow" />
      ) : (
        <>
          <link rel="canonical" href={canonical} />
          {alternates.map((alt) => (
            <link key={alt.lang} rel="alternate" hrefLang={alt.lang} href={alt.href} />
          ))}
          <link rel="alternate" hrefLang="x-default" href={xDefaultFor(fullPath)} />
        </>
      )}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={full} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content={OG_LOCALE[lang]} />
      {/* The other two languages of the same page. Facebook and every scraper
          that follows it treat a missing alternate as "this page exists in one
          language", which is the opposite of what the hreflang set above
          says — and the two disagreeing is worse than either alone. */}
      {SEO_LANGS.filter((l) => l !== lang).map((l) => (
        <meta key={l} property="og:locale:alternate" content={OG_LOCALE[l]} />
      ))}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={full} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {geo && (
        <>
          <meta name="geo.region" content={geo.iso2} />
          <meta name="geo.placename" content={geo.name} />
          {/* Two spellings of one fact, because the two tags are read by
              different consumers and neither is a superset of the other.
              Semicolon for geo.position, comma for ICBM — that difference is
              in the specifications, not a typo. */}
          <meta name="geo.position" content={`${geo.lat};${geo.lon}`} />
          <meta name="ICBM" content={`${geo.lat}, ${geo.lon}`} />
        </>
      )}

      {/* Not hoisted by React the way meta and link are, but Google reads
          structured data anywhere in the document, and a JSON-LD block is a
          data block rather than an executable script — so the site's
          `script-src 'self'` does not apply to it. */}
      {blocks.map((block, i) => (
        <script
          // The blocks on a page are a fixed list per route, never reordered.
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdText(block) }}
        />
      ))}
    </>
  )
}
