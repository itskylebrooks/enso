import quotesDe from '@generated/content/quotes-de.json';
import quotesEn from '@generated/content/quotes-en.json';
import type { Locale } from '@shared/types';

export interface Quote {
  quote: string;
  author: string;
}

const getQuotesForLocale = (locale: Locale): Quote[] =>
  locale === 'de' ? (quotesDe as Quote[]) : (quotesEn as Quote[]);

export function getRandomQuote(locale: Locale = 'en'): Quote {
  const quotes = getQuotesForLocale(locale);
  if (quotes.length === 0) {
    return locale === 'de'
      ? {
          quote: 'Der wahre Sieg ist der Sieg über sich selbst.',
          author: 'Morihei Ueshiba',
        }
      : {
          quote: 'True victory is victory over oneself.',
          author: 'Morihei Ueshiba',
        };
  }
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
}

export function getAllQuotes(locale: Locale = 'en'): Quote[] {
  return getQuotesForLocale(locale);
}
