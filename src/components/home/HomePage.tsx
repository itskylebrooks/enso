import { useState, useEffect, type ReactElement } from 'react';
import type { Copy } from '../../shared/constants/i18n';
import type { Locale } from '../../shared/types';
import { Logo } from '../../shared/components';
import { getRandomQuote, type Quote } from '../../utils/quotes';

type HomePageProps = {
  copy: Copy;
  locale: Locale;
  onOpenLibrary: () => void;
  onViewBookmarks: () => void;
  onViewBasics: () => void;
  onViewGlossary: () => void;
  onViewAbout: () => void;
  onOpenSettings: () => void;
};

export const HomePage = ({ 
  copy, 
  locale,
  onOpenLibrary, 
  onViewBookmarks, 
  onViewBasics, 
  onViewGlossary, 
  onViewAbout, 
  onOpenSettings 
}: HomePageProps): ReactElement => {
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    setQuote(getRandomQuote(locale));
  }, [locale]);

  return (
    <div className="min-h-screen">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
        {/* Identity Block */}
        <section className="text-center space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Logo className="w-16 h-16 border-[3px]" />
            <h1 className="text-3xl font-semibold tracking-tight">{copy.app}</h1>
          </div>
          <p className="text-lg text-subtle max-w-2xl mx-auto leading-relaxed">
            {copy.homeIdentityTagline}
          </p>
        </section>

        <div className="border-t border-subtle"></div>

        {/* Quick Guide */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-medium">{copy.homeQuickGuideTitle}</h2>
            <p className="text-subtle">{copy.homeQuickGuideSubtitle}</p>
            <ol className="text-left max-w-md mx-auto space-y-2 text-subtle">
              <li>1. {copy.homeQuickGuideStep1}</li>
              <li>2. {copy.homeQuickGuideStep2}</li>
              <li>3. {copy.homeQuickGuideStep3}</li>
            </ol>
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onOpenLibrary}
              className="px-5 py-2.5 rounded-xl border btn-contrast transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              {copy.library}
            </button>
            <button
              type="button"
              onClick={onViewBasics}
              className="px-5 py-2.5 rounded-xl border btn-tonal surface-hover transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              {copy.basics}
            </button>
            <button
              type="button"
              onClick={onViewBookmarks}
              className="px-5 py-2.5 rounded-xl border btn-tonal surface-hover transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              {copy.bookmarks}
            </button>
            <button
              type="button"
              onClick={onViewGlossary}
              className="px-5 py-2.5 rounded-xl border btn-tonal surface-hover transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              {copy.glossary}
            </button>
            <button
              type="button"
              onClick={onViewAbout}
              className="px-5 py-2.5 rounded-xl border btn-tonal surface-hover transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              {copy.aboutLink}
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="px-5 py-2.5 rounded-xl border btn-tonal surface-hover transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
            >
              {copy.settings}
            </button>
          </div>
        </section>

        <div className="border-t border-subtle"></div>

        {/* Spotlight Section */}
        <section className="text-center space-y-4">
          <h2 className="text-xl font-medium">{copy.homeSpotlightTitle}</h2>
          <p className="text-sm text-subtle">{copy.homeSpotlightSubtitle}</p>
          {quote && (
            <blockquote className="max-w-2xl mx-auto space-y-3">
              <p className="text-lg italic leading-relaxed">"{quote.quote}"</p>
              <footer className="text-subtle">— {quote.author}</footer>
            </blockquote>
          )}
        </section>

        <div className="border-t border-subtle"></div>

        {/* Historical Note */}
        <section className="text-center space-y-4">
          <h2 className="text-xl font-medium">{copy.homeHistoricalNoteTitle}</h2>
          <div className="max-w-2xl mx-auto space-y-3 text-subtle leading-relaxed">
            <p>
              {copy.homeHistoricalNotePart1}
            </p>
            <p>
              {copy.homeHistoricalNotePart2}
            </p>
          </div>
        </section>

        <div className="border-t border-subtle"></div>

        {/* Dojo Credit */}
        <section className="text-center space-y-4">
          <h2 className="text-xl font-medium">{copy.homeDojoCreditTitle}</h2>
          <p className="text-sm text-subtle">{copy.homeDojoCreditSubtitle}</p>
          <div className="max-w-3xl mx-auto text-subtle leading-relaxed text-sm space-y-2">
            <p>
              {copy.homeDojoCreditPart1}
            </p>
            <p>
              {copy.homeDojoCreditPart2}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};
