import { Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { t } from '@/lib/i18n';
import { Button } from './Button';

type Status = 'idle' | 'copied' | 'failed';

/** Shared look of the compact action tiles in the station action row (share + navigation). */
export const ACTION_TILE =
  'inline-flex min-h-[3.5rem] flex-col items-center justify-center gap-1 rounded-md border-hairline border-line-strong bg-surface px-1 py-2 font-body text-sm font-semibold text-primary no-underline transition-colors duration-[var(--duration-fast)] hover:bg-bg hover:underline';

export interface ShareButtonProps {
  /** Render as a compact tile for the station action row; the status line spans the row below. */
  compact?: boolean;
}

export function ShareButton({ compact = false }: ShareButtonProps) {
  const [status, setStatus] = useState<Status>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function share(): Promise<void> {
    clearTimeout(timer.current);
    setStatus('idle');
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ title: document.title, url: location.href });
        return;
      }
      await navigator.clipboard.writeText(location.href);
      setStatus('copied');
      timer.current = setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setStatus('failed');
    }
  }

  const statusText =
    status === 'copied' ? t('share.copied') : status === 'failed' ? t('share.failed') : '';

  if (compact) {
    return (
      <>
        <button
          type="button"
          data-testid="share-button"
          className={ACTION_TILE}
          onClick={() => {
            void share();
          }}
        >
          <Share2 className="size-icon-md shrink-0" aria-hidden="true" focusable="false" />
          <span>{t('share.button')}</span>
        </button>
        <p
          role="status"
          aria-live="polite"
          className="order-last col-span-full min-h-[1lh] font-body text-sm text-ink-muted"
        >
          {statusText}
        </p>
      </>
    );
  }

  return (
    <div>
      <Button
        variant="secondary"
        icon={Share2}
        data-testid="share-button"
        onClick={() => {
          void share();
        }}
      >
        {t('share.button')}
      </Button>
      <p
        role="status"
        aria-live="polite"
        className="mt-2 min-h-[1lh] font-body text-sm text-ink-muted"
      >
        {statusText}
      </p>
    </div>
  );
}
