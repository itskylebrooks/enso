import App from '../../../../App';
import { loadAllChildrenGames } from '../../../../lib/content/loaders/childrenGames';
import { detectRequestLocale } from '../../../_lib/locale';

export async function generateStaticParams() {
  const games = await loadAllChildrenGames();
  return games.map((game) => ({ gameSlug: game.slug }));
}

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ gameSlug: string }>;
};

export default async function ChildrenGameDetailPage({ params }: PageProps) {
  const { gameSlug } = await params;
  const initialLocale = await detectRequestLocale();
  return (
    <App initialLocale={initialLocale} initialRoute="teachChildrenGames" initialSlug={gameSlug} />
  );
}
