import { BookOpen, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  DurationBadge,
  Markdown,
  SectionHeading,
  ShareButton,
  SourceList,
} from '@/components/primitives';
import { SilenceMoment } from '@/components/reading/SilenceMoment';
import { DriveBanner } from '@/components/tour/DriveBanner';
import { NavLinks } from '@/components/tour/NavLinks';
import { PersonCard } from '@/components/tour/PersonCard';
import {
  getNextStation,
  getPeopleForStation,
  getPrevStation,
  getStationBySlug,
  getTour,
} from '@/content';
import type { Station } from '@/content/schema';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t, type StringKey, type StringParams } from '@/lib/i18n';
import { getVisited, markVisited, unmarkVisited } from '@/lib/storage';
import { stationPath } from '@/lib/links';
import { NotFoundPage } from './NotFoundPage';

const MARK = '\u0000';

/**
 * Renders `t(key, params)` with every parameter value isolated in `<bdi>` (Conventions §4):
 * the sentence is built with marker placeholders, split around them, and the values put back.
 */
function withBdi(key: StringKey, params: StringParams): ReactNode[] {
  const names = Object.keys(params);
  const marked = Object.fromEntries(names.map((name, i) => [name, `${MARK}${i}${MARK}`]));
  return t(key, marked)
    .split(MARK)
    .map((part, index) => {
      if (index % 2 === 0) return part;
      const name = names[Number(part)];
      return <bdi key={index}>{name === undefined ? '' : String(params[name])}</bdi>;
    });
}

const PN_LINK =
  'inline-flex w-full min-h-[var(--space-9)] items-center gap-1 rounded-md border-hairline border-primary bg-surface px-2 py-2 md:gap-2 md:px-3 font-body text-base font-semibold text-primary no-underline transition-colors duration-[var(--duration-fast)] hover:bg-bg hover:underline active:underline [[data-read-aloud=true]_&]:min-h-[var(--space-10)]';
const PN_LABEL = 'text-balance [[data-read-aloud=true]_&]:text-lg';
const PN_TITLE = 'font-regular text-xs text-ink-muted';
const PN_ICON = 'size-icon-md shrink-0 rtl:scale-x-[-1]';

