import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import en from './en.json';
import es from './es.json';

const resources = {
  en: { translation: en },
  es: { translation: es },
};

const initI18n = async () => {
  const locales = Localization.getLocales();
  const deviceLanguage = locales[0]?.languageCode ?? 'en';

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: deviceLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      supportedLngs: ['en', 'es'],
    });
};

initI18n();

export default i18n;
