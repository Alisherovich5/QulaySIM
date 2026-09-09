import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import { setApiLanguage } from '../lib/api'
import { DEFAULT_LANG, langFromPath } from '../lib/seo'
import en from './locales/en'
import { ESIM_STATUS_COPY } from './locales/esim-status'
import ru from './locales/ru'
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
const pathLang = typeof window === 'undefined' ? DEFAULT_LANG : langFromPath(window.location.pathname)

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    ...(pathLang === DEFAULT_LANG ? {} : { lng: pathLang }),
    resources: {
      // eSIM holati matnlari alohida modulda -- sababi o'sha faylning
      // boshida yozilgan.
      en: { translation: { ...en, ...ESIM_STATUS_COPY.en } },
      ru: { translation: { ...ru, ...ESIM_STATUS_COPY.ru } },
      uz: { translation: { ...uz, ...ESIM_STATUS_COPY.uz } },
    },
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
