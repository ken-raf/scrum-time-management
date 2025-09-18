import {getRequestConfig} from 'next-intl/server';

// Supported locales
export const locales = ['fr', 'en'] as const;
export const defaultLocale = 'fr';

export default getRequestConfig(async ({locale}) => {
  // Default to French if no locale is provided or invalid
  const currentLocale = locales.includes(locale as any) ? locale : defaultLocale;

  return {
    messages: (await import(`../messages/${currentLocale}.json`)).default
  };
});