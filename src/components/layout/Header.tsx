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
        className="inline-flex min-h-[var(--tap-min)] items-center gap-2 font-display text-lg font-display-bold text-primary no-underline hover:underline lg:text-xl"
      >
        <img
          src="./icons/mark.svg"
          alt=""
          aria-hidden="true"
          className="size-[var(--text-xl)] shrink-0"
          width={20}
          height={20}
        />
        {t('app.name')}
      </Link>
      <div data-slot="header-actions" className="flex items-center gap-2">
        <ReadAloudToggle />
      </div>
    </header>
  );
}
