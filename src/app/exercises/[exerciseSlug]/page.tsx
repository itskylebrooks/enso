import App from '../../../App';
import { loadAllPracticeExercises } from '../../../lib/content/loaders/practice';
import { detectRequestLocale } from '../../_lib/locale';

export async function generateStaticParams() {
  const exercises = await loadAllPracticeExercises();
  return exercises.map((exercise) => ({ exerciseSlug: exercise.slug }));
}

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ exerciseSlug: string }>;
};

export default async function ExerciseDetailPage({ params }: PageProps) {
  const { exerciseSlug } = await params;
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="practice" initialSlug={exerciseSlug} />;
}
