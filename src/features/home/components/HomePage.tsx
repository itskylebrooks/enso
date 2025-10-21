import type { ReactElement } from 'react';
import { useState } from 'react';
import type { Copy } from '../../../shared/constants/i18n';
import type { Locale } from '../../../shared/types';
import { Logo, SakuraFlower } from '../../../shared/components';
import { QuoteRotator } from './QuoteRotator';
import { getAllQuotes } from '@shared/data/quotes';

type HomePageProps = {
  copy: Copy;
  locale: Locale;
  onOpenLibrary: () => void;
  onViewBookmarks: () => void;
  onViewGuide: () => void;
  onViewRoadmap: () => void;
  onViewGlossary: () => void;
  onViewAbout: () => void;
};

export const HomePage = ({
  copy,
  locale,
  onOpenLibrary,
  onViewBookmarks,
  onViewGuide,
  onViewRoadmap,
  onViewGlossary,
  onViewAbout,
}: HomePageProps): ReactElement => {
  const quotes = getAllQuotes(locale);
  const [isGratitudeHovered, setIsGratitudeHovered] = useState(false);
  
  return (
    <div className="min-h-dvh font-sans">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24">
        {/* Subtle background watermark */}
        <div
          className="absolute inset-0 opacity-[0.07] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.3) 0%, transparent 70%)',
            backgroundSize: '600px 600px',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
          }}
        />
        
        <div className="container max-w-4xl mx-auto px-4 md:px-6 relative">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <Logo className="w-20 h-20 md:w-24 md:h-24" />
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
              {copy.app}
            </h1>
            <p className="mt-3 text-base md:text-lg text-subtle max-w-xl mx-auto">
              {copy.homeIdentityTagline}
            </p>
            <p className="mt-2 text-xs md:text-sm text-subtle flex items-center justify-center gap-2">
              <span>{copy.homeActiveDevNote}</span>
              <button
                type="button"
                onClick={onViewRoadmap}
                className="underline underline-offset-4 hover:opacity-80 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] rounded"
                aria-label="Open Roadmap"
              >
                {copy.homeActiveDevRoadmapCta}
              </button>
            </p>
          </div>
        </div>
      </section>

      <div className="container max-w-4xl mx-auto px-4 md:px-6 space-y-8 md:space-y-12 pb-16 md:pb-24">
  {/* Quick Guide Card */}
  <section className="rounded-2xl border surface-border surface card-hover-shadow p-6 md:p-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-xs uppercase tracking-widest text-subtle">
                {copy.homeQuickGuideTitle}
              </div>
              <h2 className="text-lg md:text-xl font-semibold">
                {copy.homeQuickGuideSubtitle}
              </h2>
            </div>

            {/* Step Chips */}
            <div className="flex flex-col md:flex-row md:flex-wrap justify-center gap-3 md:gap-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border surface-border px-3 py-1.5 text-sm text-subtle">
                <span className="font-semibold">1</span>
                <span>{copy.homeQuickGuideStep1}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border surface-border px-3 py-1.5 text-sm text-subtle">
                <span className="font-semibold">2</span>
                <span>{copy.homeQuickGuideStep2}</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border surface-border px-3 py-1.5 text-sm text-subtle">
                <span className="font-semibold">3</span>
                <span>{copy.homeQuickGuideStep3}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center mt-6 max-w-2xl mx-auto">
              <button
                type="button"
                onClick={onOpenLibrary}
                className="h-12 px-5 rounded-xl border-2 btn-tonal surface-hover transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] focus:outline-none"
              >
                {copy.library}
              </button>
              <button
                type="button"
                onClick={onViewGuide}
                className="h-12 px-5 rounded-xl border btn-tonal surface-hover transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] focus:outline-none"
              >
                {copy.guide}
              </button>
              <button
                type="button"
                onClick={onViewBookmarks}
                className="h-12 px-5 rounded-xl border btn-tonal surface-hover transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] focus:outline-none"
              >
                {copy.bookmarks}
              </button>
              <button
                type="button"
                onClick={onViewGlossary}
                className="h-12 px-5 rounded-xl border btn-tonal surface-hover transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] focus:outline-none"
              >
                {copy.glossary}
              </button>
              <button
                type="button"
                onClick={onViewAbout}
                className="h-12 px-5 rounded-xl border btn-tonal surface-hover transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] focus:outline-none"
              >
                {copy.aboutLink}
              </button>
            </div>
          </div>
        </section>

        {/* Two Column Cards: Quote & Historical Note */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Random Quote Card */}
          <section className="rounded-2xl border surface-border surface card-hover-shadow p-6 md:p-8">
            <div className="space-y-4">
              <h2 className="text-lg md:text-xl font-semibold">
                {copy.homeQuoteOfMomentTitle}
              </h2>
              <QuoteRotator quotes={quotes} />
            </div>
          </section>

          {/* Historical Note Card */}
          <section className="rounded-2xl border surface-border surface card-hover-shadow p-6 md:p-8">
            <div className="space-y-4">
              <h2 className="text-lg md:text-xl font-semibold">
                {copy.homeHistoricalNoteTitle}
              </h2>
              <div className="space-y-4 text-sm md:text-base leading-6 md:leading-7 text-subtle">
                <p>
                  {copy.homeHistoricalNotePart1}
                </p>
                <p>
                  {copy.homeHistoricalNotePart2}
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Dojo Credit Card */}
        <section 
          className="rounded-2xl border surface-border surface card-hover-shadow p-6 md:p-8 relative overflow-hidden"
          onMouseEnter={() => setIsGratitudeHovered(true)}
          onMouseLeave={() => setIsGratitudeHovered(false)}
        >
          {/* Sakura Flowers Background */}
          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${isGratitudeHovered ? 'opacity-10' : 'opacity-0'}`}>
            {/* Top right sakura */}
            <SakuraFlower 
              className="absolute -top-8 -right-8 w-28 h-28 transition-all duration-500 ease-out"
              style={{
                transform: isGratitudeHovered 
                  ? 'rotate(15deg) scale(1) translate(0, 0)' 
                  : 'rotate(45deg) scale(0.7) translate(10px, 10px)',
              }}
            />
            {/* Top left sakura */}
            <SakuraFlower 
              className="absolute top-8 -left-6 w-20 h-20 transition-all duration-500 delay-100 ease-out"
              style={{
                transform: isGratitudeHovered 
                  ? 'rotate(-20deg) scale(1) translate(0, 0)' 
                  : 'rotate(-50deg) scale(0.6) translate(-8px, 8px)',
              }}
            />
            {/* Bottom right sakura */}
            <SakuraFlower 
              className="absolute -bottom-6 right-12 w-18 h-18 transition-all duration-500 delay-200 ease-out"
              style={{
                transform: isGratitudeHovered 
                  ? 'rotate(30deg) scale(1) translate(0, 0)' 
                  : 'rotate(60deg) scale(0.5) translate(6px, -6px)',
              }}
            />
          </div>

          <div className="space-y-4 relative z-10">
            <h2 className="text-lg md:text-xl font-semibold">
              {copy.homeDojoCreditTitle}
            </h2>
            <div className="space-y-4 text-sm md:text-base leading-6 md:leading-7 text-subtle">
              <p>
                {copy.homeDojoCreditPart1}
              </p>
              <p>
                {copy.homeDojoCreditPart2}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
