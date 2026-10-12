import { WifiOff } from 'lucide-react';
import { Button } from '@/components/primitives/Button';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { t } from '@/lib/i18n';
import { dismissOfflineReady, usePwaState } from '@/pwa';

const PANEL =
  'mx-auto my-3 flex max-w-content flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-md border-hairline border-border bg-surface px-4 py-3 text-sm text-ink';

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
      className={showOffline || showReady ? 'px-4 md:px-7' : undefined}
    >
      {showOffline ? (
        <div className={PANEL}>
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
        <div className={PANEL}>
          <span>{t('offline.ready')}</span>
          <Button variant="quiet" onClick={dismissOfflineReady}>
            {t('common.close')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
