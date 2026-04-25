import type { ReactElement } from 'react';
import type { Copy } from '@shared/constants/i18n';
import { History } from 'lucide-react';

export type NotesPanelProps = {
  context?: string;
  copy: Copy;
};

export const NotesPanel = ({ context, copy }: NotesPanelProps): ReactElement => {
  if (!context) return <></>;

  return (
    <section className="space-y-3">
      <header className="flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-subtle">
        <History className="w-4 h-4" />
        <span>{copy.context}</span>
      </header>
      <p className="text-base leading-relaxed text-[var(--color-text)]">{context}</p>
    </section>
  );
};
