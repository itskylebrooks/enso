import App from '../../../App';
import { detectRequestLocale } from '../../_lib/locale';

export default async function ChildrenGamesPage() {
  const initialLocale = await detectRequestLocale();
  return <App initialLocale={initialLocale} initialRoute="teachChildrenGames" initialSlug={null} />;
}
