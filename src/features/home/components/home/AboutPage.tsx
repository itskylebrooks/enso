import type { Copy } from '@shared/constants/i18n';
import type { ReactElement } from 'react';

const authorPhotoUrl = '/images/Lehrgang-November-2025.jpeg';

type AboutPageProps = {
  copy: Copy;
};

export const AboutPage = ({ copy }: AboutPageProps): ReactElement => {
  const renderParagraphs = (text: string) =>
    text.split('\n').map((paragraph, index) => (
      <p key={index} className="text-base leading-relaxed">
        {paragraph}
      </p>
    ));

  const renderPrivacyParagraphs = (text: string) =>
    text.split('\n').map((paragraph, index) => {
      if (!paragraph.includes('GitHub')) {
        return (
          <p key={index} className="text-base leading-relaxed">
            {paragraph}
          </p>
        );
      }

      const parts = paragraph.split('GitHub');
      const repoUrl = 'https://github.com/itskylebrooks/enso';

      return (
        <p key={index} className="text-base leading-relaxed">
          {parts[0]}
          <a href={repoUrl} target="_blank" rel="noreferrer noopener" className="underline">
            GitHub
          </a>
          {parts[1] ?? ''}
        </p>
      );
    });

  return (
    <section className="pt-0 pb-12 font-sans">
      <div className="container max-w-4xl mx-auto px-4 md:px-6 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
            {copy.aboutTitle}
          </h1>
          <p className="text-base md:text-lg text-subtle text-center">{copy.homeIdentityTagline}</p>
        </header>

        <div className="space-y-4">{renderParagraphs(copy.aboutIntro)}</div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.aboutFeaturesTitle}</h2>
          {renderParagraphs(copy.aboutFeaturesBody)}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.aboutDisclaimerTitle}</h2>
          {renderParagraphs(copy.aboutDisclaimer)}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.aboutPrivacyTitle}</h2>
          {renderPrivacyParagraphs(copy.aboutPrivacyBody)}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.aboutTechTitle}</h2>
          {renderParagraphs(copy.aboutTechBody)}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.aboutVisionTitle}</h2>
          {renderParagraphs(copy.aboutVision)}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.aboutAuthorTitle}</h2>
          <div className="space-y-2">
            <p className="text-base leading-relaxed">{copy.aboutAuthorPart1}</p>
            <p className="text-base leading-relaxed">{copy.aboutAuthorPart2}</p>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.aboutGratitudeTitle}</h2>
          {renderParagraphs(copy.aboutGratitudeBody)}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.aboutPhotoTitle}</h2>
          <div className="mb-4">
            <img
              src={authorPhotoUrl}
              alt="Kyle Brooks — Aikidō Lehrgang, November 2025"
              className="w-full max-w-md md:max-w-lg h-auto rounded-lg object-cover mx-auto"
            />
          </div>
          {renderParagraphs(copy.aboutPhotoBody)}
        </div>
      </div>
    </section>
  );
};
