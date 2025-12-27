import type { ReactElement } from 'react';
import type { Copy } from '@shared/constants/i18n';
import type { Grade, Locale } from '@shared/types';
import { gradeLabel } from '@shared/utils/grades';

type GuideGradePageProps = {
  copy: Copy;
  locale: Locale;
  grade: Grade;
  onBack: () => void;
  backLabel?: string;
  pinnedBeltGrade: Grade | null;
  onTogglePin: (grade: Grade) => void;
};

const placeholderCopy = (locale: Locale): string =>
  locale === 'de' ? 'In Vorbereitung.' : 'Coming soon.';

export const GuideGradePage = ({
  copy,
  locale,
  grade,
  onBack,
  backLabel,
  pinnedBeltGrade,
  onTogglePin,
}: GuideGradePageProps): ReactElement => {
  const isPinned = pinnedBeltGrade === grade;
  const pinLabel = isPinned ? copy.homeUnpinFromHome : copy.homePinToHome;

  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-subtle hover:text-[var(--color-text)] transition flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] rounded"
        >
          <span aria-hidden>←</span>
          <span>{backLabel ?? copy.backToGuide}</span>
        </button>
        <button
          type="button"
          onClick={() => onTogglePin(grade)}
          className="inline-flex items-center justify-center rounded-lg border btn-tonal surface-hover px-3 py-2 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
        >
          {pinLabel}
        </button>
      </div>
      <div className="rounded-2xl border surface-border surface p-6 text-center space-y-2">
        <h1 className="text-2xl font-semibold">{gradeLabel(grade, locale)}</h1>
        <p className="text-sm text-subtle">{placeholderCopy(locale)}</p>
      </div>
    </section>
  );
};
