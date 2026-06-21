import App from '../../../App';
import { detectRequestLocale } from '../../_lib/locale';

export default async function StudyLearnPage() {
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="studyLearn" initialSlug={null} />;
}
