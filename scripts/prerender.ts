/**
 * Bake one real HTML file per URL, per language, at build time.
 *
 * The site is a client-rendered SPA, which is fine for people and survivable
 * for Google — but the crawlers that matter most here do not run JavaScript at
 * all. Telegram and WhatsApp build their link previews from the raw HTML, and
 * this audience shares links on Telegram constantly; Yandex, which a large part
 * of the Russian-speaking market in Uzbekistan uses, renders JS late and badly.
 * To all of them, every URL on the site was the same empty shell with the same
 * title. A shared link to a Turkey plan previewed as the home page.
 *
 * So after Vite writes dist/, this walks the catalogue and writes:
 *
 *     dist/index.html                            uz  /
 *     dist/ru/index.html                         ru  /ru
 *     dist/destinations/turkiye/index.html       uz  /destinations/turkiye
 *     dist/ru/destinations/turkiye/index.html    ru  /ru/destinations/turkiye
 *
 * Each with its own title, description, canonical, hreflang set, Open Graph
 * card and structured data. The body is still the same empty shell — this buys
 * correct metadata everywhere, not server rendering — but metadata is the whole
 * of what a link preview shows and most of what a crawler needs to file a page
 * under the right query.
 *
 * The catalogue comes from the live API rather than a checked-in list, because
 * a list in the repository is wrong the first time someone adds a country in
 * the admin. If the API cannot be reached the static routes are still written
 * and the build succeeds with a warning: shipping a release with slightly stale
 * destination pages beats not shipping one.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Plugin } from 'vite'

import en from '../src/i18n/locales/en'
import ru from '../src/i18n/locales/ru'
import uz from '../src/i18n/locales/uz'
import {
  absoluteUrl,
  alternatesFor,
  OG_IMAGE,
  OG_LOCALE,
  pathForLang,
  SEO_LANGS,
  SITE_NAME,
  SITE_URL,
  xDefaultFor,
  type SeoLang,
} from '../src/lib/seo'
import {
  breadcrumbLd,
  destinationLd,
  faqLd,
  organisationLd,
  webSiteLd,
} from '../src/lib/structured-data'
import {
  descriptionParams,
  factsFor,
  interpolate,
  type DestinationFacts,
} from '../src/lib/destination-facts'
import type { Plan } from '../src/lib/types'

/** The same locale objects the app uses, so the copy cannot drift. */
const STRINGS: Record<SeoLang, typeof en> = { uz: uz as typeof en, ru: ru as typeof en, en }

/** Where the marker in index.html sits. */
const MARKER = '<!--seo-->'

/** Slugs are language-independent; this is just which catalogue to read them from. */
const DEFAULT_FACTS_LANG: SeoLang = 'uz'

/**
 * Where the CI workflow drops a catalogue snapshot before the image builds.
 *
 * The first CI build proved the direct route does not work: fetches from
 * inside BuildKit to qulaysim.uz failed on every attempt — GitHub's Azure
 * runners reach the Uzbek hosting range unreliably, and errors inside a build
 * step are all but undebuggable. So the workflow now curls the catalogue on
 * the runner itself, where a failure produces a readable log, and the build
 * reads these files instead of the network. The live fetch below survives
 * only as the fallback for local builds, where it does work.
 */
const SNAPSHOT_DIR = process.env.PRERENDER_SNAPSHOT || 'prerender-snapshot'

async function readSnapshot<T>(file: string): Promise<T | null> {
  const path = join(SNAPSHOT_DIR, file)
  if (!existsSync(path)) return null
  return JSON.parse(await readFile(path, 'utf8')) as T
}

interface ApiCountry {
  name: string
  slug: string
  iso2?: string
  starting_price: number | null
  region: { name: string; slug: string } | null
}

/**
 * The plan-derived facts for one destination, keyed by slug.
 *
 * Fetched once rather than once per language: the plan count, prices, validity
 * and network names are the same numbers whatever language the page is in —
 * only the country's name is translated. Twenty-five detail requests instead of
 * seventy-five.
 */
type FactsBySlug = Map<string, DestinationFacts>

