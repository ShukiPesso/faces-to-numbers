import { useEffect, useRef, type MouseEvent } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { SideNav } from '@/components/layout/SideNav';
import { t } from '@/lib/i18n';
import { useReservedBottomSpace } from './useReservedBottomSpace';

/**
 * Page frame (design/components/layout.md §0). DOM order: skip link, Header, SideNav, banner
 * slot, main, Footer, BottomNav. Below lg the BottomNav is fixed and space is reserved for it;
 * at lg and up the SideNav sits in the start column beside the content.
 */
export function AppLayout() {
  const location = useLocation();
  const routeKey = `${location.pathname}${location.search}`;
  const mainRef = useRef<HTMLElement>(null);
  const bottomNavRef = useRef<HTMLElement>(null);
  const previousRouteKey = useRef(routeKey);

  useReservedBottomSpace(bottomNavRef, routeKey);

  // On route change (not on first load): scroll to top and move focus to <main>, unless the new
  // page already moved focus into its own content (e.g. /tour?locate=1 focuses its button).
  useEffect(() => {
    if (previousRouteKey.current === routeKey) {
      return;
    }
    previousRouteKey.current = routeKey;
    window.scrollTo(0, 0);
    const main = mainRef.current;
    if (main && !main.contains(document.activeElement)) {
      main.focus({ preventScroll: true });
    }
  }, [routeKey]);

  // With hash routing, following href="#main" would navigate to the route "main".
  // Keep the real href for semantics and move focus ourselves.
  const onSkip = (event: MouseEvent<HTMLAnchorElement>): void => {
    event.preventDefault();
    // Focusing without preventScroll also scrolls <main> into view.
    mainRef.current?.focus();
  };

  return (
    <div className="flex min-h-[100dvh] flex-col pb-[calc(var(--bottomnav-size)+var(--stickybar-size)+env(safe-area-inset-bottom)+var(--space-6))] lg:pb-0">
      <a
        href="#main"
        data-testid="skip-link"
        onClick={onSkip}
        className="sr-only rounded-md bg-primary text-base font-semibold text-primary-ink focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-skip focus:inline-flex focus:min-h-[var(--tap-min)] focus:items-center focus:px-5 focus:py-2"
      >
        {t('app.skipToContent')}
      </a>
      <Header />
      <div className="flex flex-1 flex-col lg:flex-row">
        <SideNav />
        <div className="flex min-w-0 flex-1 flex-col">
          <div data-slot="banners" />
          <main id="main" ref={mainRef} tabIndex={-1} className="w-full flex-1 px-4 py-6 md:px-7">
            <div className="mx-auto max-w-content">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
      <Footer />
      <BottomNav ref={bottomNavRef} />
    </div>
  );
}
