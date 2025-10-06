import type { ReactElement } from 'react';
import type { Copy } from '@shared/constants/i18n';

// Import the author photo as a bundled URL so production builds include the asset.
// Vite deprecated `as: 'url'` in favor of `{ query: '?url', import: 'default' }`.
const imageModules = import.meta.glob('/content/*.{jpg,jpeg,png,webp}', { query: '?url', import: 'default', eager: true }) as Record<string, string>;
const authorPhotoUrl = imageModules['/content/Lehrgang-2024-09.jpeg'];

type AboutPageProps = {
  copy: Copy;
};

export const AboutPage = ({ copy }: AboutPageProps): ReactElement => (
  <section className="py-12 px-6 font-sans">
    <div className="max-w-3xl mx-auto space-y-10">
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

      {/* Features Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {copy.aboutFeaturesTitle}
        </h2>
        <ul className="space-y-2 pl-1">
          <li className="text-base leading-relaxed flex items-start">
            <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
            {copy.aboutFeature1}
          </li>
          <li className="text-base leading-relaxed flex items-start">
            <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
            {copy.aboutFeature2}
          </li>
          <li className="text-base leading-relaxed flex items-start">
            <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
            {copy.aboutFeature3}
          </li>
          <li className="text-base leading-relaxed flex items-start">
            <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
            {copy.aboutFeature4}
          </li>
        </ul>
      </div>

      {/* Privacy Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {copy.aboutPrivacyTitle}
        </h2>
        <p className="text-base leading-relaxed">
          {copy.aboutPrivacyIntro}
        </p>
        <ul className="space-y-2 pl-1">
          <li className="text-base leading-relaxed flex items-start">
            <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
            {copy.aboutPrivacy1}
          </li>
          <li className="text-base leading-relaxed flex items-start">
            <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
            {copy.aboutPrivacy2}
          </li>
          <li className="text-base leading-relaxed flex items-start">
            <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
            {copy.aboutPrivacy3}
          </li>
        </ul>
      </div>

      {/* Technical Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {copy.aboutTechTitle}
        </h2>
        <p className="text-base leading-relaxed">
          {copy.aboutTechIntro}
        </p>
        <ul className="space-y-2 pl-1">
          <li className="text-base leading-relaxed flex items-start">
            <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
            {copy.aboutTech1}
          </li>
          <li className="text-base leading-relaxed flex items-start">
            <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
            {copy.aboutTech2}
          </li>
          <li className="text-base leading-relaxed flex items-start">
            <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
            {copy.aboutTech3}
          </li>
          <li className="text-base leading-relaxed flex items-start">
            <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
            {copy.aboutTech4}
          </li>
        </ul>
      </div>

      {/* Disclaimer Section */}
      <div className="space-y-4">
        <div className="rounded-xl border surface-border bg-[var(--color-surface)]/70 px-5 py-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-subtle mb-3">
            {copy.aboutDisclaimerTitle}
          </h2>
          <div className="space-y-2.5">
            {copy.aboutDisclaimer.split('\n').map((paragraph, index) => (
              <p key={index} className="text-base leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* Vision Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {copy.aboutVisionTitle}
        </h2>
        {copy.aboutVision.split('\n').map((paragraph, index) => (
          <p key={index} className="text-base leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Author Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">
          {copy.aboutAuthorTitle}
        </h2>

        {/* Photo centered, but title and text use the page width */}
        <div>
          <div className="mb-4">
            <img
              src={authorPhotoUrl}
              alt="Kyle Brooks — Aikidō Lehrgang, November 2024"
              className="w-full h-auto rounded-lg object-cover"
            />
          </div>

          <div className="space-y-2">
            <p className="text-base leading-relaxed">{copy.aboutAuthorPart1}</p>
            <p className="text-base leading-relaxed">{copy.aboutAuthorPart2}</p>
            <p className="text-base leading-relaxed">{copy.aboutAuthorPart3}</p>
            <p className="text-base leading-relaxed">{copy.aboutAuthorPart4}</p>
          </div>
        </div>
      </div>
    </div>
  </section>
);
