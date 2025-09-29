import type { ReactElement } from 'react';
import type { Copy } from '../../constants/i18n';
import { HandshakeIcon } from '../common/icons';

export type UkePanelProps = {
  role: string;
  notes: string[];
  copy: Copy;
};

export const UkePanel = ({ role, notes, copy }: UkePanelProps): ReactElement => {
  if (!role && notes.length === 0) {
    return <></>;
  }

  return (
    <section className="rounded-xl border border-white/10 bg-[var(--color-surface)]/80 p-4 sm:p-5 space-y-4">
      <header className="flex items-center gap-2 text-xs font-semibold tracking-[0.3em] uppercase text-subtle">
        <HandshakeIcon className="w-4 h-4" />
        <span>{copy.uke}</span>
      </header>
      {role && <p className="text-sm leading-relaxed text-muted">{role}</p>}
      {notes.length > 0 && (
        <div className="space-y-3">
          <ul className="space-y-2">
            {notes.map((note, index) => (
              <li key={index} className="text-sm leading-relaxed text-muted flex gap-2">
                <span className="text-subtle shrink-0">•</span>
                <span>{note}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
