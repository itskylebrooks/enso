import { redirect } from 'next/navigation';
import { loadAllPracticeExercises } from '../../../lib/content/loaders/practice';

export async function generateStaticParams() {
  const exercises = await loadAllPracticeExercises();
  return exercises.map((exercise) => ({ exerciseSlug: exercise.slug }));
}

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ exerciseSlug: string }>;
};

export default async function LegacyPracticeDetailPage({ params }: PageProps) {
  const { exerciseSlug } = await params;
  redirect(`/exercises/${encodeURIComponent(exerciseSlug)}`);
}
