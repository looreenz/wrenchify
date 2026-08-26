import { createI18n } from 'vue-i18n'
import it from './it.json'
import es from './es.json'

export type MessageSchema = typeof it
export type SupportedLocale = 'it' | 'es'

export const i18n = createI18n<[MessageSchema], SupportedLocale, false>({
  legacy: false,
  locale: 'it',
  fallbackLocale: 'it',
  messages: {
    it,
    es
  },
  missing: (locale, key) => {
    console.warn(`[i18n] Missing translation: ${locale}.${key}`)
    return key
  }
})

export function setLocale(locale: SupportedLocale): void {
  i18n.global.locale.value = locale
}
