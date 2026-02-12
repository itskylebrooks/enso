import App from '../../../App';
import { loadAllExercises } from '../../../lib/content/loaders/exercises';
import { detectRequestLocale } from '../../_lib/locale';

export async function generateStaticParams() {
  const exercises = await loadAllExercises();
  return exercises.map((exercise) => ({ exerciseSlug: exercise.slug }));
}

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ exerciseSlug: string }>;
};

export default async function ExerciseDetailPage({ params }: PageProps) {
  const { exerciseSlug } = await params;
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="exercises" initialSlug={exerciseSlug} />;
}
