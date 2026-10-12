import { BookOpen, Volume2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePrefs } from '@/app/prefsContext';
import {
  Markdown,
  PhotoFrame,
  QuoteBlock,
  SectionHeading,
  ShareButton,
  SourceList,
} from '@/components/primitives';
import { ContentWarningGate } from '@/components/reading/ContentWarningGate';
import { DepthTabs } from '@/components/reading/DepthTabs';
import { getPersonById, getStations } from '@/content';
import type { Depth, Person } from '@/content/schema';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/lib/i18n';
import { stationPath } from '@/lib/links';
import { NotFoundPage } from './NotFoundPage';

interface StorySectionProps {
  id: string;
  title: string;
  children: ReactNode;
}

/** A titled part of the story: `h2` + body, labelled for assistive technology. */
function StorySection({ id, title, children }: StorySectionProps) {
  return (
    <section aria-labelledby={id}>
      <SectionHeading level={2} id={id}>
        {title}
      </SectionHeading>
      {children}
    </section>
  );
}

interface DepthContentProps {
  person: Person;
  depth: Depth;
}

/**
 * The story at one reading depth (ADR-007). For `graphic` people the s30 text, and the oct7
 * passage together with `quote` / `altQuote` (Gate G2 decision), sit inside one
 * ContentWarningGate.
 */
function DepthContent({ person, depth }: DepthContentProps) {
  const graphic = person.oct7Sensitivity === 'graphic';

  if (depth === 's30') {
    return (
      <>
        <p className="mb-2 flex items-center gap-2 font-body text-sm font-semibold text-ink">
          <Volume2 className="size-icon-sm shrink-0" aria-hidden="true" focusable="false" />
          <span>{t('depth.s30.hint')}</span>
        </p>
        <ContentWarningGate personId={person.id} sensitivity={person.oct7Sensitivity}>
          <Markdown variant="read">{person.guideLevels.s30}</Markdown>
        </ContentWarningGate>
      </>
    );
  }

  const full = depth === 'm5';
  const quotes = (
    <>
      <QuoteBlock quote={person.quote} />
      {full && person.altQuote ? <QuoteBlock quote={person.altQuote} /> : null}
    </>
  );

  return (
    <>
      <Markdown>{person.opening}</Markdown>
      <StorySection id={`person-oct7-${depth}`} title={t('person.oct7')}>
        <ContentWarningGate personId={person.id} sensitivity={person.oct7Sensitivity}>
          <Markdown>{person.oct7}</Markdown>
          {graphic ? quotes : null}
        </ContentWarningGate>
      </StorySection>
      {full ? (
        <>
          <StorySection
            id="person-personality"
            title={t(person.pronoun === 'she' ? 'person.personality.she' : 'person.personality.he')}
          >
            <Markdown>{person.personality}</Markdown>
          </StorySection>
          <StorySection id="person-past" title={t('person.past')}>
            <Markdown>{person.past}</Markdown>
          </StorySection>
          {person.after ? (
            <StorySection id="person-after" title={t('person.after')}>
              <Markdown>{person.after}</Markdown>
            </StorySection>
          ) : null}
        </>
      ) : null}
      {graphic ? null : quotes}
      {full && person.guideNote ? (
        <StorySection id="person-guide-note" title={t('person.guideNote')}>
          <Markdown>{person.guideNote}</Markdown>
        </StorySection>
      ) : null}
      {full ? (
        <section aria-labelledby="person-sources">
          <SectionHeading level={2} id="person-sources" icon={BookOpen}>
            {t('person.sources')}
          </SectionHeading>
          <SourceList sources={person.sources} />
        </section>
      ) : null}
    </>
  );
}

/** Person page (/person/:id). Unknown id → NotFoundPage. */
export function PersonPage() {
  const { id = '' } = useParams();
  const person = getPersonById(id);
  const { depth, setDepth } = usePrefs();
  useDocumentTitle(person ? person.name : t('notFound.title'));
  if (!person) return <NotFoundPage />;

  const fullName = person.honorific ? `${person.name} ${person.honorific}` : person.name;
  const firstStationId = person.stationIds[0];
  const station = getStations().find((s) => s.id === firstStationId);

  return (
    <article>
      {station ? (
        <Link
          to={stationPath(station.slug)}
          className="mb-3 inline-flex min-h-[var(--tap-min)] items-center font-body text-base font-semibold text-primary hover:underline"
        >
          {t('person.backToStation', { title: station.title })}
        </Link>
      ) : null}
      <h1 className="font-display text-3xl font-display-bold text-ink">{fullName}</h1>
      <p className="mt-2 max-w-measure font-body text-base text-ink-muted">{person.subtitle}</p>
      <PhotoFrame photo={person.photo} name={person.name} />
      <ShareButton />
      <DepthTabs value={depth} onChange={setDepth} />
      <div role="tabpanel" id="depth-panel" aria-labelledby={`depth-tab-${depth}`} tabIndex={0}>
        <DepthContent key={depth} person={person} depth={depth} />
      </div>
    </article>
  );
}
