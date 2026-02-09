import { redirect } from 'next/navigation';
import { loadAllGlossaryTerms } from '../../../lib/content/loaders/glossary';

export async function generateStaticParams() {
  const terms = await loadAllGlossaryTerms();
  return terms.map((term) => ({ termSlug: term.slug }));
}

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ termSlug: string }>;
};

export default async function LegacyGlossaryDetailPage({ params }: PageProps) {
  const { termSlug } = await params;
  redirect(`/terms/${encodeURIComponent(termSlug)}`);
}
