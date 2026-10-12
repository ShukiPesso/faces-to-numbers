import { useParams } from 'react-router-dom';
import { getStationBySlug } from '@/content';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/lib/i18n';
import { NotFoundPage } from './NotFoundPage';
import { PageTitle } from './PageTitle';

/** Station page (/station/:slug) — stub; F-15 replaces it. Unknown slug → NotFoundPage. */
export function StationPage() {
  const { slug = '' } = useParams();
  const station = getStationBySlug(slug);
  useDocumentTitle(station ? station.title : t('notFound.title'));
  return station ? <PageTitle>{station.title}</PageTitle> : <NotFoundPage />;
}
