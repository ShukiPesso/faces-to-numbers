import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { DurationBadge } from '@/components/primitives';
import { getTour } from '@/content';
import type { Station } from '@/content/schema';
import { t } from '@/lib/i18n';
import { stationPath } from '@/lib/links';

export interface StationCardProps {
  station: Station;
  visited: boolean;
  current?: boolean;
}

export function StationCard({ station, visited, current = false }: StationCardProps) {
  const total = getTour().stationIds.length;
  const frame = current ? 'border-primary' : 'border-border';
  const marker = current
    ? 'border-primary bg-primary text-primary-ink'
    : 'border-ink-muted bg-surface text-primary';
  return (
    <Link
      to={stationPath(station.slug)}
      data-testid={`station-card-${station.id}`}
      aria-current={current ? 'step' : undefined}
      className={`group grid grid-cols-[auto_1fr] gap-4 rounded-lg border-hairline ${frame} bg-surface p-4 shadow-card no-underline md:p-5`}
    >
      <span
        aria-hidden="true"
        className={`flex size-8 items-center justify-center rounded-md border-hairline ${marker} font-display text-lg font-display-bold`}
      >
        <bdi>{station.order}</bdi>
      </span>
      <span className="block">
        <span className="sr-only">{t('tour.stationOf', { n: station.order, total })}</span>
        <span className="block font-display text-lg font-display-bold text-primary group-hover:underline">
          {station.title}
        </span>
        <span className="block font-body text-sm text-ink">{station.subtitle}</span>
        <span className="mt-2 flex flex-wrap items-center gap-3 font-body text-sm text-ink-muted">
          <DurationBadge minutes={station.durationMin} />
          <span aria-hidden="true">·</span>
          <span>{t(station.kind === 'drive' ? 'tour.kind.drive' : 'tour.kind.stop')}</span>
        </span>
        {visited ? (
          <span className="mt-1 flex items-center gap-1 font-body text-sm text-ink-muted">
            <Check className="size-icon-sm shrink-0" aria-hidden="true" focusable="false" />
            <span>{t('tour.visited')}</span>
          </span>
        ) : null}
      </span>
    </Link>
  );
}
