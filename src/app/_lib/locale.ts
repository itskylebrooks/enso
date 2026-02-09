import { cookies, headers } from 'next/headers';
import type { Locale } from '../../shared/types';

const isLocale = (value: string | undefined): value is Locale => value === 'en' || value === 'de';

export const detectRequestLocale = async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get('enso-locale')?.value;
  if (isLocale(fromCookie)) {
    return fromCookie;
  }

  const requestHeaders = await headers();
  const acceptLanguage = requestHeaders.get('accept-language')?.toLowerCase() ?? '';
  return acceptLanguage.includes('de') ? 'de' : 'en';
};
