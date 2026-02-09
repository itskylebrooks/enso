import type { Exercise, Localized } from '../../shared/types';

const modules = import.meta.glob('/content/practice/*.json', { eager: true });

let exercisesCache: Exercise[] | null = null;
let exercisesBySlugCache: Map<string, Exercise> | null = null;

export async function loadAllExercises(): Promise<Exercise[]> {
  if (exercisesCache) {
    return exercisesCache;
  }

  const exercises: Exercise[] = [];

  for (const [filePath, module] of Object.entries(modules)) {
    try {
      const data = ((module as Record<string, unknown>).default || module) as Record<
        string,
        unknown
      >;

      const isLocalizedString = (value: unknown): value is Localized<string> => {
        if (!value || typeof value !== 'object') return false;
        const localized = value as Record<string, unknown>;
        return typeof localized.en === 'string' && typeof localized.de === 'string';
      };

      const isLocalizedStringArray = (value: unknown): value is Localized<string[]> => {
        if (!value || typeof value !== 'object') return false;
        const localized = value as Record<string, unknown>;
        if (!Array.isArray(localized.en) || !Array.isArray(localized.de)) return false;
        return (
          localized.en.every((entry) => typeof entry === 'string') &&
          localized.de.every((entry) => typeof entry === 'string')
        );
      };

      const record = data as Record<string, unknown>;
      const hasInvalidOptional =
        (record.howTo != null && !isLocalizedStringArray(record.howTo)) ||
        (record.safetyNotes != null && !isLocalizedStringArray(record.safetyNotes)) ||
        (record.description != null && !isLocalizedString(record.description)) ||
        (record.aikidoContext != null && !isLocalizedString(record.aikidoContext));

      if (
        typeof data !== 'object' ||
        data === null ||
        !record.id ||
        !record.slug ||
        !record.category ||
        !isLocalizedString(record.name) ||
        !isLocalizedString(record.summary) ||
        hasInvalidOptional
      ) {
        console.warn(`Invalid exercise in ${filePath}:`, data);
        continue;
      }

      exercises.push(data as Exercise);
    } catch (error) {
      console.error(`Error loading exercise from ${filePath}:`, error);
    }
  }

  const bySlug = new Map<string, Exercise>();
  for (const exercise of exercises) {
    if (bySlug.has(exercise.slug)) {
      console.warn(`Duplicate practice slug encountered for '${exercise.slug}', skipping.`);
      continue;
    }
    bySlug.set(exercise.slug, exercise);
  }

  const uniqueExercises = Array.from(bySlug.values());

  uniqueExercises.sort((a, b) =>
    (a.name.en || a.name.de).localeCompare(b.name.en || b.name.de, 'en', {
      sensitivity: 'accent',
      caseFirst: 'lower',
    }),
  );

  exercisesCache = uniqueExercises;
  exercisesBySlugCache = new Map();
  uniqueExercises.forEach((exercise) => {
    exercisesBySlugCache!.set(exercise.slug, exercise);
  });

  return uniqueExercises;
}

export async function loadExerciseBySlug(slug: string): Promise<Exercise | undefined> {
  await loadAllExercises();
  return exercisesBySlugCache?.get(slug);
}

export function clearPracticeCache(): void {
  exercisesCache = null;
  exercisesBySlugCache = null;
}
