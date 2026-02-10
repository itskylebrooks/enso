import type { ReactElement } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Copy } from '../../../shared/constants/i18n';
import type { Exercise, GlossaryTerm, Grade, Locale, Progress, Technique } from '../../../shared/types';
import { QuoteRotator } from './QuoteRotator';
import { getAllQuotes, type Quote } from '@shared/data/quotes';
import { getGradeStyle, gradeLabel } from '@shared/styles/belts';
import { ContinueCard } from './ContinueCard';

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
  techniques: Technique[];
  techniqueProgress: Progress[];
  glossaryTerms: GlossaryTerm[];
  exercises: Exercise[];
  onOpenTechnique: (slug: string) => void;
  onOpenGlossaryTerm: (slug: string) => void;
  onOpenExercise: (slug: string) => void;
  pinnedBeltGrade: Grade | null;
  onOpenPinnedBeltGrade: (grade: Grade) => void;
  beltPromptDismissed: boolean;
  onOpenGuideFromPrompt: () => void;
};

export const HomePage = ({
  copy,
  locale,
  techniques,
  techniqueProgress,
  glossaryTerms,
  exercises,
  onOpenTechnique,
  onOpenGlossaryTerm,
  onOpenExercise,
  pinnedBeltGrade,
  onOpenPinnedBeltGrade,
  beltPromptDismissed,
  onOpenGuideFromPrompt,
}: HomePageProps): ReactElement => {
  const quotes = getAllQuotes(locale);
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [quoteCopied, setQuoteCopied] = useState(false);
  const copyTimeoutRef = useRef<number | null>(null);
  const termToLearn = useMemo(() => {
    if (!glossaryTerms.length) return null;
    const randomIndex = Math.floor(Math.random() * glossaryTerms.length);
    return glossaryTerms[randomIndex] ?? null;
  }, [glossaryTerms]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        window.clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

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
      }, 900);
    } catch {
      // noop
    }
  };

  return (
    <div className="min-h-dvh font-sans">
      <div className="container max-w-4xl mx-auto px-4 md:px-6 pt-8 space-y-6 pb-16 md:pb-24">
        {!pinnedBeltGrade &&
          !beltPromptDismissed &&
          (() => {
            const beltColors = Array.from({ length: 5 }, () => 'var(--belt-prompt-stripe)');
            return (
              <button
                type="button"
                onClick={onOpenGuideFromPrompt}
                className="w-full rounded-2xl border surface-border surface card-hover-shadow p-6 md:p-8 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] relative overflow-hidden"
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 h-4 w-[160%] -translate-y-1/2 -translate-x-[43%] -rotate-[65deg] md:left-0 md:top-1/2 md:h-5 md:w-[200%] md:-translate-y-1/2 md:-translate-x-[45%] md:-rotate-45 overflow-hidden"
                >
                  <span className="absolute inset-0 grid grid-cols-5">
                    {beltColors.map((color, index) => (
                      <span
                        key={`belt-stripe-left-${color}-${index}`}
                        className="bg-[var(--belt-prompt-stripe)]"
                      />
                    ))}
                  </span>
                </span>
                <span
                  aria-hidden
                  className="absolute right-0 top-1/2 h-4 w-[160%] -translate-y-1/2 translate-x-[43%] rotate-[65deg] md:right-0 md:top-1/2 md:h-5 md:w-[200%] md:-translate-y-1/2 md:translate-x-[45%] md:rotate-45 overflow-hidden"
                >
                  <span className="absolute inset-0 grid grid-cols-5">
                    {beltColors.map((color, index) => (
                      <span
                        key={`belt-stripe-right-${color}-${index}`}
                        className="bg-[var(--belt-prompt-stripe)]"
                      />
                    ))}
                  </span>
                </span>
                <div className="relative z-10 space-y-2">
                  <h2 className="text-lg md:text-xl font-semibold">
                    {copy.homePinBeltPromptTitle}
                  </h2>
                  <p className="text-sm text-subtle">{copy.homePinBeltPromptBody}</p>
                </div>
              </button>
            );
          })()}

        {pinnedBeltGrade &&
          (() => {
            const beltStyle = getGradeStyle(pinnedBeltGrade);
            const beltTitle = gradeLabel(pinnedBeltGrade, locale);
            const isDanBelt = pinnedBeltGrade.startsWith('dan');
            const beltLineColor = isDanBelt ? undefined : toRgba(beltStyle.backgroundColor, 0.35);
            const danCount = isDanBelt ? Number(pinnedBeltGrade.replace('dan', '')) : 0;
            return (
              <button
                type="button"
                onClick={() => onOpenPinnedBeltGrade(pinnedBeltGrade)}
                className="w-full rounded-2xl border surface surface-border card-hover-shadow p-6 md:p-8 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] relative overflow-hidden"
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
                      <div
                        className="absolute left-4 inset-y-0 flex flex-col justify-center gap-2"
                        aria-hidden
                      >
                        {Array.from({ length: Math.max(danCount, 1) }).map((_, index) => (
                          <span
                            key={`dan-mark-left-${index}`}
                            className="h-2.5 w-2.5 rounded-full bg-[var(--belt-prompt-stripe)]"
                          />
                        ))}
                      </div>
                      <div
                        className="absolute right-4 inset-y-0 flex flex-col justify-center gap-2"
                        aria-hidden
                      >
                        {Array.from({ length: Math.max(danCount, 1) }).map((_, index) => (
                          <span
                            key={`dan-mark-right-${index}`}
                            className="h-2.5 w-2.5 rounded-full bg-[var(--belt-prompt-stripe)]"
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

        <ContinueCard
          copy={copy}
          locale={locale}
          techniques={techniques}
          techniqueProgress={techniqueProgress}
          glossaryTerms={glossaryTerms}
          exercises={exercises}
          onOpenTechnique={onOpenTechnique}
          onOpenTerm={onOpenGlossaryTerm}
          onOpenExercise={onOpenExercise}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {termToLearn &&
            (() => {
              const definition = termToLearn.def[locale] || termToLearn.def.en;
              const ariaLabel = `${termToLearn.romaji} – ${definition}`;
              const truncatedDefinition = truncateDefinition(definition, 140);

              return (
                <button
                  type="button"
                  onClick={() => onOpenGlossaryTerm(termToLearn.slug)}
                  className="rounded-2xl border surface-border surface card-hover-shadow pt-2 pb-4 px-4 md:pt-3 md:pb-5 md:px-5 text-left focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] flex flex-col justify-start"
                  aria-label={ariaLabel}
                >
                  <div className="space-y-3">
                    <h2 className="text-lg md:text-xl font-semibold text-center">
                      {copy.homeTermToLearnTitle}
                    </h2>
                    <p className="text-sm md:text-base leading-6 md:leading-7 text-subtle italic">
                      {truncatedDefinition}
                    </p>
                    <p className="text-sm text-subtle text-right">— {termToLearn.romaji}</p>
                  </div>
                </button>
              );
            })()}

          {/* Random Quote Card */}
          <button
            type="button"
            onClick={handleCopyQuote}
            className="rounded-2xl border surface-border surface card-hover-shadow pt-2 pb-4 px-4 md:pt-3 md:pb-5 md:px-5 text-left focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] flex flex-col justify-start"
          >
            <div className="space-y-3">
              <h2 className="text-lg md:text-xl font-semibold text-center">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={quoteCopied ? 'copied' : 'default'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="inline-block"
                  >
                    {quoteCopied ? copy.homeQuoteCopiedTitle : copy.homeQuoteOfMomentTitle}
                  </motion.span>
                </AnimatePresence>
              </h2>
              <QuoteRotator quotes={quotes} onQuoteChange={setCurrentQuote} />
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};
