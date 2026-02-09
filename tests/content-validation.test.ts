import { describe, expect, it } from 'vitest';
import glossaryData from '../src/generated/content/glossary.json';
import practiceData from '../src/generated/content/practice.json';
import techniquesData from '../src/generated/content/techniques.json';
import { parseGlossaryTerm } from '../src/lib/content/schemas/glossary';
import { parsePracticeExercise } from '../src/lib/content/schemas/practice';
import { parseTechnique } from '../src/lib/content/schemas/technique';

describe('content schema validation', () => {
  it('accepts valid generated content items', () => {
    const technique = techniquesData[0];
    const glossary = glossaryData[0];
    const practice = practiceData[0];

    expect(parseTechnique(technique, technique.slug).slug).toBe(technique.slug);
    expect(parseGlossaryTerm(glossary, glossary.slug).slug).toBe(glossary.slug);
    expect(parsePracticeExercise(practice, practice.slug).slug).toBe(practice.slug);
  });

  it('fails on filename/slug mismatch', () => {
    const technique = techniquesData[0];
    const glossary = glossaryData[0];
    const practice = practiceData[0];

    expect(() => parseTechnique(technique, 'wrong-technique-slug')).toThrow(/slug mismatch/i);
    expect(() => parseGlossaryTerm(glossary, 'wrong-term-slug')).toThrow(/slug mismatch/i);
    expect(() => parsePracticeExercise(practice, 'wrong-practice-slug')).toThrow(/slug mismatch/i);
  });
});
