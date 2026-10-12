import { getPeople, getStations } from '@/content';
import { SectionHeading, SourceList } from '@/components/primitives';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/lib/i18n';
import { PageTitle } from './PageTitle';

/** Sources (/sources) — every source, grouped by person and by station. */
export function SourcesPage() {
  const title = t('sources.title');
  useDocumentTitle(title);
  const people = getPeople();
  const stations = getStations().filter((station) => station.sources.length > 0);
  return (
    <>
      <PageTitle>{title}</PageTitle>
      <p className="mt-2 max-w-measure text-lg text-ink">{t('sources.intro')}</p>
      <section aria-labelledby="sources-person">
        <SectionHeading level={2} id="sources-person">
          {t('sources.byPerson')}
        </SectionHeading>
        {people.map((person) => (
          <div key={person.id}>
            <SectionHeading level={3}>
              {person.honorific ? `${person.name} ${person.honorific}` : person.name}
            </SectionHeading>
            <SourceList sources={person.sources} />
          </div>
        ))}
      </section>
      <section aria-labelledby="sources-station">
        <SectionHeading level={2} id="sources-station">
          {t('sources.byStation')}
        </SectionHeading>
        {stations.map((station) => (
          <div key={station.id}>
            <SectionHeading level={3}>{station.title}</SectionHeading>
            <SourceList sources={station.sources} />
          </div>
        ))}
      </section>
    </>
  );
}
