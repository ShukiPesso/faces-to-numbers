import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/lib/i18n';
import { PageTitle } from './PageTitle';

/** Sources (/sources) — stub; F-17 replaces it. */
export function SourcesPage() {
  const title = t('sources.title');
  useDocumentTitle(title);
  return <PageTitle>{title}</PageTitle>;
}
