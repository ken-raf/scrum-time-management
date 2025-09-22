import {getRequestConfig} from 'next-intl/server';

// Supported locales
export const locales = ['fr', 'en'] as const;
export type Locale = typeof locales[number];
export const defaultLocale = 'fr';

export default getRequestConfig(async ({requestLocale}) => {
  // Await the requestLocale
  let locale = await requestLocale;

  // Validate and provide a fallback locale
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'Europe/Paris'
  };
});