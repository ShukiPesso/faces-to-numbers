import { useEffect, type RefObject } from 'react';

/**
 * Measures the fixed bottom bars and writes their block sizes to `<html>` as
 * `--bottomnav-size` and `--stickybar-size` (design/02-tokens.md, R-4), so the page frame can
 * reserve space below the content. The sticky prev/next bar (F-15) is found by its
 * `[data-sticky-bar]` attribute; when absent its size is 0px. `key` re-runs the lookup on
 * route change. Without ResizeObserver (old browsers, jsdom) the token fallbacks stay.
 */
export function useReservedBottomSpace(navRef: RefObject<HTMLElement>, key: string): void {
  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') {
      return;
    }
    const root = document.documentElement;
    const nav = navRef.current;
    const stickyBar = document.querySelector<HTMLElement>('[data-sticky-bar]');

    const update = (): void => {
      root.style.setProperty('--bottomnav-size', `${nav ? nav.offsetHeight : 0}px`);
      root.style.setProperty('--stickybar-size', `${stickyBar ? stickyBar.offsetHeight : 0}px`);
    };

    const observer = new ResizeObserver(update);
    if (nav) observer.observe(nav);
    if (stickyBar) observer.observe(stickyBar);
    update();
    return () => observer.disconnect();
  }, [navRef, key]);
}
