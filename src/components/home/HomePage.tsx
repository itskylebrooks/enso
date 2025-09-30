import type { ReactElement } from 'react';
import type { Copy } from '../../shared/constants/i18n';
import { Logo } from '../../shared/components';

type HomePageProps = {
  copy: Copy;
  onOpenLibrary: () => void;
  onViewBookmarks: () => void;
  onViewBasics: () => void;
};

export const HomePage = ({ copy, onOpenLibrary, onViewBookmarks, onViewBasics }: HomePageProps): ReactElement => (
  <section className="py-16 px-6">
    <div className="max-w-4xl mx-auto text-center space-y-10">
      <div className="flex flex-col items-center gap-4">
        <Logo className="w-16 h-16 border-[3px]" />
        <h1 className="text-3xl font-semibold tracking-tight">{copy.app}</h1>
        <p className="text-base text-subtle max-w-2xl leading-relaxed">{copy.homeTagline}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onOpenLibrary}
          className="px-5 py-2.5 rounded-xl border btn-contrast transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
        >
          {copy.openLibraryCta}
        </button>
        <button
          type="button"
          onClick={onViewBookmarks}
          className="px-5 py-2.5 rounded-xl border btn-tonal surface-hover transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
        >
          {copy.viewProgressCta}
        </button>
        <button
          type="button"
          onClick={onViewBasics}
          className="px-5 py-2.5 rounded-xl border btn-tonal surface-hover transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)]"
        >
          {copy.viewBasicsCta}
        </button>
      </div>
    </div>
  </section>
);
