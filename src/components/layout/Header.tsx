import { Link, useLocation } from 'react-router-dom';
import { ReadAloudToggle } from '@/components/reading/ReadAloudToggle';
import { t } from '@/lib/i18n';

/** App name linking home, plus the header-actions slot (F-08 adds ReadAloudToggle there). */
export function Header() {
  const { pathname } = useLocation();
  return (
    <header className="flex items-center justify-between gap-2 border-b-hairline border-border bg-bg px-4 py-3 md:px-7">
      <Link
        to="/"
        aria-current={pathname === '/' ? 'page' : undefined}
        className="inline-flex min-h-[var(--tap-min)] items-center font-display text-lg font-display-bold text-primary no-underline hover:underline lg:text-xl"
      >
        {t('app.name')}
      </Link>
      <div data-slot="header-actions" className="flex items-center gap-2">
        <ReadAloudToggle />
      </div>
    </header>
  );
}
