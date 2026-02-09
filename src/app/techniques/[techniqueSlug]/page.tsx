import App from '../../../App';
import { loadAllTechniques } from '../../../lib/content/loaders/techniques';
import { detectRequestLocale } from '../../_lib/locale';

export async function generateStaticParams() {
  const techniques = await loadAllTechniques();
  return techniques.map((technique) => ({ techniqueSlug: technique.slug }));
}

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ techniqueSlug: string }>;
};

export default async function TechniqueDetailPage({ params }: PageProps) {
  const { techniqueSlug } = await params;
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="techniques" initialSlug={techniqueSlug} />;
}
