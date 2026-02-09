import { redirect } from 'next/navigation';

type PageProps = {
  params: Promise<{ segments: string[] }>;
};

export default async function LegacyTechniqueRedirectPage({ params }: PageProps) {
  const { segments } = await params;
  const [slug, trainerId, entry, version, hanmi, direction, weapon] = segments;

  if (!slug) {
    redirect('/techniques');
  }

  const query = new URLSearchParams();

  if (trainerId) {
    query.set('trainer', trainerId);
  }

  if (entry && ['irimi', 'tenkan', 'omote', 'ura'].includes(entry)) {
    query.set('entry', entry);
  }

  if (version && hanmi && direction) {
    query.set('version', version);
    query.set('hanmi', hanmi);
    query.set('direction', direction);
    query.set('weapon', weapon ?? 'empty');
  }

  const queryString = query.toString();
  redirect(`/techniques/${encodeURIComponent(slug)}${queryString ? `?${queryString}` : ''}`);
}
