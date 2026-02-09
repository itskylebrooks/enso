import App from '../App';
import { detectRequestLocale } from './_lib/locale';

export default async function HomePage() {
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="home" initialSlug={null} />;
}
