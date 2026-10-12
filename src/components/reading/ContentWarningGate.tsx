import { TriangleAlert } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/primitives';
import type { Sensitivity } from '@/content/schema';
import { t } from '@/lib/i18n';
import { isGateOpened, openGate } from '@/lib/storage';

export interface ContentWarningGateProps {
  personId: string;
  sensitivity: Sensitivity;
  children: ReactNode;
}

type GateState = 'closed' | 'skipped' | 'opened';

export function ContentWarningGate({ personId, sensitivity, children }: ContentWarningGateProps) {
  const titleId = useId();
  const [state, setState] = useState<GateState>(() =>
    sensitivity === 'graphic' && isGateOpened(personId) ? 'opened' : 'closed',
  );
  const revealedRef = useRef<HTMLDivElement>(null);
  const afterRef = useRef<HTMLSpanElement>(null);
  const moveFocus = useRef<'reveal' | 'after' | null>(null);

  useEffect(() => {
    if (moveFocus.current === 'reveal') revealedRef.current?.focus();
    else if (moveFocus.current === 'after') afterRef.current?.focus();
    moveFocus.current = null;
  }, [state]);

  if (sensitivity === 'standard') return <>{children}</>;

  if (state === 'opened') {
    return (
      <div ref={revealedRef} tabIndex={-1} className="outline-none">
        {children}
      </div>
    );
  }

  const show = () => {
    openGate(personId);
    moveFocus.current = 'reveal';
    setState('opened');
  };
  const skip = () => {
    moveFocus.current = 'after';
    setState('skipped');
  };

  return (
    <>
      <section
        aria-labelledby={titleId}
        data-testid="warning-gate"
        className="my-6 max-w-measure rounded-e-md border-s-accent-line border-accent bg-warning-bg p-5 md:p-6"
      >
        {state === 'closed' ? (
          <>
            <p
              id={titleId}
              className="flex items-center gap-2 font-body text-sm font-semibold text-accent"
            >
              <TriangleAlert
                className="size-icon-md shrink-0"
                aria-hidden="true"
                focusable="false"
              />
              <span>{t('warning.title')}</span>
            </p>
            <p className="mt-2 font-body text-base text-ink">{t('warning.body')}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Button fullWidth onClick={show} data-testid="warning-show">
                {t('warning.show')}
              </Button>
              <Button fullWidth onClick={skip} data-testid="warning-skip">
                {t('warning.skip')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p id={titleId} className="font-body text-base text-ink">
              {t('warning.skipped')}
            </p>
            <div className="mt-5">
              <Button onClick={show} data-testid="warning-show">
                {t('warning.show')}
              </Button>
            </div>
          </>
        )}
      </section>
      <span ref={afterRef} tabIndex={-1} className="outline-none" />
    </>
  );
}
