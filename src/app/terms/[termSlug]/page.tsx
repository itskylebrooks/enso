import App from '../../../App';
import { loadAllTerms } from '../../../lib/content/loaders/terms';
import { detectRequestLocale } from '../../_lib/locale';

export async function generateStaticParams() {
  const terms = await loadAllTerms();
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
