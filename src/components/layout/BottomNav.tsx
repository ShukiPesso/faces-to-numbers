import { forwardRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { isNavItemCurrent, NAV_ITEMS } from '@/app/navItems';
import { t } from '@/lib/i18n';

/** Primary navigation below lg: four labelled links fixed to the bottom of the viewport. */
export const BottomNav = forwardRef<HTMLElement>(function BottomNav(_props, ref) {
  const { pathname } = useLocation();
  return (
    <nav
      ref={ref}
      aria-label={t('nav.label')}
      data-testid="bottom-nav"
      className="fixed inset-x-0 bottom-0 z-nav border-t-hairline border-border bg-surface pb-[calc(var(--space-1)+env(safe-area-inset-bottom))] shadow-card lg:hidden"
    >
      <ul className="mx-auto grid max-w-content grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const current = isNavItemCurrent(item, pathname);
          const Icon = item.icon;
          return (
            <li key={item.key} className="flex">
              <Link
                to={item.to}
                aria-current={current ? 'page' : undefined}
                className={`group relative flex min-h-[var(--tap-min)] flex-1 flex-col items-center gap-1 py-2 text-center text-xs no-underline ${
                  current ? 'font-semibold text-primary' : 'font-regular text-ink-muted'
                }`}
              >
                {current && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-1/4 top-0 border-t-accent-line border-primary"
                  />
                )}
                <Icon
                  aria-hidden="true"
                  focusable="false"
                  strokeWidth={2}
                  className="size-icon-md"
                />
                <span className="group-hover:underline">{t(item.label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});