/** Static routes, and the sitemap priority each is worth. */
const STATIC_ROUTES = [
  '/',
  '/destinations',
  // Missing until now, which meant the worldwide page had no prerendered head
  // and no baked plans: no title for a crawler, and an empty grid for anyone
  // whose request was lost on the way.
  '/global',
  '/device-check',
  '/support',
  '/esim-nima',
  '/esim-ornatish',
  '/oferta',
  '/qaytarish',
  '/maxfiylik',
] as const

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** JSON-LD sits in an HTML script element, so it must not be able to close it. */
function escapeJson(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

interface PageMeta {
  title: string
  description: string
  path: string
  lang: SeoLang
  jsonLd: Array<Record<string, unknown> | null>
  /** og:image override. Only destinations set one — see metaForCountry. */
  image?: string
  /**
   * Data baked into the page for the first render.
   *
   * The measured problem: from Tashkent one API request costs ~350 ms of
   * network, and the app could not ask for anything until the JS had loaded and
   * run. So a visitor watched an empty tariff grid for roughly a second before
   * the first price appeared. This carries the answer with the page, so the
   * first render has prices already and the network request becomes a
   * background refresh rather than a wait.
   */
  boot?: Record<string, unknown>
}

/**
 * Stamped on every tag written here.
 *
 * React 19 appends its hoisted head tags rather than replacing what the
 * document already had, so once the app mounts a prerendered page carries two
 * of everything. <Seo> removes anything wearing this attribute as soon as it
 * has rendered the live equivalents — see the note there. Without the marker
 * there is no way to tell the build's tags from React's.
 */
const BAKED = ' data-prerendered'

/**
 * The baked data, as a JSON data block rather than executable script.
 *
 * `type="application/json"` is not run by the browser and is not governed by
 * script-src, so this needs no CSP exception — the alternative, assigning to a
 * global from an inline script, would have required 'unsafe-inline' on every
 * page and traded a second of latency for a permanent hole.
 */
function bootFor({ boot }: PageMeta): string {
  if (!boot) return ''
  return `\n    <script type="application/json" id="__DATA__">${escapeJson(boot)}</script>`
}

function headFor({ title, description, path, lang, jsonLd, image }: PageMeta): string {
  const full = `${title} | ${SITE_NAME}`
  const canonical = absoluteUrl(path, lang)
  const card = image ?? OG_IMAGE
  const tags: string[] = [
    `<title${BAKED}>${escapeAttr(full)}</title>`,
    `<meta name="description" content="${escapeAttr(description)}"${BAKED} />`,
    `<link rel="canonical" href="${canonical}"${BAKED} />`,
  ]
  for (const alt of alternatesFor(path)) {
    tags.push(`<link rel="alternate" hreflang="${alt.lang}" href="${alt.href}"${BAKED} />`)
  }
  tags.push(`<link rel="alternate" hreflang="x-default" href="${xDefaultFor(path)}"${BAKED} />`)
  tags.push(
    `<meta property="og:type" content="website"${BAKED} />`,
    `<meta property="og:site_name" content="${SITE_NAME}"${BAKED} />`,
    `<meta property="og:title" content="${escapeAttr(full)}"${BAKED} />`,
    `<meta property="og:description" content="${escapeAttr(description)}"${BAKED} />`,
    `<meta property="og:url" content="${canonical}"${BAKED} />`,
    `<meta property="og:image" content="${card}"${BAKED} />`,
    `<meta property="og:image:width" content="1200"${BAKED} />`,
    `<meta property="og:image:height" content="630"${BAKED} />`,
    `<meta property="og:locale" content="${OG_LOCALE[lang]}"${BAKED} />`,
    `<meta name="twitter:card" content="summary_large_image"${BAKED} />`,
    `<meta name="twitter:title" content="${escapeAttr(full)}"${BAKED} />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}"${BAKED} />`,
    `<meta name="twitter:image" content="${card}"${BAKED} />`,
  )
  for (const block of jsonLd) {
    if (block) tags.push(`<script type="application/ld+json"${BAKED}>${escapeJson(block)}</script>`)
  }
  return tags.join('\n    ')
}

/**
 * The catalogue in one language.
 *
 * Names are localised by the API from the Accept-Language header, which is why
 * this is fetched once per language rather than translated here — the Russian
 * name of a country is admin-managed data, not a string in this repository.
 */
/** The worldwide plans, for the two pages that sell them.
 *
 * Baked for the same reason the destination pages are: without it, a visitor
 * whose request is lost — and on this route requests are lost in bursts — reads
 * a page with a headline about worldwide coverage and an empty grid under it.
 * Fetched once rather than per language: the numbers are the same and the plan
 * titles come from the admin in one language anyway.
 */
async function fetchGlobalPlans(apiBase: string): Promise<Record<string, unknown> | null> {
  const snapshot = await readSnapshot<Record<string, unknown>>("global.json")
  if (snapshot) return snapshot
  const res = await fetch(`${apiBase}/regions/global`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return (await res.json()) as Record<string, unknown>
}

async function fetchCatalogue(apiBase: string, lang: SeoLang): Promise<ApiCountry[]> {
  const snapshot = await readSnapshot<ApiCountry[]>(`countries.${lang}.json`)
  if (snapshot) return snapshot
  const res = await fetch(`${apiBase}/countries`, {
    headers: { 'Accept-Language': lang, Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const body = (await res.json()) as ApiCountry[]
  if (!Array.isArray(body)) throw new Error('unexpected payload')
  return body
}

/**
 * The plans behind one destination, for the facts in its description.
 *
 * Language does not matter here — only the numbers are used — so this runs once
 * per country rather than once per country per language.
 */
/** The detail body and the facts derived from it.
 *
 * The raw body is kept now as well: the facts feed the description sentence,
 * and the plans themselves are baked into the page so the first render shows
 * prices without waiting ~350 ms for the network.
 */
interface Detail {
  /** Null when the destination has no sellable plan — the page then falls back
   *  to the generic description, exactly as before. */
  facts: DestinationFacts | null
  body: Record<string, unknown>
}

async function fetchFacts(apiBase: string, slug: string): Promise<Detail | null> {
  const snapshot = await readSnapshot<{ plans?: Plan[] }>(`detail/${slug}.json`)
  if (snapshot) return { facts: factsFor(snapshot.plans ?? []), body: snapshot as Record<string, unknown> }
  const res = await fetch(`${apiBase}/countries/${slug}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  const body = (await res.json()) as { plans?: Plan[] }
  return { facts: factsFor(body.plans ?? []), body: body as Record<string, unknown> }
}

/** Run `jobs` with a ceiling on how many are in flight, so a large catalogue
 *  does not open two hundred sockets at once against the production API. */
async function withConcurrency<T>(jobs: (() => Promise<T>)[], limit: number): Promise<T[]> {
  const results: T[] = new Array(jobs.length)
  let next = 0
  await Promise.all(
    Array.from({ length: Math.min(limit, jobs.length) }, async () => {
      for (let i = next++; i < jobs.length; i = next++) results[i] = await jobs[i]()
    }),
  )
  return results
}

function guideFaqLd(faqs: { q: string; a: string }[]): Record<string, unknown> | null {
  return faqLd(faqs.map((f) => ({ question: f.q, answer: f.a })))
}

function metaForStaticRoute(route: string, lang: SeoLang): PageMeta {
  const s = STRINGS[lang].seo
  const base = { path: route, lang }
  switch (route) {
    case '/destinations':
      return { ...base, title: s.destinationsTitle, description: s.destinationsDescription, jsonLd: [] }
    case '/global':
      return { ...base, title: s.globalPageTitle, description: s.globalPageDescription, jsonLd: [] }
    case '/device-check':
      return { ...base, title: s.deviceTitle, description: s.deviceDescription, jsonLd: [] }
    case '/support':
      return { ...base, title: s.supportTitle, description: s.supportDescription, jsonLd: [] }
    // The guides bake their FAQ schema from the same locale arrays the pages
    // render, so what a crawler reads and what a visitor sees cannot diverge.
    case '/esim-nima':
      return {
        ...base,
        title: s.guideWhatTitle,
        description: s.guideWhatDescription,
        jsonLd: [guideFaqLd(STRINGS[lang].guides.what.faqs)],
      }
    case '/oferta':
      return { ...base, title: s.ofertaTitle, description: s.legalDescription, jsonLd: [] }
    case '/qaytarish':
      return { ...base, title: s.refundTitle, description: s.legalDescription, jsonLd: [] }
    case '/maxfiylik':
      return { ...base, title: s.privacyTitle, description: s.legalDescription, jsonLd: [] }
    case '/esim-ornatish':
      return {
        ...base,
        title: s.guideInstallTitle,
        description: s.guideInstallDescription,
        jsonLd: [guideFaqLd(STRINGS[lang].guides.install.faqs)],
      }
    default:
      return {
        ...base,
        title: s.homeTitle,
        description: s.homeDescription,
        jsonLd: [organisationLd(), webSiteLd(lang)],
      }
  }
}

/**
 * One page per region per language, grouped out of the catalogue snapshot.
 *
 * The country payload already carries its region, localised by the same
 * Accept-Language the catalogue was fetched with — so the region tier costs no
 * extra requests, and its names cannot disagree with the pages beneath it.
 */
function regionPages(countries: ApiCountry[], lang: SeoLang): PageMeta[] {
  const s = STRINGS[lang].seo
  const groups = new Map<string, { name: string; members: ApiCountry[] }>()
  for (const c of countries) {
    if (!c.region) continue
    const g = groups.get(c.region.slug) ?? { name: c.region.name, members: [] }
    g.members.push(c)
    groups.set(c.region.slug, g)
  }
  const pages: PageMeta[] = []
  for (const [slug, g] of groups) {
    const prices = g.members
      .map((c) => c.starting_price)
      .filter((v): v is number => v != null && v > 0)
    if (prices.length === 0) continue // nothing to sell — not worth an address yet
    const path = `/destinations/region/${slug}`
    const description = interpolate(s.regionDescriptionRich, {
      region: g.name,
      count: g.members.length,
      price: Math.min(...prices).toFixed(2),
    })
    pages.push({
      path,
      lang,
      title: interpolate(s.regionTitle, { region: g.name }),
      description,
      jsonLd: [
        {
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          numberOfItems: g.members.length,
          itemListElement: g.members.slice(0, 60).map((c, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: c.name,
            url: absoluteUrl(`/destinations/${c.slug}`, lang),
          })),
        },
        breadcrumbLd(
          [
            { name: STRINGS[lang].nav.destinations, path: '/destinations' },
            { name: g.name, path },
          ],
          lang,
        ),
      ],
    })
  }
  return pages
}

function metaForCountry(
  country: ApiCountry,
  lang: SeoLang,
  facts: DestinationFacts | undefined,
): PageMeta {
  const s = STRINGS[lang].seo
  const path = `/destinations/${country.slug}`
  // Must produce the same sentence React does, from the same numbers — a
  // crawler that reads one description in the HTML and sees another after
  // rendering has been given two answers to the same question.
  const description = facts
    ? interpolate(s.countryDescriptionRich, descriptionParams(country.name, facts))
    : s.countryDescription.replace('{{country}}', country.name)
  return {
    path,
    lang,
    // The card the API draws for this destination — name and live entry
    // price — instead of the one generic banner. Same URL for every
    // language: the card is in Uzbek, the audience's shared language.
    image: `${SITE_URL}/api/og/${country.slug}.png`,
    title: s.countryTitle.replace('{{country}}', country.name),
    description,
    jsonLd: [
      // The list endpoint gives only the cheapest plan, so the baked product
      // carries one offer rather than the full range. React fills in the real
      // aggregate once it mounts; a crawler gets a true "from" price either
      // way, which is the number that shows in a result.
      destinationLd(
        s.countryProductName.replace('{{country}}', country.name),
        description,
        path,
        lang,
        [
        { name: country.name, price: country.starting_price ?? 0, currency: 'USD' },
      ]),
      breadcrumbLd(
        [
          { name: STRINGS[lang].nav.destinations, path: '/destinations' },
          { name: country.name, path },
        ],
        lang,
      ),
    ],
  }
}

/** Where on disk a URL path is served from by nginx's `try_files $uri $uri/`. */
function outputFile(outDir: string, path: string, lang: SeoLang): string {
  const url = pathForLang(path, lang)
  return url === '/' ? join(outDir, 'index.html') : join(outDir, url, 'index.html')
}

export function prerender(): Plugin {
  return {
    name: 'qulaysim-prerender',
    apply: 'build',
    // Vite has finished writing dist/ by this point, so index.html exists and
    // its asset hashes are final.
    async closeBundle() {
      const outDir = 'dist'
      const shell = await readFile(join(outDir, 'index.html'), 'utf8')

      if (!shell.includes(MARKER)) {
        this.warn(
          `index.html has no ${MARKER} marker — nothing prerendered. ` +
            'Every page will fall back to whatever React renders on mount, which ' +
            'link previews never see.',
        )
        return
      }

      const apiBase = (process.env.PRERENDER_API_BASE || `${SITE_URL}/api`).replace(/\/+$/, '')

      const catalogues = new Map<SeoLang, ApiCountry[]>()
      for (const lang of SEO_LANGS) {
        try {
          catalogues.set(lang, await fetchCatalogue(apiBase, lang))
        } catch (error) {
          this.warn(
            `catalogue fetch failed for "${lang}" from ${apiBase}: ${(error as Error).message}. ` +
              'Destination pages will not be prerendered in this language.',
          )
        }
      }

      let globalPlans: Record<string, unknown> | null = null
      try {
        globalPlans = await fetchGlobalPlans(apiBase)
      } catch (error) {
        this.warn(
          `worldwide plans unavailable from ${apiBase}: ${(error as Error).message}. ` +
            "The home and worldwide pages will fetch them at runtime.",
        )
      }

      // One detail request per destination, shared across all three languages.
      const slugs = [...new Set((catalogues.get(DEFAULT_FACTS_LANG) ?? []).map((c) => c.slug))]
      const facts: FactsBySlug = new Map()
      const details = new Map<string, Record<string, unknown>>()
      const fetched = await withConcurrency(
        slugs.map((slug) => async () => {
          try {
            return [slug, await fetchFacts(apiBase, slug)] as const
          } catch {
            // A destination whose detail could not be read still gets a page;
            // it just falls back to the plain description template.
            return [slug, null] as const
          }
        }),
        8,
      )
      for (const [slug, f] of fetched) {
        if (!f) continue
        if (f.facts) facts.set(slug, f.facts)
        details.set(slug, f.body)
      }
      if (facts.size < slugs.length) {
        this.warn(
          `plan detail unavailable for ${slugs.length - facts.size} of ${slugs.length} ` +
            'destinations — those pages fall back to the generic description.',
        )
      }

      const pages: PageMeta[] = []
      for (const lang of SEO_LANGS) {
        const catalogue = catalogues.get(lang) ?? []
        for (const route of STATIC_ROUTES) {
          const meta = metaForStaticRoute(route, lang)
          // The destinations index is the one static page whose content is the
          // catalogue, so it is the one that gains from carrying it.
          if (route === '/destinations' && catalogue.length) meta.boot = { countries: catalogue }
          // The home page shows destination cards and the worldwide strip; the
          // worldwide page is nothing but those plans. Both went blank when a
          // request was lost, which is the failure this whole mechanism exists
          // to prevent — they were simply left out the first time.
          if (route === '/' && (catalogue.length || globalPlans)) {
            meta.boot = { countries: catalogue, global: globalPlans ?? undefined }
          }
          if (route === '/global' && globalPlans) meta.boot = { global: globalPlans }
          pages.push(meta)
        }
        pages.push(...regionPages(catalogue, lang))
        for (const country of catalogue) {
          const meta = metaForCountry(country, lang, facts.get(country.slug))
          const detail = details.get(country.slug)
          if (detail) {
            // The numbers come from the shared single-language fetch; the name
            // comes from this language's catalogue, because it is the only
            // translated field on the page's data.
            meta.boot = { country: { ...detail, name: country.name } }
          }
          pages.push(meta)
        }
      }

      await Promise.all(
        pages.map(async (page) => {
          const html = shell
            .replace('<html lang="uz">', `<html lang="${page.lang}">`)
            .replace(MARKER, headFor(page) + bootFor(page))
          const file = outputFile(outDir, page.path, page.lang)
          await mkdir(dirname(file), { recursive: true })
          await writeFile(file, html, 'utf8')
        }),
      )

      /**
       * The shell nginx serves for a URL that was not baked.
       *
       * It carries no SEO tags at all, and that is the point. A country added
       * in the admin after the last build has no file of its own, so it falls
       * back to this — and if the fallback were a copy of the home page, that
       * new destination would serve the home page's canonical and ask Google to
       * drop it, which is precisely the bug this whole change removed. With an
       * empty head, React is the only thing that writes the tags and the page
       * is correct the moment it renders. It gets its own baked file at the
       * next deploy.
       */
      await writeFile(join(outDir, 'fallback.html'), shell.replace(MARKER, ''), 'utf8')

      const countries = pages.length - STATIC_ROUTES.length * SEO_LANGS.length
      this.info(
        `prerendered ${pages.length} pages — ` +
          `${STATIC_ROUTES.length} static and ${countries / SEO_LANGS.length | 0} destinations ` +
          `across ${SEO_LANGS.length} languages`,
      )
    },
  }
}
