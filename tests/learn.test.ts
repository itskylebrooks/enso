import { describe, expect, it } from 'vitest';
import {
  buildTechniqueLearnCard,
  buildTermLearnCard,
  getLearnableBookmarkCards,
} from '../src/features/learn/cards';
import {
  answerCurrentLearnCard,
  createLearnQueueState,
  orderLearnCards,
} from '../src/features/learn/session';
import { getCopy } from '../src/shared/constants/i18n';
import type { GlossaryTerm, Technique } from '../src/shared/types';

const technique: Technique = {
  id: 'technique-1',
  slug: 'ikkyo',
  name: { en: 'Ikkyo', de: 'Ikkyo' },
  jp: '一教',
  category: 'control',
  level: 'kyu5',
  summary: { en: 'First control.', de: 'Erste Kontrolle.' },
  tags: [],
  versions: [],
};

const term: GlossaryTerm = {
  id: 'term-1',
  slug: 'ma-ai',
  romaji: 'Ma-ai',
  category: 'philosophy',
  def: { en: 'Harmonious distance.', de: 'Harmonische Distanz.' },
};

describe('learn cards', () => {
  it('maps techniques to title and summary cards with belt tags', () => {
    const card = buildTechniqueLearnCard({ technique, locale: 'en' });

    expect(card).toMatchObject({
      id: 'technique:technique-1',
      cardType: 'technique',
      title: 'Ikkyo',
      definition: 'First control.',
      tagLabel: '5th Kyū',
    });
    expect(card.tagStyle?.backgroundColor).toBeTruthy();
  });

  it('maps terms to title and definition cards with category tags', () => {
    const card = buildTermLearnCard({ term, locale: 'de', copy: getCopy('de') });

    expect(card).toMatchObject({
      id: 'term:term-1',
      cardType: 'term',
      title: 'Ma-ai',
      definition: 'Harmonische Distanz.',
      tagLabel: 'Philosophie',
    });
    expect(card.tagStyle?.backgroundColor).toBe('var(--glossary-philosophy-bg)');
  });

  it('builds bookmark cards in current order and excludes exercises', () => {
    const cards = getLearnableBookmarkCards(
      [
        { type: 'glossary', item: term, itemId: 'glossary:term-1' },
        {
          type: 'exercise',
          item: { id: 'exercise-1', slug: 'rolls', name: { en: 'Rolls', de: 'Rollen' } },
          itemId: 'exercise:exercise-1',
        },
        { type: 'technique', item: technique, itemId: 'technique:technique-1' },
      ],
      'en',
      getCopy('en'),
    );

    expect(cards.map((card) => card.id)).toEqual(['glossary:term-1', 'technique:technique-1']);
  });

  it('random order keeps the same cards', () => {
    const cards = [
      buildTechniqueLearnCard({ technique, locale: 'en', id: 'a' }),
      buildTermLearnCard({ term, locale: 'en', copy: getCopy('en'), id: 'b' }),
      buildTechniqueLearnCard({
        technique: { ...technique, id: 'technique-2' },
        locale: 'en',
        id: 'c',
      }),
    ];
    const ordered = orderLearnCards(cards, 'random', () => 0);

    expect(ordered).toHaveLength(cards.length);
    expect(ordered.map((card) => card.id).sort()).toEqual(['a', 'b', 'c']);
    expect(ordered.map((card) => card.id)).not.toEqual(cards.map((card) => card.id));
  });
});

describe('learn queue', () => {
  it('removes remembered cards from the queue', () => {
    const first = buildTechniqueLearnCard({ technique, locale: 'en', id: 'a' });
    const second = buildTermLearnCard({ term, locale: 'en', copy: getCopy('en'), id: 'b' });
    const next = answerCurrentLearnCard(createLearnQueueState([first, second]), true);

    expect(next.queue.map((card) => card.id)).toEqual(['b']);
    expect(next.rememberedCount).toBe(1);
    expect(next.missedCount).toBe(0);
  });

  it('requeues missed cards until they are remembered', () => {
    const first = buildTechniqueLearnCard({ technique, locale: 'en', id: 'a' });
    const second = buildTermLearnCard({ term, locale: 'en', copy: getCopy('en'), id: 'b' });
    const missed = answerCurrentLearnCard(createLearnQueueState([first, second]), false);

    expect(missed.queue.map((card) => card.id)).toEqual(['b', 'a']);
    expect(missed.missedCount).toBe(1);

    const rememberedSecond = answerCurrentLearnCard(missed, true);
    const rememberedFirst = answerCurrentLearnCard(rememberedSecond, true);

    expect(rememberedFirst.queue).toEqual([]);
    expect(rememberedFirst.rememberedCount).toBe(2);
    expect(rememberedFirst.totalCount).toBe(2);
  });
});
