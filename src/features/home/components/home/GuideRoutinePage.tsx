import type { ReactElement } from 'react';
import type { Copy } from '@shared/constants/i18n';
import type { Locale } from '@shared/types';

type GuideRoutinePageProps = {
  copy: Copy;
  locale: Locale;
  title: string;
  description: string;
  onBack: () => void;
};

const placeholderCopy = (locale: Locale): string =>
  locale === 'de' ? 'In Vorbereitung.' : 'Coming soon.';

export const GuideRoutinePage = ({
  copy,
  locale,
  title,
  description,
  onBack,
}: GuideRoutinePageProps): ReactElement => {
  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-subtle hover:text-[var(--color-text)] transition flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] rounded"
        >
          <span aria-hidden>←</span>
          <span>{copy.backToGuide}</span>
        </button>
      </div>
      <div className="rounded-2xl border surface-border surface p-6 text-center space-y-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-subtle">{description}</p>
        <p className="text-sm text-subtle">{placeholderCopy(locale)}</p>
      </div>
    </section>
  );
};
