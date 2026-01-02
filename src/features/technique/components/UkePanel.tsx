import type { ReactElement } from 'react';
import type { Copy } from '@shared/constants/i18n';
import { Handshake } from 'lucide-react';

export type UkePanelProps = {
  role: string;
  notes: string[];
  copy: Copy;
};

export const UkePanel = ({ role, notes, copy }: UkePanelProps): ReactElement => {
  if (!role && notes.length === 0) return <></>;

  return (
    <section className="space-y-3">
      <header className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-subtle">
        <Handshake className="w-4 h-4" />
        <span>{copy.uke}</span>
      </header>
      {role && <p className="text-sm leading-relaxed text-[var(--color-text)]">{role}</p>}
      {notes.length > 0 && (
        <div className="space-y-3">
          <ul className="space-y-2">
            {notes.map((note, index) => (
              <li
                key={index}
                className="text-sm leading-relaxed text-[var(--color-text)] flex gap-2"
              >
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
