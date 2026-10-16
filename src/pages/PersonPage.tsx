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
import { NightBand } from '@/components/layout/NightBand';
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
 * The story at one reading depth (ADR-007). For `graphic` people the s30 text, and the `opening`
 * (F-22) and oct7 passage together with `quote` / `altQuote` (Gate G2 decision), sit inside one
 * ContentWarningGate. Outside the gate a graphic person shows only `gentleOpening` (when the
 * approved text exists in content-source), otherwise nothing.
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

  let lead: ReactNode = <Markdown>{person.opening}</Markdown>;
  if (graphic) lead = person.gentleOpening ? <Markdown>{person.gentleOpening}</Markdown> : null;

  return (
    <>
      {lead}
      <StorySection id={`person-oct7-${depth}`} title={t('person.oct7')}>
        <ContentWarningGate personId={person.id} sensitivity={person.oct7Sensitivity}>
          {graphic ? <Markdown>{person.opening}</Markdown> : null}
          <Markdown>{person.oct7}</Markdown>
          {graphic ? quotes : null}
        </ContentWarningGate>
      </StorySection>
      {full ? (
        <div
          data-theme="bloom"
          data-testid="awakening"
          className="mt-9 max-w-measure rounded-e-lg border-s-accent-line border-olive bg-olive-soft px-5 pb-6 md:px-6"
        >
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
        </div>
      ) : null}
      {graphic ? null : quotes}
      {full && person.guideNote ? (
        <StorySection id="person-guide-note" title={t('person.guideNote')}>
          <Markdown>{person.guideNote}</Markdown>
        </StorySection>
      ) : null}
      {full ? (
        <div className="mt-9 flex justify-center">
          <img
            src="./icons/mark.svg"
            alt=""
            aria-hidden="true"
            className="size-6"
            width={24}
            height={24}
          />
        </div>
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
      <NightBand
        eyebrow={
          station ? (
            <Link
              to={stationPath(station.slug)}
              className="inline-flex min-h-[var(--tap-min)] items-center font-body text-base font-semibold text-on-night underline"
            >
              {t('person.backToStation', { title: station.title })}
            </Link>
          ) : undefined
        }
        title={fullName}
        subtitle={person.subtitle}
      />
      <PhotoFrame photo={person.photo} name={person.name} />
      <ShareButton />
      <DepthTabs value={depth} onChange={setDepth} />
      <div role="tabpanel" id="depth-panel" aria-labelledby={`depth-tab-${depth}`} tabIndex={0}>
        <DepthContent key={depth} person={person} depth={depth} />
      </div>
    </article>
  );
}
