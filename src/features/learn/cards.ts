import type { Copy } from '@shared/constants/i18n';
import { getGradeStyle } from '@shared/styles/belts';
import { getCategoryLabel, getCategoryStyle } from '@shared/styles/terms';
import type { GlossaryTerm, Locale, Technique } from '@shared/types';
import { gradeLabel } from '@shared/utils/grades';
import type { LearnCard } from './types';

type BuildTechniqueLearnCardInput = {
  technique: Technique;
  locale: Locale;
  id?: string;
};

type BuildTermLearnCardInput = {
  term: GlossaryTerm;
  locale: Locale;
  copy: Copy;
  id?: string;
};

export const buildTechniqueLearnCard = ({
  technique,
  locale,
  id,
}: BuildTechniqueLearnCardInput): LearnCard => ({
  id: id ?? `technique:${technique.id}`,
  cardType: 'technique',
  title: technique.name[locale] || technique.name.en,
  definition: technique.summary[locale] || technique.summary.en,
  tagLabel: gradeLabel(technique.level, locale),
  tagStyle: getGradeStyle(technique.level),
});

export const buildTermLearnCard = ({
  term,
  locale,
  copy,
  id,
}: BuildTermLearnCardInput): LearnCard => ({
  id: id ?? `term:${term.id}`,
  cardType: 'term',
  title: term.romaji,
  definition: term.def[locale] || term.def.en,
  tagLabel: getCategoryLabel(term.category, copy),
  tagStyle: getCategoryStyle(term.category),
});

export const getLearnableBookmarkCards = (
  items: Array<{ type: string; item: unknown; itemId: string }>,
  locale: Locale,
  copy: Copy,
): LearnCard[] =>
  items.flatMap((entry) => {
    if (entry.type === 'technique') {
      return [
        buildTechniqueLearnCard({
          technique: entry.item as Technique,
          locale,
          id: entry.itemId,
        }),
      ];
    }

    if (entry.type === 'glossary') {
      return [
        buildTermLearnCard({
          term: entry.item as GlossaryTerm,
          locale,
          copy,
          id: entry.itemId,
        }),
      ];
    }

    return [];
  });
