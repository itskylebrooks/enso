import App from '../../App';
import { detectRequestLocale } from '../_lib/locale';

export default async function TeachPage() {
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="teach" initialSlug={null} />;
}
