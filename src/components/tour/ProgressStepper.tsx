import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Station } from '@/content/schema';
import { t } from '@/lib/i18n';
import { stationPath } from '@/lib/links';

export interface ProgressStepperProps {
  stations: Station[];
  visitedIds: string[];
  currentId?: string;
  variant?: 'full' | 'compact';
  currentIs?: 'step' | 'page';
}

export function ProgressStepper({
  stations,
  visitedIds,
  currentId,
  variant = 'full',
  currentIs = 'step',
}: ProgressStepperProps) {
  const full = variant === 'full';
  const total = stations.length;
  return (
    <ol className={`flex flex-col ${full ? 'gap-3' : 'gap-1'}`}>
      {stations.map((station) => {
        const current = station.id === currentId;
        const visited = visitedIds.includes(station.id);
        const marker = current
          ? 'border-primary bg-primary text-primary-ink outline outline-1 outline-offset-2 outline-primary'
          : 'border-ink-muted bg-surface text-ink';
        return (
          <li key={station.id}>
            <Link
              to={stationPath(station.slug)}
              aria-current={current ? currentIs : undefined}
              className={`group grid min-h-[var(--tap-min)] grid-cols-[auto_1fr] items-center gap-3 rounded-md py-2 no-underline hover:bg-bg ${
                full ? 'text-base' : 'text-sm'
              }`}
            >
              <span
                aria-hidden="true"
                className={`flex size-6 items-center justify-center rounded-full border-hairline ${marker}`}
              >
                {visited && !current ? (
                  <Check className="size-icon-sm text-ink-muted" focusable="false" />
                ) : (
                  <bdi>{station.order}</bdi>
                )}
              </span>
              <span className="block font-body">
                <span className="sr-only">
                  {t('tour.stationOf', { n: station.order, total })},{' '}
                </span>
                {full ? (
                  <span className="block text-xs text-ink-muted">
                    {t(station.kind === 'drive' ? 'tour.kind.drive' : 'tour.kind.stop')}
                  </span>
                ) : null}
                <span
                  className={`group-hover:underline ${
                    current ? 'font-semibold text-primary' : 'font-regular text-ink'
                  }`}
                >
                  {station.title}
                </span>
                {visited ? (
                  <span className="flex items-center gap-1 text-xs text-ink-muted">
                    <Check className="size-icon-sm shrink-0" aria-hidden="true" focusable="false" />
                    <span className={full ? undefined : 'sr-only'}>
                      {full ? t('tour.visited') : `, ${t('tour.visited')}`}
                    </span>
                  </span>
                ) : null}
              </span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
