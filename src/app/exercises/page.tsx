import App from '../../App';
import { detectRequestLocale } from '../_lib/locale';

export default async function ExercisesPage() {
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="practice" initialSlug={null} />;
}
