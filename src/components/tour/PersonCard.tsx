import type { Person } from '@/content/schema';
import { Button, Markdown } from '@/components/primitives';
import { t } from '@/lib/i18n';
import { personPath } from '@/lib/links';

export interface PersonCardProps {
  person: Person;
  variant: 'primary' | 'companion';
}

export function PersonCard({ person, variant }: PersonCardProps) {
  const companion = variant === 'companion';
  const headingId = `person-card-name-${person.id}`;
  const frame = companion ? 'bg-bg' : 'border-s-accent-line border-s-gold bg-surface shadow-card';
  const nameSize = companion ? 'text-lg' : 'text-xl';
  const fullName = person.honorific ? `${person.name} ${person.honorific}` : person.name;
  // F-22: a graphic person's `opening` stays behind the content warning on the person page, so
  // the card shows only the approved `gentleOpening`, or no excerpt at all.
  const excerpt = person.oct7Sensitivity === 'graphic' ? person.gentleOpening : person.opening;
  return (
    <article
      aria-labelledby={headingId}
      data-testid={`person-card-${person.id}`}
      className={`rounded-lg border-hairline border-border p-5 md:p-6 ${frame}`}
    >
      {companion ? (
        <p className="mb-2 font-body text-xs font-semibold text-gold">{t('person.companion')}</p>
      ) : null}
      <h3 id={headingId} className={`font-display font-display-bold ${nameSize} text-ink`}>
        {fullName}
      </h3>
      <p className="mt-1 font-body text-sm text-ink-muted">{person.subtitle}</p>
      {excerpt ? (
        <div className="mt-4">
          <Markdown>{excerpt}</Markdown>
        </div>
      ) : null}
      <div className="mt-5">
        <Button variant="secondary" href={`#${personPath(person.id)}`}>
          {t('person.toStory', { name: person.name })}
        </Button>
      </div>
    </article>
  );
}
