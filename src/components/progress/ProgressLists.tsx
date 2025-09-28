import type { ReactElement, ReactNode } from 'react';
import type { Locale, Progress, Technique } from '../../types';
import type { Copy } from '../../constants/i18n';
import { SectionTitle } from '../common';
import { ProgressList } from './ProgressList';

type ProgressListsProps = {
  copy: Copy;
  locale: Locale;
  techniques: Technique[];
  progress: Progress[];
  onOpen: (slug: string) => void;
};

const partitionByStatus = (techniques: Technique[], progressMap: Record<string, Progress>) => ({
  focus: techniques.filter((technique) => progressMap[technique.id]?.focus),
  confident: techniques.filter((technique) => progressMap[technique.id]?.confident),
});

export const ProgressLists = ({ copy, locale, techniques, progress, onOpen }: ProgressListsProps): ReactElement => {
  const progressById = Object.fromEntries(progress.map((entry) => [entry.techniqueId, entry]));
  const buckets = partitionByStatus(techniques, progressById);

  return (
    <div className="flex flex-col gap-6">
      <ProgressSection title={`${copy.focus} (${buckets.focus.length})`}>
        <ProgressList items={buckets.focus} locale={locale} copy={copy} progressById={progressById} onOpen={onOpen} />
      </ProgressSection>
      <ProgressSection title={`${copy.confident} (${buckets.confident.length})`}>
        <ProgressList
          items={buckets.confident}
          locale={locale}
          copy={copy}
          progressById={progressById}
          onOpen={onOpen}
        />
      </ProgressSection>
    </div>
  );
};

type SectionProps = {
  title: string;
  children: ReactNode;
};

const ProgressSection = ({ title, children }: SectionProps): ReactElement => (
  <section className="surface border surface-border rounded-2xl p-3">
    <SectionTitle>{title}</SectionTitle>
    <div className="mt-2">{children}</div>
  </section>
);
