import { redirect } from 'next/navigation';
import { loadAllTechniques } from '../../../lib/content/loaders/techniques';

export async function generateStaticParams() {
  const techniques = await loadAllTechniques();
  return techniques.map((technique) => ({ techniqueSlug: technique.slug }));
}

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ techniqueSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const toQueryString = (params: Record<string, string | string[] | undefined>): string => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === 'string') {
      query.set(key, value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item) => query.append(key, item));
    }
  });

  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
};

export default async function LegacyTechniqueDetailPage({ params, searchParams }: PageProps) {
  const { techniqueSlug } = await params;
  const queryString = toQueryString(await searchParams);
  redirect(`/techniques/${encodeURIComponent(techniqueSlug)}${queryString}`);
}
