import type { ReactElement } from 'react';
import type { Copy } from '../../../shared/constants/i18n';
import type { Locale } from '../../../shared/types';
import { Logo } from '../../../shared/components';
import { QuoteRotator } from './QuoteRotator';

type HomePageProps = {
  copy: Copy;
  locale: Locale;
  onOpenLibrary: () => void;
  onViewBookmarks: () => void;
  onViewBasics: () => void;
  onViewGlossary: () => void;
  onViewAbout: () => void;
};

const quotes = [
  { text: 'Mind and body were originally one.', author: 'Kōichi Tōhei' },
];

export const HomePage = ({
  copy,
  onOpenLibrary,
  onViewBookmarks,
  onViewBasics,
  onViewGlossary,
  onViewAbout,
}: HomePageProps): ReactElement => {
  return (
    <div className="min-h-screen">
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
              <Logo className="w-20 h-20 md:w-24 md:h-24 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
              {copy.app}
            </h1>
            <p className="mt-3 text-base md:text-lg text-white/70 max-w-xl mx-auto">
              Your personal Aikidō library & study companion.
            </p>
          </div>
        </div>
      </section>

      <div className="container max-w-4xl mx-auto px-4 md:px-6 space-y-8 md:space-y-12 pb-16 md:pb-24">
        {/* Quick Guide Card */}
        <section className="rounded-2xl border border-white/10 bg-white/0 hover:bg-white/[0.02] transition-colors p-6 md:p-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div className="text-xs uppercase tracking-widest text-white/50">
                Quick Guide
              </div>
              <h2 className="text-lg md:text-xl font-semibold text-white">
                3 steps to get started:
              </h2>
            </div>

            {/* Step Chips */}
            <div className="flex flex-col md:flex-row md:flex-wrap justify-center gap-3 md:gap-4 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/80">
                <span className="font-semibold">1</span>
                <span>Explore techniques in Library.</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/80">
                <span className="font-semibold">2</span>
                <span>Save and organize in Bookmarks.</span>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/80">
                <span className="font-semibold">3</span>
                <span>Learn fundamentals in Basics.</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center mt-6 max-w-2xl mx-auto">
              <button
                type="button"
                onClick={onOpenLibrary}
                className="h-12 px-5 rounded-xl border border-white text-white hover:bg-white/[0.03] transition-colors focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-none"
              >
                {copy.library}
              </button>
              <button
                type="button"
                onClick={onViewBasics}
                className="h-12 px-5 rounded-xl border border-white/15 text-white/90 hover:bg-white/[0.03] transition-colors focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-none"
              >
                {copy.basics}
              </button>
              <button
                type="button"
                onClick={onViewBookmarks}
                className="h-12 px-5 rounded-xl border border-white/15 text-white/90 hover:bg-white/[0.03] transition-colors focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-none"
              >
                {copy.bookmarks}
              </button>
              <button
                type="button"
                onClick={onViewGlossary}
                className="h-12 px-5 rounded-xl border border-white/15 text-white/90 hover:bg-white/[0.03] transition-colors focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-none"
              >
                {copy.glossary}
              </button>
              <button
                type="button"
                onClick={onViewAbout}
                className="h-12 px-5 rounded-xl border border-white/15 text-white/90 hover:bg-white/[0.03] transition-colors focus-visible:ring-2 focus-visible:ring-white/60 focus:outline-none"
              >
                {copy.aboutLink}
              </button>
              {/* Settings button intentionally removed from quick guide */}
            </div>
          </div>
        </section>

        {/* Two Column Cards: Spotlight & Historical Note */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Spotlight Card */}
          <section className="rounded-2xl border border-white/10 bg-white/0 hover:bg-white/[0.02] hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] transition-all p-6 md:p-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-xs uppercase tracking-widest text-white/50">
                  Spotlight
                </div>
                <h2 className="text-lg md:text-xl font-semibold text-white">
                  Quote of the day
                </h2>
              </div>
              <QuoteRotator quotes={quotes} />
            </div>
          </section>

          {/* Historical Note Card */}
          <section className="rounded-2xl border border-white/10 bg-white/0 hover:bg-white/[0.02] hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)] transition-all p-6 md:p-8">
            <div className="space-y-4">
              <h2 className="text-lg md:text-xl font-semibold text-white">
                Historical Note
              </h2>
              <div className="space-y-4 text-sm md:text-base leading-6 md:leading-7 text-white/80">
                <p>
                  Aikidō was founded in Japan in the early 20th century by Morihei Ueshiba (1883–1969).
                </p>
                <p>
                  It blends martial tradition with a philosophy of harmony, redirecting force rather than opposing it.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Dojo Credit Card */}
        <section className="rounded-2xl border border-white/10 bg-white/0 hover:bg-white/[0.02] transition-colors p-6 md:p-8">
          <div className="space-y-4">
            <h2 className="text-lg md:text-xl font-semibold text-white">
              Dojo Credit
            </h2>
            <div className="space-y-4 text-sm md:text-base leading-6 md:leading-7 text-white/80">
              <p className="font-medium text-white/90">With gratitude:</p>
              <p>
                To my teachers Markus Möller and Joachim Eiselen, my warm community at WSV (Walddörfer Sportverein), 
                and the BSV (Bramfelder Sportverein), who always welcome me kindly as a guest, especially Karen and 
                Stefan Jakuszeit, and Alfred Haase.
              </p>
              <p>
                Thank you all for inspiring me, for helping me enjoy every training, and for reminding me how Aikidō 
                lets us forget everything else by focusing on harmony.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};