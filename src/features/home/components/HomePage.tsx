import type { ReactElement, MouseEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Copy } from '../../../shared/constants/i18n';
import type { GlossaryTerm, Grade, Locale } from '../../../shared/types';
import { SakuraFlower } from '../../../shared/components';
import { QuoteRotator } from './QuoteRotator';
import { getAllQuotes, type Quote } from '@shared/data/quotes';
import { classNames } from '@shared/utils/classNames';
import { getCategoryLabel, getCategoryStyle } from '../../../shared/styles/glossary';
import { getGradeStyle, gradeLabel } from '@shared/styles/belts';

const truncateDefinition = (text: string, maxLength: number = 140): string => {
  if (text.length <= maxLength) return text;
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? `${truncated.slice(0, lastSpace)}...` : `${truncated}...`;
};

const toRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) return hex;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

type HomePageProps = {
  copy: Copy;
  locale: Locale;
  glossaryTerms: GlossaryTerm[];
  onOpenGlossaryTerm: (slug: string) => void;
  pinnedBeltGrade: Grade | null;
  onOpenPinnedBeltGrade: (grade: Grade) => void;
};

export const HomePage = ({
  copy,
  locale,
  glossaryTerms,
  onOpenGlossaryTerm,
  pinnedBeltGrade,
  onOpenPinnedBeltGrade,
}: HomePageProps): ReactElement => {
  const quotes = getAllQuotes(locale);
  const [isGratitudeHovered, setIsGratitudeHovered] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [isGratitudeActive, setIsGratitudeActive] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [quoteCopied, setQuoteCopied] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);
  const termToLearn = useMemo(() => {
    if (!glossaryTerms.length) return null;
    const randomIndex = Math.floor(Math.random() * glossaryTerms.length);
    return glossaryTerms[randomIndex] ?? null;
  }, [glossaryTerms]);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(hover: none) and (pointer: coarse)');
    const updateTouchState = () => setIsTouchDevice(mediaQuery.matches);
    updateTouchState();
    mediaQuery.addEventListener('change', updateTouchState);
    return () => mediaQuery.removeEventListener('change', updateTouchState);
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  const shouldToggleCard = (event: MouseEvent<HTMLElement>) => {
    if (!isTouchDevice) return false;
    const target = event.target as HTMLElement | null;
    return !target?.closest('button, a, input, select, textarea, [role="button"]');
  };

  const handleCopyQuote = async () => {
    if (!currentQuote) return;
    const textToCopy = `"${currentQuote.quote}" — ${currentQuote.author}`;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      setQuoteCopied(true);
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = window.setTimeout(() => {
        setQuoteCopied(false);
        copyTimeoutRef.current = null;
      }, 1600);
    } catch {
      // noop
    }
  };

  const gratitudeActive = isTouchDevice ? isGratitudeActive : isGratitudeHovered;
  
  return (
    <div className="min-h-dvh font-sans">
      <div className="container max-w-4xl mx-auto px-4 md:px-6 pt-8 md:pt-12 space-y-8 md:space-y-6 pb-16 md:pb-24">
        {pinnedBeltGrade && (() => {
          const beltStyle = getGradeStyle(pinnedBeltGrade);
          const beltTitle = gradeLabel(pinnedBeltGrade, locale);
          const isDanBelt = pinnedBeltGrade.startsWith('dan');
          const beltLineColor = isDanBelt ? undefined : toRgba(beltStyle.backgroundColor, 0.35);
          const danCount = isDanBelt ? Number(pinnedBeltGrade.replace('dan', '')) : 0;
          return (
            <button
              type="button"
              onClick={() => onOpenPinnedBeltGrade(pinnedBeltGrade)}
              className="w-full rounded-2xl border-2 surface surface-border card-hover-shadow p-6 md:p-8 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] relative overflow-hidden"
            >
              {!isDanBelt && (
                <>
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-4 w-[160%] -translate-y-1/2 -translate-x-[43%] -rotate-[65deg] md:left-0 md:top-1/2 md:h-5 md:w-[200%] md:-translate-y-1/2 md:-translate-x-[45%] md:-rotate-45"
                    style={beltLineColor ? { backgroundColor: beltLineColor } : undefined}
                  />
                  <span
                    aria-hidden
                    className="absolute right-0 top-1/2 h-4 w-[160%] -translate-y-1/2 translate-x-[43%] rotate-[65deg] md:right-0 md:top-1/2 md:h-5 md:w-[200%] md:-translate-y-1/2 md:translate-x-[45%] md:rotate-45"
                    style={beltLineColor ? { backgroundColor: beltLineColor } : undefined}
                  />
                </>
              )}
              <div className="relative z-10 space-y-2">
                <p className="text-sm uppercase tracking-[0.2em] text-subtle">
                  {copy.homePinnedBeltNotice}
                </p>
                <h2 className="text-lg md:text-xl font-semibold">{beltTitle}</h2>
                {isDanBelt && (
                  <>
                    <div className="absolute left-4 inset-y-0 flex flex-col justify-center gap-2" aria-hidden>
                      {Array.from({ length: Math.max(danCount, 1) }).map((_, index) => (
                        <span
                          key={`dan-mark-left-${index}`}
                          className="h-2.5 w-2.5 rounded-full bg-[#9ca3af] dark:bg-[#6b7280]"
                        />
                      ))}
                    </div>
                    <div className="absolute right-4 inset-y-0 flex flex-col justify-center gap-2" aria-hidden>
                      {Array.from({ length: Math.max(danCount, 1) }).map((_, index) => (
                        <span
                          key={`dan-mark-right-${index}`}
                          className="h-2.5 w-2.5 rounded-full bg-[#9ca3af] dark:bg-[#6b7280]"
                        />
                      ))}
                    </div>
                  </>
                )}
                <p className="text-sm text-subtle">{copy.homePinnedBeltCta}</p>
              </div>
            </button>
          );
        })()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {termToLearn && (() => {
            const definition = termToLearn.def[locale] || termToLearn.def.en;
            const categoryLabel = getCategoryLabel(termToLearn.category, copy);
            const categoryStyle = getCategoryStyle(termToLearn.category);
            const ariaLabel = `${termToLearn.romaji} – ${definition}`;
            const truncatedDefinition = truncateDefinition(definition, 140);

            return (
              <button
                type="button"
                onClick={() => onOpenGlossaryTerm(termToLearn.slug)}
                className="rounded-2xl border surface-border surface card-hover-shadow p-6 md:p-8 text-left focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] flex flex-col justify-start"
                aria-label={ariaLabel}
              >
                <div className="space-y-4">
                  <h2 className="text-lg md:text-xl font-semibold">
                    {copy.homeTermToLearnTitle}
                  </h2>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <h3 className="text-base font-semibold leading-tight">{termToLearn.romaji}</h3>
                      {termToLearn.jp && <div className="text-xs text-subtle truncate">{termToLearn.jp}</div>}
                    </div>
                    <span
                      className="glossary-tag text-xs font-medium px-2 py-1 rounded-full shrink-0"
                      style={{
                        backgroundColor: categoryStyle.backgroundColor,
                        color: categoryStyle.color,
                      }}
                    >
                      {categoryLabel}
                    </span>
                  </div>
                  <p className="text-sm text-muted leading-relaxed">
                    {truncatedDefinition}
                  </p>
                </div>
              </button>
            );
          })()}

          {/* Random Quote Card */}
          <button
            type="button"
            onClick={handleCopyQuote}
            className="rounded-2xl border surface-border surface card-hover-shadow p-6 md:p-8 text-left focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] flex flex-col justify-start"
          >
            <div className="space-y-4">
              <h2 className="text-lg md:text-xl font-semibold">
                {quoteCopied ? copy.homeQuoteCopiedTitle : copy.homeQuoteOfMomentTitle}
              </h2>
              <QuoteRotator quotes={quotes} onQuoteChange={setCurrentQuote} />
            </div>
          </button>
        </div>

        {/* Dojo Credit Card */}
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
          {/* Sakura Flowers Background */}
          <div className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${gratitudeActive ? 'opacity-10' : 'opacity-0'}`}>
            {/* Top right sakura */}
            <SakuraFlower 
              className="absolute -top-8 -right-8 w-28 h-28 transition-all duration-500 ease-out"
              style={{
                transform: gratitudeActive 
                  ? 'rotate(15deg) scale(1) translate(0, 0)' 
                  : 'rotate(45deg) scale(0.7) translate(10px, 10px)',
              }}
            />
            {/* Top left sakura */}
            <SakuraFlower 
              className="absolute top-8 -left-6 w-20 h-20 transition-all duration-500 delay-100 ease-out"
              style={{
                transform: gratitudeActive 
                  ? 'rotate(-20deg) scale(1) translate(0, 0)' 
                  : 'rotate(-50deg) scale(0.6) translate(-8px, 8px)',
              }}
            />
            {/* Bottom right sakura */}
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
