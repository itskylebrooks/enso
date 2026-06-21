import App from '../../../App';
import { detectRequestLocale } from '../../_lib/locale';

export default async function LibraryFormsPage() {
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="libraryForms" initialSlug={null} />;
}
