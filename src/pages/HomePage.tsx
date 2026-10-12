import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/lib/i18n';
import { PageTitle } from './PageTitle';

/** Home (/) — stub; F-13 replaces it. */
export function HomePage() {
  const title = t('app.name');
  useDocumentTitle(title);
  return <PageTitle>{title}</PageTitle>;
}
