import App from '../../../App';
import { loadAllPracticeExercises } from '../../../lib/content/loaders/practice';

export async function generateStaticParams() {
  const exercises = await loadAllPracticeExercises();
  return exercises.map((exercise) => ({ exerciseSlug: exercise.slug }));
}

export const dynamicParams = false;

export default function ExerciseDetailPage() {
  return <App />;
}
