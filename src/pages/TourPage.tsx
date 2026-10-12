import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/lib/i18n';
import { PageTitle } from './PageTitle';

/** Tour overview (/tour) — stub; F-14 replaces it. */
export function TourPage() {
  const title = t('tour.title');
  useDocumentTitle(title);
  return <PageTitle>{title}</PageTitle>;
}
