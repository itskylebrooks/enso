import type { ReactElement } from 'react';
import type { Copy } from '../../shared/constants/i18n';

type FeedbackPageProps = {
  copy: Copy;
  onBack?: () => void;
};

export const FeedbackPage = ({ copy, onBack }: FeedbackPageProps): ReactElement => {
  return (
    <main className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-6">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted hover:text-current transition-soft"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          {copy.backToLibrary}
        </button>
      )}
      
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold">{copy.feedbackTitle}</h1>
        </header>
        
        <div className="rounded-xl border surface-border p-6 space-y-4">
          <div className="text-muted leading-relaxed whitespace-pre-line">
            {copy.feedbackDescription}
          </div>
        </div>
      </div>
    </main>
  );
};
