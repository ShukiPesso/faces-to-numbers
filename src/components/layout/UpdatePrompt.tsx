import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { t } from '@/lib/i18n';
import { dismissUpdate, updateServiceWorker, usePwaState } from '@/pwa';

/**
 * Offers the waiting new version (design/components/layout.md §7, ADR-005). Never reloads by
 * itself and never moves focus; the page reloads only after the visitor taps the update button.
 */
export function UpdatePrompt() {
  const { needRefresh } = usePwaState();
  const [busy, setBusy] = useState(false);

  if (!needRefresh) {
    return null;
  }

  const onUpdate = (): void => {
    setBusy(true);
    updateServiceWorker().catch(() => {
      setBusy(false);
    });
  };

  return (
    <div className="px-4 md:px-7">
      <div
        data-testid="update-prompt"
        className="mx-auto my-3 max-w-content rounded-md border-hairline border-border bg-surface px-4 py-3 text-base text-ink"
      >
        <p role="status">{t('update.available')}</p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Button variant="secondary" icon={RefreshCw} busy={busy} onClick={onUpdate}>
            {t('update.reload')}
          </Button>
          <Button variant="quiet" onClick={dismissUpdate}>
            {t('common.close')}
          </Button>
        </div>
      </div>
    </div>
  );
}
