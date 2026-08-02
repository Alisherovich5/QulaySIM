/**
 * Where the SEO story starts: one language per URL.
 *
 * The site speaks three languages but, until now, served them all from the same
 * address — the choice lived in localStorage. That is invisible to a search
 * engine: there is no Russian page to rank, because there is no Russian URL. A
 * Russian-speaking customer in Tashkent searching «eSIM Турция» could not find
 * us, and no amount of tag-writing would change that.
 *
 * So Uzbek keeps the bare paths and the other two get a path prefix:
 *
 *     /destinations/turkiye        uz
 *     /ru/destinations/turkiye     ru
 *     /en/destinations/turkiye     en
 *
 * A prefix rather than `?lang=ru` because a query string cannot be a file. The
 * build prerenders one HTML file per URL, and nginx can serve `/ru/…` from
 * disk; it could never serve two different files for the same path with
 * different query strings. Telegram and Yandex — neither of which runs our
 * JavaScript — would have gone on seeing the Uzbek page whatever the parameter
 * said.
 *
 * Nothing here may import i18n: this module runs before i18n is configured, and
 * is what tells it which language to start in.
 */

export const SITE_URL = 'https://qulaysim.uz'
export const SITE_NAME = 'QulaySIM'
export const OG_IMAGE = `${SITE_URL}/og-card.png`

export const SEO_LANGS = ['uz', 'ru', 'en'] as const
export type SeoLang = (typeof SEO_LANGS)[number]

/** Uzbek is served from the root, so its pages carry no prefix. */
export const DEFAULT_LANG: SeoLang = 'uz'

/** The languages that do get one. */
export const PREFIXED_LANGS = SEO_LANGS.filter((l) => l !== DEFAULT_LANG)

/** og:locale wants a full locale; Telegram and Facebook both read it. */
export const OG_LOCALE: Record<SeoLang, string> = {
  uz: 'uz_UZ',
  ru: 'ru_RU',
  en: 'en_US',
}

function isSeoLang(value: string): value is SeoLang {
  return (SEO_LANGS as readonly string[]).includes(value)
}

/**
 * The language a path is asking for, from its first segment.
 *
 * Only an exact `/ru` or `/ru/…` counts. A destination that happened to be
 * slugged `ru-something` must not be mistaken for a language prefix.
 */
export function langFromPath(pathname: string): SeoLang {
  const first = pathname.split('/')[1] ?? ''
  return isSeoLang(first) && first !== DEFAULT_LANG ? first : DEFAULT_LANG
}

/**
 * The router basename for a language.
 *
 * This is the whole trick that keeps the change small. Given a basename, every
 * `<Link to="/support">` in the app resolves to `/ru/support` on its own and
 * every route matches with the prefix stripped — so the route table and several
 * hundred existing links need no edits at all.
 */
export function basenameFor(lang: SeoLang): string {
  return lang === DEFAULT_LANG ? '/' : `/${lang}`
}

/** A path with any language prefix removed, always starting with `/`. */
export function stripLangPrefix(pathname: string): string {
  const lang = langFromPath(pathname)
  if (lang === DEFAULT_LANG) return pathname || '/'
  const rest = pathname.slice(lang.length + 1)
  return rest.startsWith('/') ? rest : `/${rest}`
}

/** The same page in another language, as a path. */
export function pathForLang(pathname: string, lang: SeoLang): string {
  const bare = stripLangPrefix(pathname)
  if (lang === DEFAULT_LANG) return bare
  return bare === '/' ? `/${lang}` : `/${lang}${bare}`
}

/**
 * The absolute, canonical address of a page in one language.
 *
 * Trailing slashes are stripped everywhere except the root, so that the
 * canonical we advertise is byte-identical to the `<loc>` in the sitemap and to
 * the href in every hreflang tag. Search engines treat `/support` and
 * `/support/` as two URLs; disagreeing with ourselves about which one is real
 * is how a site ends up competing against itself.
 */
export function absoluteUrl(pathname: string, lang: SeoLang): string {
  const path = pathForLang(pathname, lang)
  // The home page keeps its slash. Dropping it produced "https://qulaysim.uz"
  // in the canonical while the sitemap advertised "https://qulaysim.uz/" — two
  // spellings of the front page, which is the disagreement the rest of this
  // function exists to avoid. Everything else has its trailing slash removed.
  if (path === '/') return `${SITE_URL}/`
  return `${SITE_URL}${path.replace(/\/+$/, '')}`
}

export interface Alternate {
  lang: SeoLang
  href: string
}

/**
 * Every language edition of a page, plus x-default.
 *
 * Google wants the set to be complete and reciprocal: each edition must list
 * all of them, itself included. A page that only points at its translations —
 * and not back at itself — is a set Google discards entirely.
 */
export function alternatesFor(pathname: string): Alternate[] {
  return SEO_LANGS.map((lang) => ({ lang, href: absoluteUrl(pathname, lang) }))
}

/**
 * The edition served to a searcher whose language we do not publish.
 *
 * Uzbek, because the audience is in Uzbekistan — not English, which is the
 * reflex here and would be the wrong answer for almost every visitor.
 */
export function xDefaultFor(pathname: string): string {
  return absoluteUrl(pathname, DEFAULT_LANG)
}
