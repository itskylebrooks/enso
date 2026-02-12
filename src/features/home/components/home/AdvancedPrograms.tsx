import { useMotionPreferences } from '@shared/components/ui/motion';
import { getCopy } from '@shared/constants/i18n';
import type { EntryMode, Locale } from '@shared/types';
import { getInitialThemeState } from '@shared/utils/theme';
import { motion } from 'motion/react';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { JoMatrix } from '../guide/JoMatrix';
import { SayaNoUchiMatrix } from '../guide/SayaNoUchiMatrix';
import { TantoMatrix } from '../guide/TantoMatrix';

type Props = {
  locale: Locale;
  onOpenTechnique: (
    slug: string,
    trainerId?: string,
    entry?: EntryMode,
    skipExistenceCheck?: boolean,
  ) => void;
  onBack: () => void;
};

export const AdvancedPrograms = ({ locale, onOpenTechnique, onBack }: Props): ReactElement => {
  const [isDark] = useState(getInitialThemeState);
  const i18nCopy = getCopy(locale);
  const { prefersReducedMotion } = useMotionPreferences();

  const animationProps = prefersReducedMotion
    ? {}
    : {
        initial: 'hidden' as const,
        animate: 'show' as const,
        variants: { hidden: { opacity: 0 }, show: { opacity: 1 } },
        transition: { duration: 0.24 },
      };

  return (
    <section className="pt-0 pb-12">
      <div className="container max-w-4xl mx-auto px-4 md:px-6 space-y-8">
        <div className="space-y-3">
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-subtle hover:text-[var(--color-text)] transition flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] rounded"
          >
            <span aria-hidden>←</span>
            <span>{i18nCopy.backToGuide}</span>
          </button>
          <motion.header className="space-y-2" {...animationProps}>
            <h1 className="text-2xl font-semibold leading-tight">
              {i18nCopy.advancedProgramsTitle}
            </h1>
            <p className="text-sm text-subtle leading-relaxed">{i18nCopy.advancedProgramsLead}</p>
          </motion.header>
        </div>

        <motion.article className="space-y-4" {...animationProps}>
          <hr className="border-t surface-border my-6" />

          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{i18nCopy.sayaNoUchiTitle}</h2>
            <p className="text-sm text-subtle leading-relaxed">{i18nCopy.sayaNoUchiLead}</p>
          </header>
          <SayaNoUchiMatrix
            locale={locale}
            isDark={isDark}
            onCellClick={(slug, attackKey) => {
              const attackSlug = attackKey
                .replace(/_ai_hanmi$/, '')
                .replace(/_gyaku_hanmi$/, '')
                .replace(/^hanmi_hantachi_/, '')
                .replace(/_/g, '-');
              const combinedSlug = `${attackSlug}-${slug}`;
              onOpenTechnique(combinedSlug, undefined, undefined, true);
            }}
          />
        </motion.article>

        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{i18nCopy.joTechniquesTitle}</h2>
            <p className="text-sm text-subtle leading-relaxed">{i18nCopy.joTechniquesLead}</p>
          </header>
          <JoMatrix
            locale={locale}
            isDark={isDark}
            copy={i18nCopy}
            onCellClick={(slug, attackKey) => {
              const attackSlug = attackKey.replace(/_/g, '-');
              const combinedSlug = `${attackSlug}-${slug}`;
              onOpenTechnique(combinedSlug, undefined, undefined, true);
            }}
          />
        </motion.article>

        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{i18nCopy.tantoTechniquesTitle}</h2>
            <p className="text-sm text-subtle leading-relaxed">{i18nCopy.tantoTechniquesLead}</p>
          </header>
          <TantoMatrix
            locale={locale}
            isDark={isDark}
            onCellClick={(slug, attackKey) => {
              const attackSlug = attackKey.replace(/_/g, '-');
              const combinedSlug = `${attackSlug}-${slug}`;
              onOpenTechnique(combinedSlug, undefined, undefined, true);
            }}
          />
        </motion.article>
      </div>
    </section>
  );
};

export default AdvancedPrograms;
