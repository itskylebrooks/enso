import { motion } from 'motion/react';
import type { ReactElement } from 'react';
import { useState } from 'react';
import type { Locale, EntryMode } from '@shared/types';
import { getInitialThemeState } from '@shared/utils/theme';
import { SayaNoUchiMatrix } from '../guide/SayaNoUchiMatrix';
import { JoMatrix } from '../guide/JoMatrix';
import { TantoMatrix } from '../guide/TantoMatrix';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { getCopy } from '@shared/constants/i18n';

type Props = {
  locale: Locale;
  onOpenTechnique: (slug: string, trainerId?: string, entry?: EntryMode, skipExistenceCheck?: boolean) => void;
};

export const AdvancedPrograms = ({ locale, onOpenTechnique }: Props): ReactElement => {
  const [isDark] = useState(getInitialThemeState);
  const i18nCopy = getCopy(locale);
  const { prefersReducedMotion } = useMotionPreferences();

  const animationProps = prefersReducedMotion
    ? {}
    : {
        initial: 'hidden' as const,
        animate: 'show' as const,
        variants: { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } },
        transition: { duration: 0.24 },
      };

  return (
    <section className="py-12 px-5 md:px-8">
      <div className="max-w-4xl mx-auto space-y-10">

        <motion.article className="space-y-4" {...animationProps}>
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold leading-tight">{i18nCopy.advancedProgramsTitle}</h1>
            <p className="text-sm text-subtle leading-relaxed">{i18nCopy.advancedProgramsLead}</p>
          </header>
          <hr className="border-t surface-border my-6" />

          <header className="space-y-2">
            <h2 className="text-xl font-semibold leading-tight">{i18nCopy.sayaNoUchiTitle}</h2>
            <p className="text-sm text-subtle leading-relaxed">{i18nCopy.sayaNoUchiLead}</p>
          </header>
          <SayaNoUchiMatrix
            locale={locale}
            isDark={isDark}
            onCellClick={(slug, attackKey) => {
              let attackSlug = attackKey
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
