import { Clock, Route as RouteIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RouteMap } from '@/components/tour/RouteMap';
import { NearbyBanner } from '@/components/tour/NearbyBanner';
import { StationCard } from '@/components/tour/StationCard';
import { getStations, getTour } from '@/content';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useNearbyStation } from '@/hooks/useNearbyStation';
import { formatMinutes } from '@/lib/format';
import { t } from '@/lib/i18n';
import { getVisited } from '@/lib/storage';
import { PageTitle } from './PageTitle';

/** Tour overview (/tour): where-am-i, the route map and every station as a card. */
export function TourPage() {
  const title = t('tour.title');
  useDocumentTitle(title);

  const stations = getStations();
  const tour = getTour();
  const visitedIds = getVisited();
  const current = stations.find((s) => !visitedIds.includes(s.id));
  const { state, locate } = useNearbyStation();

  const [params] = useSearchParams();
  const wantsLocate = params.get('locate') === '1';
  const nearbyRef = useRef<HTMLDivElement>(null);

  // ?locate=1 only moves focus to the button. Location is read on a tap, never here.
  useEffect(() => {
    if (!wantsLocate) return;
    const button = nearbyRef.current?.querySelector<HTMLElement>('[data-testid="where-am-i"]');
    if (button) {
      button.focus({ preventScroll: true });
      button.scrollIntoView?.({ block: 'center' });
    }
  }, [wantsLocate]);

  return (
    <div className="mx-auto w-full max-w-content">
      <PageTitle>{title}</PageTitle>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 font-body text-sm text-ink-muted">
        <span className="inline-flex items-center gap-2">
          <RouteIcon className="size-icon-sm shrink-0" aria-hidden="true" focusable="false" />
          <bdi>{t('home.stationsCount', { n: stations.length })}</bdi>
        </span>
        <span aria-hidden="true">·</span>
        <span className="inline-flex items-center gap-2">
          <Clock className="size-icon-sm shrink-0" aria-hidden="true" focusable="false" />
          <bdi>{t('home.totalDuration', { duration: formatMinutes(tour.totalDurationMin) })}</bdi>
        </span>
      </p>
      <div ref={nearbyRef} className="mt-6">
        <NearbyBanner state={state} onLocate={locate} />
      </div>
      <div className="mt-6">
        <RouteMap
          stations={stations}
          visitedIds={visitedIds}
          currentId={current ? current.id : undefined}
        />
      </div>
      <ol className="mt-6 flex list-none flex-col gap-3 p-0">
        {stations.map((station) => (
          <li key={station.id}>
            <StationCard
              station={station}
              visited={visitedIds.includes(station.id)}
              current={current?.id === station.id}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
