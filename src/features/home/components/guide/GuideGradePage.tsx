import type { ReactElement } from 'react';
import type { Copy } from '@shared/constants/i18n';
import type { Grade, Locale } from '@shared/types';
import { gradeLabel } from '@shared/utils/grades';

type GuideGradePageProps = {
  copy: Copy;
  locale: Locale;
  grade: Grade;
  onBack: () => void;
};

const placeholderCopy = (locale: Locale): string =>
  locale === 'de' ? 'In Vorbereitung.' : 'Coming soon.';

export const GuideGradePage = ({ copy, locale, grade, onBack }: GuideGradePageProps): ReactElement => (
  <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-6">
    <button
      type="button"
      onClick={onBack}
      className="text-sm underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] rounded"
    >
      {copy.backToGuide}
    </button>
    <div className="rounded-2xl border surface-border surface p-6 text-center space-y-2">
      <h1 className="text-2xl font-semibold">{gradeLabel(grade, locale)}</h1>
      <p className="text-sm text-subtle">{placeholderCopy(locale)}</p>
    </div>
  </section>
);
