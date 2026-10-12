import { Check, Route } from 'lucide-react';
import { Link, useLocation, useMatch } from 'react-router-dom';
import { isNavItemCurrent, NAV_ITEMS } from '@/app/navItems';
import { getStations } from '@/content';
import { stationPath } from '@/lib/links';
import { t } from '@/lib/i18n';
import { getVisited } from '@/lib/storage';

/**
 * Navigation at lg and up: the four primary links and the route as an ordered station list
 * (order, title, visited mark). Hidden below lg, where BottomNav takes over.
 */
export function SideNav() {
  const { pathname } = useLocation();
  const stationMatch = useMatch('/station/:slug');
  const currentSlug = stationMatch?.params.slug;
  const stations = getStations();
  const visited = getVisited();

  return (
    <nav
      aria-label={t('nav.label')}
      data-testid="side-nav"
      className="sticky top-0 hidden max-h-[100dvh] w-sidenav shrink-0 overflow-y-auto border-e-hairline border-border bg-bg px-4 py-6 lg:block"
    >
      <ul className="flex flex-col gap-2">
        {NAV_ITEMS.map((item) => {
          const current = isNavItemCurrent(item, pathname);
          const Icon = item.icon;
          return (
            <li key={item.key}>
              <Link
                to={item.to}
                aria-current={current ? 'page' : undefined}
                className={`group relative flex min-h-[var(--tap-min)] items-center gap-2 rounded-md px-3 text-sm no-underline hover:bg-surface ${
                  current ? 'font-semibold text-primary' : 'font-regular text-ink'
                }`}
              >
                {current && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 start-0 border-s-accent-line border-primary"
                  />
                )}
                <Icon
                  aria-hidden="true"
                  focusable="false"
                  strokeWidth={2}
                  className="size-icon-md shrink-0"
                />
                <span className="group-hover:underline">{t(item.label)}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div aria-hidden="true" className="my-6 border-t-hairline border-border" />

      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-muted">
        <Route aria-hidden="true" focusable="false" strokeWidth={1.75} className="size-icon-sm" />
        {t('tour.title')}
      </h2>
      <ol className="flex flex-col gap-1">
        {stations.map((station) => {
          const current = station.slug === currentSlug;
          const isVisited = visited.includes(station.id);
          return (
            <li key={station.id}>
              <Link
                to={stationPath(station.slug)}
                aria-current={current ? 'page' : undefined}
                className={`group flex min-h-[var(--tap-min)] items-center gap-3 rounded-md px-3 py-2 text-sm no-underline hover:bg-surface ${
                  current ? 'font-semibold text-primary' : 'font-regular text-ink'
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full border-hairline text-xs ${
                    current
                      ? 'border-primary bg-primary text-primary-ink outline outline-1 outline-offset-2 outline-primary'
                      : 'border-ink-muted bg-surface text-ink'
                  }`}
                >
                  <bdi>{station.order}</bdi>
                </span>
                <span className="sr-only">
                  {t('tour.stationOf', { n: station.order, total: stations.length })}
                </span>
                <span className="group-hover:underline">{station.title}</span>
                {isVisited && (
                  <>
                    <Check
                      aria-hidden="true"
                      focusable="false"
                      strokeWidth={1.75}
                      className="size-icon-sm shrink-0 text-ink-muted"
                    />
                    <span className="sr-only">{t('tour.visited')}</span>
                  </>
                )}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
