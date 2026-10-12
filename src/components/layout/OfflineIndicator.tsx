import { WifiOff } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { t } from '@/lib/i18n';
import { dismissOfflineReady, usePwaState } from '@/pwa';

const PANEL =
  'mx-auto flex max-w-content flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md border-hairline border-border bg-surface px-4 py-3 text-sm text-ink shadow-card';

/**
 * Out of the page flow, so showing or hiding it never moves content. Below lg it sits above the
 * BottomNav and, on station pages, above the sticky previous/next bar (both sizes are measured
 * into these two custom properties by useReservedBottomSpace; the nav size already includes the
 * safe-area inset). From lg it sits at the bottom of the reading column, beside the SideNav.
 */
const DOCK =
  'pointer-events-none fixed inset-x-0 bottom-[calc(var(--bottomnav-size)+var(--stickybar-size)+var(--space-2))] z-sticky px-4 md:px-7 lg:bottom-[calc(var(--space-4)+env(safe-area-inset-bottom))] lg:start-[var(--sidenav-width)] lg:end-0';

/**
 * Says plainly whether there is a connection, and once per visit that the tour is saved on the
 * device (design/components/layout.md §6). The live region is always present; empty = zero height.
 */
export function OfflineIndicator() {
  const online = useOnlineStatus();
  const { offlineReady } = usePwaState();
  const showOffline = !online;
  const showReady = online && offlineReady;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="offline-indicator"
      className={showOffline || showReady ? DOCK : undefined}
    >
      {showOffline ? (
        <div className={`${PANEL} pointer-events-auto`}>
          <span className="inline-flex items-center gap-2">
            <WifiOff
              className="size-icon-sm shrink-0 text-ink-muted"
              strokeWidth={1.75}
              aria-hidden="true"
              focusable="false"
            />
            <span>{t('offline.now')}</span>
          </span>
        </div>
      ) : null}
      {showReady ? (
        <div className={`${PANEL} pointer-events-auto`}>
          <span>{t('offline.ready')}</span>
          <Button variant="quiet" onClick={dismissOfflineReady}>
            {t('common.close')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
