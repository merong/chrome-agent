import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import ko from './locales/ko.json'
import en from './locales/en.json'

const resources = {
  ko: { translation: ko },
  en: { translation: en }
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'ko', // Default language
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false // React already escapes
  },
  react: {
    useSuspense: false
  }
})

export default i18n

// Helper to get supported languages
export const supportedLanguages = [
  { code: 'ko', name: '한국어' },
  { code: 'en', name: 'English' }
] as const

export type SupportedLanguage = (typeof supportedLanguages)[number]['code']

// Change language function
export function changeLanguage(lang: SupportedLanguage): void {
  i18n.changeLanguage(lang)
}
