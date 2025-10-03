import type { ReactElement } from 'react';
import type { Copy } from '@shared/constants/i18n';

type AboutPageProps = {
  copy: Copy;
};

export const AboutPage = ({ copy }: AboutPageProps): ReactElement => (
  <section className="py-12 px-6 font-sans">
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Main Title */}
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
        {copy.aboutTitle}
      </h1>

      {/* Introduction */}
      <div className="space-y-4">
        {copy.aboutIntro.split('\n').map((paragraph, index) => (
          <p key={index} className="text-base leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Disclaimer Section */}
      <div className="space-y-4">
        <div className="rounded-xl border surface-border bg-[var(--color-surface)]/70 px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-subtle mb-3">
            {copy.aboutDisclaimerTitle}
          </h2>
          <div className="space-y-2">
            {copy.aboutDisclaimer.split('\n').map((paragraph, index) => (
              <p key={index} className="text-base leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Gratitude Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {copy.aboutGratitudeTitle}
        </h2>
        {copy.aboutGratitude.split('\n\n').map((paragraph, index) => (
          <p key={index} className="text-base leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Vision Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {copy.aboutVisionTitle}
        </h2>
        <p className="text-base leading-relaxed">
          {copy.aboutVision}
        </p>
      </div>
    </div>
  </section>
);
