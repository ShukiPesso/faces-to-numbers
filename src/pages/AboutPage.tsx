import type { ReactNode } from 'react';
import { getTour } from '@/content';
import { Markdown, SectionHeading } from '@/components/primitives';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { t } from '@/lib/i18n';
import { PageTitle } from './PageTitle';

const SLOT = '\u0000';

/** Renders a string with one `{name}` placeholder, putting `node` in its place. */
function withSlot(text: string, node: ReactNode): ReactNode {
  const [before = '', after = ''] = text.split(SLOT);
  return (
    <>
      {before}
      {node}
      {after}
    </>
  );
}

/** About (/about) — who made the tour, the rights statement and the last review date. */
export function AboutPage() {
  const title = t('about.title');
  useDocumentTitle(title);
  const tour = getTour();
  const email = tour.contactEmail;
  return (
    <>
      <PageTitle>{title}</PageTitle>
      <div className="mt-4">
        <Markdown>{tour.about}</Markdown>
      </div>
      <section aria-labelledby="about-rights">
        <SectionHeading level={2} id="about-rights">
          {t('about.rights')}
        </SectionHeading>
        <Markdown>{tour.rights}</Markdown>
      </section>
      <p className="mt-9 max-w-measure text-base text-ink-muted">
        {withSlot(t('about.lastReview', { date: SLOT }), <bdi>{tour.lastContentReview}</bdi>)}
      </p>
      {email ? (
        <p className="mt-4 max-w-measure text-base">
          {withSlot(
            t('about.contact', { email: SLOT }),
            <a className="font-semibold text-primary underline" href={`mailto:${email}`}>
              <bdi dir="ltr">{email}</bdi>
            </a>,
          )}
        </p>
      ) : null}
    </>
  );
}
