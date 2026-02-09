import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Exercise } from '../../../shared/types';
import { parsePracticeExercise } from '../schemas/practice';

const practiceDir = path.join(process.cwd(), 'content', 'practice');

const readPracticeFiles = async (): Promise<string[]> => {
  const entries = await readdir(practiceDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.json'))
    .map((entry) => path.join(practiceDir, entry.name))
    .sort();
};

export const loadAllPracticeExercises = async (): Promise<Exercise[]> => {
  const files = await readPracticeFiles();
  const exercises: Exercise[] = [];
  const seenSlugs = new Set<string>();

  for (const filePath of files) {
    const raw = await readFile(filePath, 'utf8');
    const json = JSON.parse(raw) as unknown;
    const expectedSlug = path.basename(filePath, '.json').replace(/^ex-\d+-/, '');
    const exercise = parsePracticeExercise(json, expectedSlug);

    if (seenSlugs.has(exercise.slug)) {
      throw new Error(`Duplicate practice slug detected: ${exercise.slug}`);
    }

    seenSlugs.add(exercise.slug);
    exercises.push(exercise);
  }

  exercises.sort((a, b) =>
    (a.name.en || a.name.de).localeCompare(b.name.en || b.name.de, 'en', {
      sensitivity: 'accent',
    }),
  );

  return exercises;
};

export const loadPracticeExerciseBySlug = async (slug: string): Promise<Exercise | undefined> => {
  const exercises = await loadAllPracticeExercises();
  return exercises.find((exercise) => exercise.slug === slug);
};
