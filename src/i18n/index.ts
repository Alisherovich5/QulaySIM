import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

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
