import { motion } from 'motion/react';
import type { ReactElement } from 'react';
import type { Locale } from '@shared/types';
import { useMotionPreferences } from '@shared/components/ui/motion';
import { getCopy } from '@shared/constants/i18n';

type Props = {
  locale: Locale;
};

export const DanOverview = ({ locale }: Props): ReactElement => {
  const copy = getCopy(locale);
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
    <section className="py-12">
  <div className="container max-w-4xl mx-auto px-4 md:px-6 space-y-8">
        <motion.header className="space-y-2" {...animationProps}>
          <h1 className="text-2xl font-semibold leading-tight">{copy.danOverviewTitle}</h1>
          <p className="text-sm text-subtle leading-relaxed">{copy.danOverviewLead}</p>
  </motion.header>
  <hr className="border-t surface-border my-6" />

  <motion.article className="prose max-w-none space-y-6" {...animationProps}>
          {/* What this page is */}
          <div>
            <h2 className="text-lg font-semibold mb-3">{copy.danOverviewWhatTitle}</h2>
            <p className="text-base leading-relaxed mb-4">{copy.danOverviewWhatP1}</p>
            <p className="text-base leading-relaxed mb-4">{copy.danOverviewWhatP2}</p>
          </div>

          {/* General eligibility */}
          <div>
            <h2 className="text-lg font-semibold mb-3">{copy.danOverviewGeneralTitle}</h2>
            <ul className="space-y-2 mt-3">
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverviewGeneralLi1}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverviewGeneralLi2}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverviewGeneralLi3}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverviewGeneralLi4}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverviewGeneralLi5}</span>
              </li>
            </ul>
          </div>

          {/* At a glance */}
          <div>
            <h2 className="text-lg font-semibold mb-3">{copy.danOverviewAtAGlanceTitle}</h2>
            <ul className="space-y-2 mt-3">
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverviewAtAGlance2}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverviewAtAGlance3}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverviewAtAGlance4}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverviewAtAGlance5}</span>
              </li>
            </ul>
          </div>

          {/* Ukemi note (moved under At a glance) */}
          <div>
            <h3 className="text-base font-semibold mb-3">{copy.danOverviewUkemiTitle}</h3>
            <p className="text-base leading-relaxed mb-4">{copy.danOverviewUkemiP1}</p>
          </div>

          {/* 2nd Dan */}
          <div>
            <h2 className="text-xl font-semibold mb-3">{copy.danOverview2Title}</h2>
            <p className="text-base leading-relaxed mb-4"><span className="font-semibold">{copy.danOverviewLabelAdmission}:</span> {copy.danOverview2Admission.split(':').slice(1).join(':').trim()}</p>
            <p className="text-base leading-relaxed mb-4"><span className="font-semibold">{copy.danOverviewLabelTheory}:</span> {copy.danOverview2Theory}</p>
            <p className="text-base leading-relaxed mb-2"><span className="font-semibold">{copy.danOverviewLabelPractical}:</span></p>
            <ul className="space-y-2 mt-3">
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview2PracticalLi1}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview2PracticalLi2}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview2PracticalLi3}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview2PracticalLi4}</span>
              </li>
            </ul>
          </div>

          {/* 3rd Dan */}
          <div>
            <h2 className="text-xl font-semibold mb-3">{copy.danOverview3Title}</h2>
            <p className="text-base leading-relaxed mb-4"><span className="font-semibold">Admission:</span> {copy.danOverview3Admission.split(':').slice(1).join(':').trim()}</p>
            <p className="text-base leading-relaxed mb-2"><span className="font-semibold">Practical:</span></p>
            <ul className="space-y-2 mt-3">
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview3PracticalLi1}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview3PracticalLi2}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview3PracticalLi3}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview3PracticalLi4}</span>
              </li>
            </ul>
          </div>

          {/* 4th Dan */}
          <div>
            <h2 className="text-xl font-semibold mb-3">{copy.danOverview4Title}</h2>
            <p className="text-base leading-relaxed mb-4"><span className="font-semibold">{copy.danOverviewLabelAdmission}:</span> {copy.danOverview4Admission.split(':').slice(1).join(':').trim()}</p>
            <p className="text-base leading-relaxed mb-2"><span className="font-semibold">{copy.danOverviewLabelPractical}:</span></p>
            <ul className="space-y-2 mt-3">
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview4PracticalLi1}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview4PracticalLi2}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview4PracticalLi3}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview4PracticalLi4}</span>
              </li>
            </ul>
          </div>

          {/* 5th Dan */}
          <div>
            <h2 className="text-xl font-semibold mb-3">{copy.danOverview5Title}</h2>
            <p className="text-base leading-relaxed mb-4"><span className="font-semibold">{copy.danOverviewLabelAdmission}:</span> {copy.danOverview5Admission.split(':').slice(1).join(':').trim()}</p>
            <p className="text-base leading-relaxed mb-4"><span className="font-semibold">{copy.danOverviewLabelWritten}:</span> {copy.danOverview5Written.split(':').slice(1).join(':').trim()}</p>
            <p className="text-base leading-relaxed mb-2"><span className="font-semibold">{copy.danOverviewLabelPractical}:</span></p>
            <ul className="space-y-2 mt-3">
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview5PracticalLi1}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview5PracticalLi2}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview5PracticalLi3}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview5PracticalLi4}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview5PracticalLi5}</span>
              </li>
              <li className="text-base leading-relaxed flex gap-2">
                <span className="shrink-0">•</span>
                <span className="flex-1">{copy.danOverview5PracticalLi6}</span>
              </li>
            </ul>
          </div>

          {/* end of article */}
        </motion.article>
      </div>
    </section>
  );
};

export default DanOverview;
