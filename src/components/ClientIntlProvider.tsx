'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { defaultLocale, locales } from '@/i18n/request';

type Locale = typeof locales[number];

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface ClientIntlProviderProps {
  children: ReactNode;
  initialMessages: AbstractIntlMessages;
  initialLocale?: Locale;
}

export function ClientIntlProvider({
  children,
  initialMessages,
  initialLocale = defaultLocale
}: ClientIntlProviderProps) {
  const [locale, setLocale] = useState<Locale>(() => {
    // Try to get saved locale from localStorage on client
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale');
      if (savedLocale && locales.includes(savedLocale as Locale)) {
        return savedLocale as Locale;
      }
    }
    return initialLocale;
  });
  const [messages, setMessages] = useState(() => {
    // If saved locale differs from initial, we'll need to load different messages
    if (typeof window !== 'undefined') {
      const savedLocale = localStorage.getItem('locale');
      if (savedLocale && locales.includes(savedLocale as Locale) && savedLocale !== initialLocale) {
        // Messages will be loaded in useEffect
        return initialMessages;
      }
    }
    return initialMessages;
  });

  useEffect(() => {
    // Load messages when locale changes or on initial load if locale differs from initial
    if (locale !== initialLocale || (typeof window !== 'undefined' && localStorage.getItem('locale') !== initialLocale)) {
      import(`../messages/${locale}.json`)
        .then((module) => {
          setMessages(module.default);
        })
        .catch((error) => {
          console.error('Failed to load messages for locale:', locale, error);
          // Fallback to default locale
          setLocale(defaultLocale);
        });
    }
  }, [locale, initialLocale]);

  // Save locale to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('locale', locale);
    }
  }, [locale]);

  const contextValue: LanguageContextType = {
    locale,
    setLocale,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a ClientIntlProvider');
  }
  return context;
}