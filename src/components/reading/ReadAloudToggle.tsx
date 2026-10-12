import { Volume2 } from 'lucide-react';
import { useState } from 'react';
import { usePrefs } from '@/app/prefsContext';
import { t } from '@/lib/i18n';

/** Header toggle for read-aloud mode (larger text). The visible label never changes. */
export function ReadAloudToggle() {
  const { readAloud, setReadAloud } = usePrefs();
  const [announcement, setAnnouncement] = useState('');

  const toggle = () => {
    const next = !readAloud;
    setReadAloud(next);
    setAnnouncement(next ? t('readAloud.on') : t('readAloud.off'));
  };

  return (
    <>
      <button
        type="button"
        aria-pressed={readAloud}
        data-testid="read-aloud-toggle"
        onClick={toggle}
        className={[
          'inline-flex min-h-[var(--tap-min)] min-w-[var(--tap-min)] items-center justify-center gap-2 rounded-md border-hairline border-primary px-3 font-body text-sm leading-sm hover:underline',
          readAloud
            ? 'bg-primary font-semibold text-primary-ink'
            : 'bg-surface font-normal text-primary',
        ].join(' ')}
      >
        <Volume2 className="size-icon-md shrink-0" aria-hidden="true" focusable="false" />
        <span>{t('readAloud.label')}</span>
      </button>
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </>
  );
}
