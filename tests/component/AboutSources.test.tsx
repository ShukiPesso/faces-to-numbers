import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { getPeople, getStations, getTour } from '@/content';
import { AboutPage } from '@/pages/AboutPage';
import { SourcesPage } from '@/pages/SourcesPage';
import { t } from '@/lib/i18n';

afterEach(() => {
  cleanup();
  document.title = '';
});

describe('SourcesPage', () => {
  it('shows one h1, the intro and both section headings', () => {
    render(<SourcesPage />);
    expect(screen.getByRole('heading', { level: 1, name: t('sources.title') })).toBeTruthy();
    expect(screen.getByText(t('sources.intro'))).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: t('sources.byPerson') })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: t('sources.byStation') })).toBeTruthy();
    expect(document.title).toContain(t('sources.title'));
  });

  it('lists every person by name with their sources', () => {
    render(<SourcesPage />);
    const people = getPeople();
    expect(people).toHaveLength(9);
    for (const person of people) {
      const heading = screen.getByRole('heading', {
        level: 3,
        name: person.honorific ? `${person.name} ${person.honorific}` : person.name,
      });
      const list = heading.parentElement?.nextElementSibling as HTMLElement;
      expect(within(list).getAllByRole('link')).toHaveLength(person.sources.length);
    }
  });

  it('lists each station that has sources, and only those', () => {
    render(<SourcesPage />);
    const withSources = getStations().filter((s) => s.sources.length > 0);
    for (const station of withSources) {
      expect(screen.getByRole('heading', { level: 3, name: station.title })).toBeTruthy();
    }
    const stationSection = screen
      .getByRole('heading', { level: 2, name: t('sources.byStation') })
      .closest('section') as HTMLElement;
    expect(within(stationSection).getAllByRole('heading', { level: 3 })).toHaveLength(
      withSources.length,
    );
  });
});

describe('AboutPage', () => {
  it('shows the about text, the rights text and the last-review date', () => {
    render(<AboutPage />);
    const tour = getTour();
    expect(screen.getByRole('heading', { level: 1, name: t('about.title') })).toBeTruthy();
    expect(screen.getByRole('heading', { level: 2, name: t('about.rights') })).toBeTruthy();
    expect(screen.getByText(tour.rights)).toBeTruthy();
    expect(screen.getByText(tour.about.split('\n\n')[0] ?? '')).toBeTruthy();
    expect(screen.getByText(tour.lastContentReview)).toBeTruthy();
    expect(document.title).toContain(t('about.title'));
  });

  it('shows a contact link only when a contact e-mail exists', () => {
    render(<AboutPage />);
    const email = getTour().contactEmail;
    const link = screen.queryByRole('link', { name: email ?? '' });
    if (email === undefined) {
      expect(screen.queryByRole('link')).toBeNull();
    } else {
      expect(link?.getAttribute('href')).toBe(`mailto:${email}`);
    }
  });
});
