import { loadAllGlossaryTerms } from './loaders/glossary';
import { loadAllPracticeExercises } from './loaders/practice';
import { loadAllTechniques } from './loaders/techniques';

export const validateAllContent = async (): Promise<{
  techniques: number;
  glossaryTerms: number;
  practiceExercises: number;
}> => {
  const [techniques, glossaryTerms, practiceExercises] = await Promise.all([
    loadAllTechniques(),
    loadAllGlossaryTerms(),
    loadAllPracticeExercises(),
  ]);

  return {
    techniques: techniques.length,
    glossaryTerms: glossaryTerms.length,
    practiceExercises: practiceExercises.length,
  };
};
