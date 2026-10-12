import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/lib/i18n';
import { PageTitle } from './PageTitle';

/** Shown for unknown routes and for unknown station slugs / person ids. */
export function NotFoundPage() {
  const title = t('notFound.title');
  useDocumentTitle(title);
  return (
    <>
      <PageTitle>{title}</PageTitle>
      <p className="mt-4 max-w-measure text-base">{t('notFound.body')}</p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-[var(--tap-min)] items-center font-semibold text-primary underline"
      >
        {t('notFound.home')}
      </Link>
    </>
  );
}
