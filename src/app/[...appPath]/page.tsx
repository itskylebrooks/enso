import App from '../../App';
import { parseLocation } from '../../shared/navigation/appRoutes';
import { detectRequestLocale } from '../_lib/locale';

type PageProps = {
  params: Promise<{ appPath: string[] }>;
};

export default async function CatchAllPage({ params }: PageProps) {
  const { appPath } = await params;
  const pathname = `/${appPath.join('/')}`;
  const initialLocale = await detectRequestLocale();
  const { route, slug } = parseLocation(pathname);

  return <App initialLocale={initialLocale} initialRoute={route} initialSlug={slug} />;
}
