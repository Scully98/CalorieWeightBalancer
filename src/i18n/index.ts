// Hermes has no Intl.PluralRules; i18next needs it for _one/_other keys.
import 'intl-pluralrules';

import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { de } from './locales/de';
import { en } from './locales/en';

export type Language = 'de' | 'en';

function deviceLanguage(): Language {
  return getLocales()[0]?.languageCode === 'de' ? 'de' : 'en';
}

export const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources: { de: { translation: de }, en: { translation: en } },
  lng: deviceLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['de', 'en'],
  interpolation: { escapeValue: false },
  initAsync: false,
});

// Locale tag for Intl number and date formatting, following the app language.
export function formatLocale(): string {
  return i18n.language === 'de' ? 'de-DE' : 'en-US';
}
