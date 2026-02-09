import { describe, expect, it } from 'vitest';
import techniquesData from '../src/generated/content/techniques.json';
import { scoreTechnique } from '../src/features/search/scorer';

describe('search scoring parity', () => {
  it('keeps Irimi Nage first for query "irimi nage"', () => {
    const ranked = [...techniquesData]
      .map((technique) => ({
        slug: technique.slug,
        score: scoreTechnique(technique, 'irimi nage', 'en'),
      }))
      .sort((a, b) => b.score - a.score);

    expect(ranked[0]?.slug).toBe('katate-tori-irimi-nage');
    expect(ranked[0]?.score).toBeGreaterThan(0);
  });
});
