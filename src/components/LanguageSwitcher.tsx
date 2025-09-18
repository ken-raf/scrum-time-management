'use client';

import { useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';
import { useLanguage } from './ClientIntlProvider';
import { locales, type Locale } from '@/i18n/request';

export const LanguageSwitcher = () => {
  const t = useTranslations('language');
  const { locale, setLocale } = useLanguage();

  const switchLanguage = (newLocale: string) => {
    if (locales.includes(newLocale as Locale)) {
      setLocale(newLocale as Locale);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Globe size={16} className="text-gray-600" />
      <select
        value={locale}
        onChange={(e) => switchLanguage(e.target.value)}
        className="bg-white border border-gray-300 rounded-lg px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
      >
        <option value="fr">{t('french')}</option>
        <option value="en">{t('english')}</option>
      </select>
    </div>
  );
};