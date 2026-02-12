import exercisesData from '@generated/content/exercises.json';
import type { Exercise } from '../../shared/types';

let exercisesCache: Exercise[] | null = null;
let exercisesBySlugCache: Map<string, Exercise> | null = null;

export async function loadAllExercises(): Promise<Exercise[]> {
  if (exercisesCache) {
    return exercisesCache;
  }

  const exercises = [...(exercisesData as Exercise[])].sort((a, b) =>
    (a.name.en || a.name.de).localeCompare(b.name.en || b.name.de, 'en', {
      sensitivity: 'accent',
      caseFirst: 'lower',
    }),
  );

  exercisesCache = exercises;
  exercisesBySlugCache = new Map(exercises.map((exercise) => [exercise.slug, exercise]));

  return exercises;
}

export async function loadExerciseBySlug(slug: string): Promise<Exercise | undefined> {
  await loadAllExercises();
  return exercisesBySlugCache?.get(slug);
}

export function clearExercisesCache(): void {
  exercisesCache = null;
  exercisesBySlugCache = null;
}
