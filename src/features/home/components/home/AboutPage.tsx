import type { ReactElement, MouseEvent } from 'react';
import { useEffect, useState } from 'react';
import type { Copy } from '@shared/constants/i18n';
import { SakuraFlower } from '@shared/components';
import { classNames } from '@shared/utils/classNames';

const authorPhotoUrl = '/images/Lehrgang-2024-09.jpeg';

type AboutPageProps = {
  copy: Copy;
};

export const AboutPage = ({ copy }: AboutPageProps): ReactElement => {
  const [isGratitudeHovered, setIsGratitudeHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isGratitudeActive, setIsGratitudeActive] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
    const updateTouchState = () => setIsTouchDevice(mediaQuery.matches);
    updateTouchState();
    mediaQuery.addEventListener('change', updateTouchState);
    return () => mediaQuery.removeEventListener('change', updateTouchState);
  }, []);

  const shouldToggleCard = (event: MouseEvent<HTMLElement>) => {
    if (!isTouchDevice) return false;
    const target = event.target as HTMLElement | null;
    return !target?.closest('button, a, input, select, textarea, [role="button"]');
  };

  const gratitudeActive = isTouchDevice ? isGratitudeActive : isGratitudeHovered;

  return (
    <section className="py-12 font-sans">
      <div className="container max-w-4xl mx-auto px-4 md:px-6 space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">
            {copy.aboutTitle}
          </h1>
          <p className="text-base md:text-lg text-subtle text-center">
            {copy.homeIdentityTagline}
          </p>
        </header>

        <section
          className={classNames(
            'rounded-2xl border surface-border surface card-hover-shadow p-6 md:p-8 relative overflow-hidden',
            isTouchDevice && isGratitudeActive && 'is-toggled',
          )}
          onMouseEnter={() => {
            if (!isTouchDevice) setIsGratitudeHovered(true);
          }}
          onMouseLeave={() => {
            if (!isTouchDevice) setIsGratitudeHovered(false);
          }}
          onClick={(event) => {
            if (shouldToggleCard(event)) setIsGratitudeActive((prev) => !prev);
          }}
        >
          <div
            className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${gratitudeActive ? 'opacity-10' : 'opacity-0'}`}
          >
            <SakuraFlower
              className="absolute -top-8 -right-8 w-28 h-28 transition-all duration-500 ease-out"
              style={{
                transform: gratitudeActive
                  ? 'rotate(15deg) scale(1) translate(0, 0)'
                  : 'rotate(45deg) scale(0.7) translate(10px, 10px)',
              }}
            />
            <SakuraFlower
              className="absolute top-8 -left-6 w-20 h-20 transition-all duration-500 delay-100 ease-out"
              style={{
                transform: gratitudeActive
                  ? 'rotate(-20deg) scale(1) translate(0, 0)'
                  : 'rotate(-50deg) scale(0.6) translate(-8px, 8px)',
              }}
            />
            <SakuraFlower
              className="absolute -bottom-6 right-12 w-18 h-18 transition-all duration-500 delay-200 ease-out"
              style={{
                transform: gratitudeActive
                  ? 'rotate(30deg) scale(1) translate(0, 0)'
                  : 'rotate(60deg) scale(0.5) translate(6px, -6px)',
              }}
            />
          </div>

          <div className="space-y-4 relative z-10">
            <h2 className="text-lg md:text-xl font-semibold">{copy.homeDojoCreditTitle}</h2>
            <div className="space-y-4 text-sm md:text-base leading-6 md:leading-7 text-subtle">
              <p>{copy.homeDojoCreditPart1}</p>
              <p>{copy.homeDojoCreditPart2}</p>
            </div>
          </div>
        </section>

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

        <div className="space-y-4">
          {copy.aboutIntro.split('\n').map((paragraph, index) => (
            <p key={index} className="text-base leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.aboutFeaturesTitle}</h2>
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

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.aboutPrivacyTitle}</h2>
          <p className="text-base leading-relaxed">{copy.aboutPrivacyIntro}</p>
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
            {copy.aboutPrivacy4 && (
              <li className="text-base leading-relaxed flex items-start">
                <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-current flex-shrink-0" />
                {(() => {
                  const text: string = String(copy.aboutPrivacy4);
                  const parts = text.split('GitHub');
                  const repoUrl = 'https://github.com/itskylebrooks/enso';
                  return (
                    <span>
                      {parts[0]}
                      <a
                        href={repoUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="underline"
                      >
                        GitHub
                      </a>
                      {parts[1] ?? ''}
                    </span>
                  );
                })()}
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.aboutTechTitle}</h2>
          <p className="text-base leading-relaxed">{copy.aboutTechIntro}</p>
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

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.aboutVisionTitle}</h2>
          {copy.aboutVision.split('\n').map((paragraph, index) => (
            <p key={index} className="text-base leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">{copy.aboutAuthorTitle}</h2>

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
};
