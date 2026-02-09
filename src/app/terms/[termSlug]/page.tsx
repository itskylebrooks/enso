import App from '../../../App';
import { loadAllGlossaryTerms } from '../../../lib/content/loaders/glossary';

export async function generateStaticParams() {
  const terms = await loadAllGlossaryTerms();
  return terms.map((term) => ({ termSlug: term.slug }));
}

export const dynamicParams = false;

export default function TermDetailPage() {
  return <App />;
}
