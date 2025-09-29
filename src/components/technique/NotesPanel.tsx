import type { ReactElement } from 'react';
import type { Copy } from '../../constants/i18n';

export type NotesPanelProps = {
  keyPoints?: string[];
  commonMistakes?: string[];
  context?: string;
  copy: Copy;
};

export const NotesPanel = ({ keyPoints, commonMistakes, context, copy }: NotesPanelProps): ReactElement => {
  const cards: Array<{
    title: string;
    items?: string[];
    text?: string;
  }> = [
    { title: copy.keyPoints, items: keyPoints },
    { title: copy.commonMistakes, items: commonMistakes },
    { title: copy.context, text: context },
  ];

  return (
    <section className="space-y-3">
      <header className="text-xs uppercase tracking-[0.3em] text-subtle">{copy.notes}</header>
      <div className="space-y-3">
        {cards.map((card) => (
          <article key={card.title} className="rounded-xl border border-white/10 p-4 sm:p-5 space-y-3">
            <h3 className="text-xs uppercase tracking-[0.3em] text-subtle">{card.title}</h3>
            {card.items && card.items.length > 0 && (
              <ul className="space-y-2 text-sm leading-relaxed text-muted">
                {card.items.map((item, index) => (
                  <li key={index} className="flex gap-2">
                    <span className="text-subtle shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            {card.text && <p className="text-sm leading-relaxed text-muted">{card.text}</p>}
            {!card.text && (!card.items || card.items.length === 0) && (
              <p className="text-sm leading-relaxed text-muted">{copy.notesEmpty}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
};
