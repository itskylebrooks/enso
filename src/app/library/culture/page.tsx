import App from '../../../App';
import { detectRequestLocale } from '../../_lib/locale';

export default async function LibraryCulturePage() {
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="libraryCulture" initialSlug={null} />;
}
