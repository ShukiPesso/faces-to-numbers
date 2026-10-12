import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/lib/i18n';
import { PageTitle } from './PageTitle';

/** About (/about) — stub; F-17 replaces it. */
export function AboutPage() {
  const title = t('about.title');
  useDocumentTitle(title);
  return <PageTitle>{title}</PageTitle>;
}
