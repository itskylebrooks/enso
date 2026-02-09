import App from '../App';
import { headers } from 'next/headers';
import type { Locale } from '../shared/types';

const detectRequestLocale = (acceptLanguage: string | null): Locale => {
  if (!acceptLanguage) return 'en';
  const normalized = acceptLanguage.toLowerCase();
  return normalized.includes('de') ? 'de' : 'en';
};

export default async function HomePage() {
  const requestHeaders = await headers();
  const initialLocale = detectRequestLocale(requestHeaders.get('accept-language'));
  return <App initialLocale={initialLocale} />;
}
