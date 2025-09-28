import type { ReactElement } from 'react';
import type { Copy } from '../../constants/i18n';
import type { AppRoute } from '../../types';

type FooterProps = {
  copy: Copy;
  onNavigate: (route: AppRoute, options?: { replace?: boolean }) => void;
};

export const Footer = ({ copy, onNavigate }: FooterProps): ReactElement => {
  const year = new Date().getFullYear();

  return (
    <footer className="surface border-t surface-border text-xs text-subtle py-8">
      <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-3">
        <span>© {year} {copy.app}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('basics')}
            className="underline decoration-dotted hover:decoration-solid focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] rounded px-1"
          >
            {copy.basicsLink}
          </button>
          <button
            type="button"
            onClick={() => onNavigate('about')}
            className="underline decoration-dotted hover:decoration-solid focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-text)] rounded px-1"
          >
            {copy.aboutLink}
          </button>
        </div>
      </div>
    </footer>
  );
};
