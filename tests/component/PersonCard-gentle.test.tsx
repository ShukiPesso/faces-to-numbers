// F-22 — PersonCard excerpt for graphic people. FICTIONAL fixtures only (Conventions §1.11).
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { PersonCard } from '@/components/tour/PersonCard';
import { getPeople } from '@/content';
import type { Person } from '@/content/schema';
import { t } from '@/lib/i18n';

afterEach(cleanup);

function makePerson(over: Partial<Person> = {}): Person {
  return {
    id: 'test-person-1',
    order: 1,
    sourceFile: 'content-source/people/01_test-person-1.md',
    name: 'דמות בדיקה 1',
    honorific: 'הי״ד',
    pronoun: 'he',
    subtitle: 'תיאור בדיוני קצר',
    stationIds: ['test-1'],
    opening: 'משפט פתיחה בדיוני של דמות הבדיקה.',
    oct7: 'טקסט בדיוני ארוך מספיק.',
    oct7Sensitivity: 'graphic',
    personality: 'טקסט בדיוני ארוך מספיק.',
    past: 'טקסט בדיוני ארוך מספיק.',
    quote: { text: 'ציטוט בדיוני', by: 'מקור בדיוני' },
    guideLevels: {
      s30: 'טקסט בדיוני ארוך מספיק.',
      m2: 'טקסט בדיוני ארוך מספיק.',
      m5: 'טקסט בדיוני ארוך מספיק.',
    },
    photo: { status: 'pending' },
    consent: { family: 'not_contacted' },
    sources: [{ title: 'מקור בדיוני', url: 'https://example.com/x' }],
    ...over,
  };
}

function card(person: Person) {
  render(<PersonCard person={person} variant="primary" />);
  return screen.getByTestId(`person-card-${person.id}`);
}

describe('CT-PCARD-02 PersonCard — gentle opening (F-22)', () => {
  it('graphic without gentleOpening: name, subtitle and link only — no opening', () => {
    const person = makePerson();
    const el = card(person);
    expect(
      within(el).getByRole('heading', { level: 3, name: 'דמות בדיקה 1 הי״ד' }),
    ).toBeInTheDocument();
    expect(el).toHaveTextContent(person.subtitle);
    expect(el).not.toHaveTextContent(person.opening);
    expect(within(el).getByRole('link')).toHaveTextContent(
      t('person.toStory', { name: person.name }),
    );
    // Only the subtitle paragraph: no excerpt.
    expect(el.querySelectorAll('p')).toHaveLength(1);
  });

  it('graphic with gentleOpening: shows gentleOpening, never opening', () => {
    const person = makePerson({ gentleOpening: 'פתיחה עדינה בדיונית של דמות הבדיקה.' });
    const el = card(person);
    expect(el).toHaveTextContent('פתיחה עדינה בדיונית של דמות הבדיקה.');
    expect(el).not.toHaveTextContent(person.opening);
  });

  it('standard: shows opening as before', () => {
    const person = makePerson({ oct7Sensitivity: 'standard' });
    const el = card(person);
    expect(el).toHaveTextContent(person.opening);
  });

  it('real content: no graphic person card shows its opening, every standard card does', () => {
    for (const person of getPeople()) {
      render(<PersonCard person={person} variant="primary" />);
      const el = screen.getByTestId(`person-card-${person.id}`);
      const text = (el.textContent ?? '').replace(/\s+/g, ' ');
      const opening = person.opening.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
      if (person.oct7Sensitivity === 'graphic') expect(text, person.id).not.toContain(opening);
      else expect(text, person.id).toContain(opening);
      cleanup();
    }
  });
});
