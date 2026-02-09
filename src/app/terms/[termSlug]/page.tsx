import App from '../../../App';
import { loadAllGlossaryTerms } from '../../../lib/content/loaders/glossary';
import { detectRequestLocale } from '../../_lib/locale';

export async function generateStaticParams() {
  const terms = await loadAllGlossaryTerms();
  return terms.map((term) => ({ termSlug: term.slug }));
}

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ termSlug: string }>;
};

export default async function TermDetailPage({ params }: PageProps) {
  const { termSlug } = await params;
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="terms" initialSlug={termSlug} />;
}
