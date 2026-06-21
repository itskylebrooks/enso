import App from '../../App';
import { detectRequestLocale } from '../_lib/locale';

export default async function ExamsPage() {
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="exams" initialSlug={null} />;
}
