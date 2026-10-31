'use client';

import { useTranslations } from 'next-intl';
import { useLanguage } from './ClientIntlProvider';
import { locales, type Locale } from '@/i18n/request';

export const LanguageSwitcher = () => {
  const t = useTranslations('language');
  const { locale, setLocale } = useLanguage();

  return (
    <div className="seg !flex-nowrap" role="group" aria-label={t('label')}>
      {locales.map((l: Locale) => (
        <button
          key={l}
          type="button"
          aria-pressed={locale === l}
          onClick={() => setLocale(l)}
          title={l === 'fr' ? t('french') : t('english')}
          className="!px-2.5 font-mono uppercase"
        >
          {l}
        </button>
      ))}
    </div>
  );
};
