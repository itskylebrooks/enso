import App from '../../../App';
import { detectRequestLocale } from '../../_lib/locale';

export default async function ExamsAdvancedPage() {
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="examsAdvanced" initialSlug={null} />;
}
