import App from '../../../App';
import { loadAllTechniques } from '../../../lib/content/loaders/techniques';

export async function generateStaticParams() {
  const techniques = await loadAllTechniques();
  return techniques.map((technique) => ({ techniqueSlug: technique.slug }));
}

export const dynamicParams = false;

export default function TechniqueDetailPage() {
  return <App />;
}
