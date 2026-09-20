import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import { setApiLanguage } from '../lib/api'
import { DEFAULT_LANG, langFromPath } from '../lib/seo'
import { CART_BAR_COPY } from './locales/cart-bar'
import { DESTINATIONS_PAGE_COPY } from './locales/destinations-page'
import { DEVICE_CHECK_COPY } from './locales/device-check'
import { ESIM_STATUS_COPY } from './locales/esim-status'
import uz from './locales/uz'

export const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha", short: 'UZ', flag: 'uz' },
  { code: 'ru', label: 'Русский', short: 'RU', flag: 'ru' },
  { code: 'en', label: 'English', short: 'EN', flag: 'gb' },
] as const

/**
 * A language prefix in the address is a decision, not a hint.
 *
 * /ru/support has to render Russian for everyone — including a visitor whose
 * localStorage still says Uzbek from a previous session, and including
 * Googlebot, which has no storage at all and would otherwise index three
 * identical Uzbek pages under three URLs. The stored preference still decides
 * the unprefixed pages, so a returning customer is not thrown back to Uzbek on
 * the home page.
 */
type Lang = 'uz' | 'ru' | 'en'

/** One language's strings: the big file plus the per-feature ones that are kept
 *  beside the components they belong to. */
function bundleFor(lang: Lang, main: Record<string, unknown>) {
  return {
    ...main,
    // eSIM holati matnlari alohida modulda -- sababi o'sha faylning
    // boshida yozilgan.
    ...ESIM_STATUS_COPY[lang],
    ...DEVICE_CHECK_COPY[lang],
    ...DESTINATIONS_PAGE_COPY[lang],
    ...CART_BAR_COPY[lang],
  }
}

/**
 * Russian and English arrive when they are asked for, not before.
 *
 * All three locale files used to be in the entry bundle: ru 70.6 kB, uz 50.6,
 * en 45.8. A visitor reading Uzbek — which is most of them, and every
 * unprefixed URL — downloaded 116 kB of Russian and English they would never
 * see. Uzbek stays static because it is the default and because the first paint
 * must not wait on a request; the other two are one dynamic import each.
 *
 * Awaited before the app mounts (main.tsx), so a /ru or /en visitor never sees
 * a frame of Uzbek before their own language lands.
 */
const LOADERS: Record<string, () => Promise<{ default: Record<string, unknown> }>> = {
  ru: () => import('./locales/ru'),
  en: () => import('./locales/en'),
}

export async function ensureLanguage(lng: string | undefined): Promise<void> {
  const base = (lng || DEFAULT_LANG).split('-')[0] as Lang
  if (base === DEFAULT_LANG || i18n.hasResourceBundle(base, 'translation')) return
  const load = LOADERS[base]
  if (!load) return
  try {
    const mod = await load()
    i18n.addResourceBundle(base, 'translation', bundleFor(base, mod.default), true, true)
    // The bundle landed after i18next had already resolved this language to the
    // fallback, so the tree has to be told there is something new to read.
    if (i18n.language.split('-')[0] === base) await i18n.changeLanguage(lng)
  } catch {
    /* Offline or a failed chunk: the Uzbek fallback is already rendering, which
       is a worse page than the visitor asked for but still a working one. */
  }
}

const pathLang = typeof window === 'undefined' ? DEFAULT_LANG : langFromPath(window.location.pathname)

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    ...(pathLang === DEFAULT_LANG ? {} : { lng: pathLang }),
    // Only Uzbek is in the bundle. Russian and English are fetched by
    // `ensureLanguage` below — see the note there for the number that decided
    // it.
    resources: { uz: { translation: bundleFor('uz', uz) } },
    // Uzbek, because the unprefixed URLs are the Uzbek edition and the audience
    // is in Uzbekistan. It used to be English, which meant a missing key showed
    // English text on a page that had told search engines it was Uzbek.
    fallbackLng: DEFAULT_LANG,
    supportedLngs: ['uz', 'ru', 'en'],
    interpolation: { escapeValue: false },
    detection: {
      // `navigator` was deliberately removed. With it, an unprefixed URL —
      // which is the *Uzbek* edition, and says so in its own hreflang tags —
      // rendered in whatever language the browser happened to ask for. That was
      // measurable: with an en-US browser, "/" served English text under an
      // Uzbek canonical, and Googlebot browses as en-US. hreflang describes a
      // set of URLs that each serve one language; a URL that serves whatever
      // the visitor's browser prefers makes the whole set a lie, and Google
      // discards sets it cannot verify.
      //
      // A stored choice still wins on unprefixed URLs, so a returning customer
      // keeps their language. Crawlers have no storage, so they always get the
      // Uzbek the tags promise.
      order: ['localStorage'],
      lookupLocalStorage: 'fastsim_lang',
      caches: ['localStorage'],
    },
  })

export default i18n

// Keep <html lang> in step with the active language. The served value is `uz`
// for crawlers that never run this; a visitor who switches language should not
// be left with a document that claims to be in another one — screen readers
// pick their pronunciation from it.
i18n.on('languageChanged', (lng) => {
  // In-app switch without a reload: the strings may not be here yet.
  void ensureLanguage(lng)
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng.split('-')[0]
  }
  // The API localises country, region and plan names itself, so it has to be
  // told too — otherwise the interface switches language and the catalogue
  // does not.
  setApiLanguage(lng)
})

// The detector has already run by this point, so the first request carries the
// stored choice rather than the default.
setApiLanguage(i18n.language || 'uz')
