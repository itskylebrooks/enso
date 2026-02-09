import App from '../../App';
import { detectRequestLocale } from '../_lib/locale';

export default async function TechniquesPage() {
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="library" initialSlug={null} />;
}
