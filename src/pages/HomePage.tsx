import { Clock, Route } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Markdown } from '@/components/primitives/Markdown';
import { getStations, getTour } from '@/content';
import type { Station } from '@/content/schema';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { formatMinutes } from '@/lib/format';
import { t } from '@/lib/i18n';
import { stationPath } from '@/lib/links';
import { getVisited, resetProgress } from '@/lib/storage';
import { NightBand } from '@/components/layout/NightBand';

/** The first station (by order) after the highest visited one; undefined when none is left. */
function nextAfterVisited(
  stations: readonly Station[],
  visited: readonly string[],
): Station | undefined {
  const highest = stations
    .filter((s) => visited.includes(s.id) || visited.includes(s.slug))
    .reduce((max, s) => Math.max(max, s.order), 0);
  if (highest === 0) {
    return undefined;
  }
  return stations.find((s) => s.order > highest);
}

/** Same look as SectionHeading level 2, without its <header> (a second banner landmark). */
function SectionTitle({ id, children }: { id: string; children: string }) {
  return (
    <h2 id={id} className="mb-4 mt-9 font-display font-display-bold text-xl text-primary md:mt-10">
      {children}
    </h2>
  );
}

function BulletList({ items }: { items: readonly string[] }) {
  return (
    <ul className="max-w-measure list-disc ps-6 marker:text-ink-muted">
      {items.map((item) => (
        <li key={item} className="mb-2 last:mb-0">
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Home (/) — introduces the tour, its message and safety notes; start or resume. */
export function HomePage() {
  const tour = getTour();
  const stations = getStations();
  const [visited, setVisited] = useState<string[]>(() => getVisited());

  useDocumentTitle(tour.title);

  const first = stations[0];
  const next = nextAfterVisited(stations, visited);
  const hasProgress = visited.length > 0;

  const onReset = (): void => {
    resetProgress();
    setVisited(getVisited());
  };

  return (
    <div className="mx-auto w-full max-w-content">
      <NightBand title={tour.title} subtitle={tour.subtitle} centered>
        <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
          <span className="inline-flex items-center gap-1">
            <Route className="size-icon-sm shrink-0" aria-hidden="true" focusable="false" />
            <bdi>{t('home.stationsCount', { n: stations.length })}</bdi>
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-icon-sm shrink-0" aria-hidden="true" focusable="false" />
            <bdi>{t('home.totalDuration', { duration: formatMinutes(tour.totalDurationMin) })}</bdi>
          </span>
        </p>
      </NightBand>

      <div className="mt-6">
        <Markdown>{tour.intro}</Markdown>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        {next && hasProgress ? (
          <Button
            variant="primary"
            fullWidth
            href={`#${stationPath(next.slug)}`}
            data-testid="resume-tour"
          >
            {t('home.resume', { n: next.order })}
          </Button>
        ) : first ? (
          <Button
            variant="primary"
            fullWidth
            href={`#${stationPath(first.slug)}`}
            data-testid="start-tour"
          >
            {t('home.start')}
          </Button>
        ) : null}
        {hasProgress ? (
          <Button variant="quiet" onClick={onReset} data-testid="reset-progress">
            {t('home.resetProgress')}
          </Button>
        ) : null}
      </div>

      <div>
        <SectionTitle id="h-message">{t('home.messageTitle')}</SectionTitle>
        <Markdown>{tour.message}</Markdown>
      </div>

      <div>
        <SectionTitle id="h-safety">{t('home.safetyTitle')}</SectionTitle>
        <BulletList items={tour.safety} />
      </div>

      <div>
        <SectionTitle id="h-howto">{t('home.howToTitle')}</SectionTitle>
        <BulletList items={tour.howTo} />
      </div>
    </div>
  );
}
