import { loadAllExercises } from './loaders/exercises';
import { loadAllTerms } from './loaders/terms';
import { loadAllTechniques } from './loaders/techniques';

export const validateAllContent = async (): Promise<{
  techniques: number;
  terms: number;
  exercises: number;
}> => {
  const [techniques, terms, exercises] = await Promise.all([
    loadAllTechniques(),
    loadAllTerms(),
    loadAllExercises(),
  ]);

  return {
    techniques: techniques.length,
    terms: terms.length,
    exercises: exercises.length,
  };
};
