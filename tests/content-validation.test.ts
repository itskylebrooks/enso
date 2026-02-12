import { describe, expect, it } from 'vitest';
import exercisesData from '../src/generated/content/exercises.json';
import termsData from '../src/generated/content/terms.json';
import techniquesData from '../src/generated/content/techniques.json';
import { parseGlossaryTerm } from '../src/lib/content/schemas/glossary';
import { parsePracticeExercise } from '../src/lib/content/schemas/practice';
import { parseTechnique } from '../src/lib/content/schemas/technique';

describe('content schema validation', () => {
  it('accepts valid generated content items', () => {
    const technique = techniquesData[0];
    const term = termsData[0];
    const exercise = exercisesData[0];

    expect(parseTechnique(technique, technique.slug).slug).toBe(technique.slug);
    expect(parseGlossaryTerm(term, term.slug).slug).toBe(term.slug);
    expect(parsePracticeExercise(exercise, exercise.slug).slug).toBe(exercise.slug);
  });

  it('fails on filename/slug mismatch', () => {
    const technique = techniquesData[0];
    const term = termsData[0];
    const exercise = exercisesData[0];

    expect(() => parseTechnique(technique, 'wrong-technique-slug')).toThrow(/slug mismatch/i);
    expect(() => parseGlossaryTerm(term, 'wrong-term-slug')).toThrow(/slug mismatch/i);
    expect(() => parsePracticeExercise(exercise, 'wrong-practice-slug')).toThrow(/slug mismatch/i);
  });
});
