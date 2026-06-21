import App from '../../../App';
import { detectRequestLocale } from '../../_lib/locale';

export default async function ExamsDanPage() {
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="examsDan" initialSlug={null} />;
}
