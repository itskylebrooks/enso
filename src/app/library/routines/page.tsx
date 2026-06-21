import App from '../../../App';
import { detectRequestLocale } from '../../_lib/locale';

export default async function LibraryRoutinesPage() {
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="libraryRoutines" initialSlug={null} />;
}
