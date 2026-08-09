import { loadAllExercises } from './loaders/exercises';
import { loadAllTerms } from './loaders/terms';
import { loadAllTechniques } from './loaders/techniques';
import { loadAllChildrenGames } from './loaders/childrenGames';

export const validateAllContent = async (): Promise<{
  techniques: number;
  terms: number;
  exercises: number;
  childrenGames: number;
}> => {
  const [techniques, terms, exercises, childrenGames] = await Promise.all([
    loadAllTechniques(),
    loadAllTerms(),
    loadAllExercises(),
    loadAllChildrenGames(),
  ]);

  return {
    techniques: techniques.length,
    terms: terms.length,
    exercises: exercises.length,
    childrenGames: childrenGames.length,
  };
};
