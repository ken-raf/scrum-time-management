import enMessages from '@/messages/en.json';
import frMessages from '@/messages/fr.json';

export const messagesMap = {
  en: enMessages,
  fr: frMessages,
} as const;

export type Locale = keyof typeof messagesMap;

export function getMessages(locale: Locale) {
  return messagesMap[locale] || messagesMap.fr; // fallback to French (default)
}