/** Station page (/station/:slug). Unknown slug → NotFoundPage. */
export function StationPage() {
  const { slug = '' } = useParams();
  const station: Station | undefined = getStationBySlug(slug);
  useDocumentTitle(station ? station.title : t('notFound.title'));
  const [visitedIds, setVisitedIds] = useState<string[]>(() => getVisited());

  if (!station) return <NotFoundPage />;

  const tour = getTour();
  const total = tour.stationIds.length;
  const { primary, companions } = getPeopleForStation(station.id);
  const prev = getPrevStation(station.id);
  const next = getNextStation(station.id);
  const visited = visitedIds.includes(station.id);

  const toggleVisited = (): void => {
    if (visited) unmarkVisited(station.id);
    else markVisited(station.id);
    setVisitedIds(getVisited());
  };

  return (
    <>
      <p className="mb-1 font-body text-sm font-semibold text-ink-muted">
        {withBdi('tour.stationOf', { n: station.order, total })}
      </p>
      <h1 className="font-display text-3xl font-display-bold text-primary">{station.title}</h1>
      <p className="mt-2 max-w-measure font-body text-base text-ink-muted">{station.subtitle}</p>
      <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 font-body text-sm text-ink-muted">
        <DurationBadge minutes={station.durationMin} />
        <span aria-hidden="true">·</span>
        <span>{t(station.kind === 'drive' ? 'tour.kind.drive' : 'tour.kind.stop')}</span>
      </p>
      <div className="mt-5">
        <ShareButton key={station.id} />
      </div>

      {station.driverWarning ? (
        <div className="mt-6">
          <DriveBanner />
        </div>
      ) : null}

      <section aria-labelledby="station-background">
        <SectionHeading level={2} id="station-background">
          {t('station.background')}
        </SectionHeading>
        <Markdown>{station.background}</Markdown>
      </section>

      <section aria-labelledby="station-talking-points">
        <SectionHeading level={2} id="station-talking-points">
          {t('station.talkingPoints')}
        </SectionHeading>
        <ul className="max-w-measure list-disc ps-6 font-body text-base text-ink marker:text-ink-muted">
          {station.talkingPoints.map((point) => (
            <li key={point} className="mb-2 last:mb-0">
              {point}
            </li>
          ))}
        </ul>
      </section>

      {primary.length > 0 ? (
        <section aria-labelledby="station-people">
          <SectionHeading level={2} id="station-people">
            {t('station.people')}
          </SectionHeading>
          <div className="flex flex-col gap-5">
            {primary.map((person) => (
              <PersonCard key={person.id} person={person} variant="primary" />
            ))}
          </div>
        </section>
      ) : null}

      {companions.length > 0 ? (
        <section aria-labelledby="station-companions">
          <SectionHeading level={2} id="station-companions">
            {t('station.companions')}
          </SectionHeading>
          <div className="flex flex-col gap-5">
            {companions.map((person) => (
              <PersonCard key={person.id} person={person} variant="companion" />
            ))}
          </div>
        </section>
      ) : null}

      {station.silenceMoment ? (
        <SilenceMoment
          key={station.id}
          seconds={station.silenceMoment.seconds}
          prompt={station.silenceMoment.prompt}
        />
      ) : null}

      <section aria-labelledby="station-access">
        <SectionHeading level={2} id="station-access">
          {t('station.access')}
        </SectionHeading>
        {station.accessNotes ? <Markdown>{station.accessNotes}</Markdown> : null}
        {station.lastVerified ? (
          <p className="mt-2 max-w-measure font-body text-base text-ink-muted">
            {withBdi('station.lastVerified', { date: station.lastVerified })}
          </p>
        ) : null}
        <div className="mt-4">
          <NavLinks location={station.location} />
        </div>
      </section>

      <div className="mt-7">
        <Button
          variant="secondary"
          icon={Check}
          pressed={visited}
          onClick={toggleVisited}
          data-testid="mark-visited"
        >
          {t(visited ? 'station.unmarkVisited' : 'station.markVisited')}
        </Button>
      </div>

      {station.sources.length > 0 ? (
        <section aria-labelledby="station-sources">
          <SectionHeading level={2} id="station-sources" icon={BookOpen}>
            {t('station.sources')}
          </SectionHeading>
          <SourceList sources={station.sources} />
        </section>
      ) : null}

      {next ? null : (
        <div className="mt-9">
          <Markdown>{tour.closing}</Markdown>
        </div>
      )}

      {/* Previous / next: fixed above the BottomNav below lg, in flow at the page end from lg
          (design/components/layout.md §8). F-06 measures it via [data-sticky-bar]. */}
      <div
        data-sticky-bar
        className="fixed inset-x-0 bottom-[var(--bottomnav-size)] z-sticky border-t-hairline border-border bg-surface px-4 py-2 shadow-card md:px-7 lg:static lg:mt-9 lg:border-t-0 lg:bg-transparent lg:p-0 lg:shadow-none"
      >
        <div className="mx-auto grid max-w-content grid-cols-2 gap-3">
          {prev ? (
            <Link
              to={stationPath(prev.slug)}
              data-testid="prev-station"
              className={`${PN_LINK} justify-start text-start`}
            >
              <ChevronLeft className={PN_ICON} aria-hidden="true" focusable="false" />
              <span className="flex flex-col">
                <span className={PN_LABEL}>{t('station.prev')}</span>
                <span className={PN_TITLE}>{prev.title}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to={stationPath(next.slug)}
              data-testid="next-station"
              className={`${PN_LINK} justify-end text-end`}
            >
              <span className="flex flex-col">
                <span className={PN_LABEL}>{t('station.next')}</span>
                <span className={PN_TITLE}>{next.title}</span>
              </span>
              <ChevronRight className={PN_ICON} aria-hidden="true" focusable="false" />
            </Link>
          ) : (
            <p className="flex items-center justify-center text-center font-body text-sm text-ink-muted">
              {t('station.end')}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
