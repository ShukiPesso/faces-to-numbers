import { useEffect } from 'react';
import { useRouteError } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/lib/i18n';

/** Router error element: a calm message and a reload button. Replaces the page frame. */
export function ErrorBoundary() {
  const error = useRouteError();
  const title = t('error.title');
  useDocumentTitle(title);

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main id="main" tabIndex={-1} className="mx-auto max-w-content px-4 py-7 md:px-7">
      <h1 className="font-display text-2xl font-display-bold text-ink">{title}</h1>
      <p className="mt-4 max-w-measure text-base">{t('error.body')}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 inline-flex min-h-[var(--tap-min)] items-center rounded-md bg-primary px-5 text-base font-semibold text-primary-ink hover:underline"
      >
        {t('error.reload')}
      </button>
    </main>
  );
}
