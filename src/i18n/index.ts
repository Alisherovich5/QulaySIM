import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import { setApiLanguage } from '../lib/api'
import en from './locales/en'
import ru from './locales/ru'
import uz from './locales/uz'

export const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha", short: 'UZ', flag: 'uz' },
  { code: 'ru', label: 'Русский', short: 'RU', flag: 'ru' },
  { code: 'en', label: 'English', short: 'EN', flag: 'gb' },
] as const

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      uz: { translation: uz },
    },
    fallbackLng: 'en',
    supportedLngs: ['uz', 'ru', 'en'],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
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
