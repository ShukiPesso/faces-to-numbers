import { VolumeX } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/primitives';
import { t } from '@/lib/i18n';

export interface SilenceMomentProps {
  seconds: number;
  prompt: string;
}

type SilenceState = 'idle' | 'running' | 'ended';

export function SilenceMoment({ seconds, prompt }: SilenceMomentProps) {
  const titleId = useId();
  const [state, setState] = useState<SilenceState>('idle');
  const [announcement, setAnnouncement] = useState('');
  const panelRef = useRef<HTMLElement>(null);
  const endedRef = useRef<HTMLParagraphElement>(null);

  // One timeout, no ticking: nothing on screen changes while it runs.
  useEffect(() => {
    if (state !== 'running') return undefined;
    const id = setTimeout(() => {
      setState('ended');
    }, seconds * 1000);
    return () => {
      clearTimeout(id);
    };
  }, [state, seconds]);

  useEffect(() => {
    if (state === 'running') {
      setAnnouncement(t('silence.title'));
      panelRef.current?.focus();
    } else if (state === 'ended') {
      setAnnouncement(t('silence.ended'));
      endedRef.current?.focus();
    }
  }, [state]);

  const startLabel = t('silence.start', { seconds: '\u0000' }).split('\u0000');

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      aria-labelledby={titleId}
      data-testid={state === 'running' ? 'silence-timer' : undefined}
      data-night=""
      className="my-10 flex min-h-[20rem] flex-col items-center justify-center rounded-lg bg-night px-5 py-9 text-center text-ink outline-none md:px-7"
    >
      <h2 id={titleId} className="font-display font-display-bold text-xl text-ink">
        {t('silence.title')}
      </h2>
      {state === 'ended' ? (
        <p
          ref={endedRef}
          tabIndex={-1}
          className="mt-4 max-w-measure font-display text-lg text-ink outline-none"
        >
          {t('silence.ended')}
        </p>
      ) : (
        <>
          <p className="mt-4 max-w-measure font-display text-lg text-ink">{prompt}</p>
          <div className="mt-7 w-full md:w-auto">
            {state === 'idle' ? (
              <Button
                variant="primary"
                icon={VolumeX}
                fullWidth
                onClick={() => {
                  setState('running');
                }}
                data-testid="silence-start"
              >
                {startLabel[0]}
                <bdi>{seconds}</bdi>
                {startLabel[1]}
              </Button>
            ) : (
              <Button
                variant="secondary"
                icon={VolumeX}
                fullWidth
                onClick={() => {
                  setState('ended');
                }}
              >
                {t('silence.stop')}
              </Button>
            )}
          </div>
        </>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
