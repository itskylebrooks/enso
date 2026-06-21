import App from '../../../App';
import { parseLocation } from '../../../shared/navigation/appRoutes';
import { detectRequestLocale } from '../../_lib/locale';

type PageProps = {
  params: Promise<{ examGrade: string }>;
};

export default async function ExamGradeRoutePage({ params }: PageProps) {
  const { examGrade } = await params;
  const initialLocale = await detectRequestLocale();
  const { route, slug } = parseLocation(`/exams/${examGrade}`);

  return <App initialLocale={initialLocale} initialRoute={route} initialSlug={slug} />;
}
