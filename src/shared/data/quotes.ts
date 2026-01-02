import type { Locale } from '@shared/types';

export interface Quote {
  quote: string;
  author: string;
}

// Use Vite's import.meta.glob to load quotes at build time
const quotesModules = import.meta.glob('/content/quotes*.json', { eager: true });

const getQuotesForLocale = (locale: Locale): Quote[] => {
  const fileName = locale === 'de' ? '/content/quotes-de.json' : '/content/quotes.json';
  const module = quotesModules[fileName];
  return ((module as Record<string, unknown>)?.default as Quote[]) || [];
};

/**
 * Get a random quote from the quotes collection for the given locale
 */
export function getRandomQuote(locale: Locale = 'en'): Quote {
  const quotes = getQuotesForLocale(locale);
  if (quotes.length === 0) {
    // Fallback quote based on locale
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

/**
 * Get all quotes for the given locale
 */
export function getAllQuotes(locale: Locale = 'en'): Quote[] {
  return getQuotesForLocale(locale);
}
