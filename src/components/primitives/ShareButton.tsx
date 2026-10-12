import { Share2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { t } from '@/lib/i18n';
import { Button } from './Button';

type Status = 'idle' | 'copied' | 'failed';

export function ShareButton() {
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
        {status === 'copied' ? t('share.copied') : status === 'failed' ? t('share.failed') : ''}
      </p>
    </div>
  );
}
