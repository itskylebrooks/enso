import App from '../../App';
import { detectRequestLocale } from '../_lib/locale';

export default async function TermsPage() {
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="terms" initialSlug={null} />;
}
