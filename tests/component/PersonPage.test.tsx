import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PrefsProvider } from '@/app/PrefsProvider';
import { getPeople, getPersonById, getStations } from '@/content';
import type * as ContentModule from '@/content';
import type { Depth, Person } from '@/content/schema';
import { t } from '@/lib/i18n';
import { setDepth } from '@/lib/storage';
import { PersonPage } from '@/pages/PersonPage';

// F-22: one FICTIONAL graphic person with a gentleOpening (Conventions §1.11). No real person has
// the section yet, so the page is tested with this extra id; every other id is the real content.
const gentle = vi.hoisted(() => ({
  id: 'test-gentle-1',
  order: 99,
  sourceFile: 'content-source/people/99_test-gentle-1.md',
  name: 'דמות בדיקה 1',
  pronoun: 'she' as const,
  subtitle: 'תיאור בדיוני של דמות בדיקה 1',
  stationIds: ['test-a'],
  opening: 'משפט פתיחה בדיוני של דמות בדיקה 1.',
  gentleOpening: 'פתיחה עדינה בדיונית של דמות בדיקה 1.',
  oct7: 'טקסט בדיוני של דמות בדיקה 1 בסעיף המוסתר.',
  oct7Sensitivity: 'graphic' as const,
  personality: 'טקסט אופי בדיוני של דמות בדיקה 1.',
  past: 'טקסט עבר בדיוני של דמות בדיקה 1.',
  quote: { text: 'ציטוט בדיוני של דמות בדיקה 1', by: 'דוברת בדיונית 1' },
  altQuote: { text: 'ציטוט נוסף בדיוני של דמות בדיקה 1', by: 'דוברת בדיונית 1' },
  guideLevels: {
    s30: 'טקסט בדיוני של חצי דקה עבור דמות בדיקה 1.',
    m2: 'טקסט בדיוני של שתי דקות עבור דמות בדיקה 1.',
    m5: 'טקסט בדיוני של חמש דקות עבור דמות בדיקה 1.',
  },
  photo: { status: 'pending' as const },
  consent: { family: 'not_contacted' as const },
  sources: [{ title: 'מקור בדיוני 1', url: 'https://example.com/test-gentle-1' }],
}));

vi.mock('@/content', async (importOriginal) => {
  const actual = await importOriginal<typeof ContentModule>();
  return {
    ...actual,
    getPersonById: (id: string) => (id === gentle.id ? gentle : actual.getPersonById(id)),
  };
});

const suffix = t('app.titleSuffix');

function renderPerson(id: string, depth?: Depth) {
  if (depth !== undefined) setDepth(depth);
  return render(
    <PrefsProvider>
      <MemoryRouter initialEntries={[`/person/${id}`]}>
        <Routes>
          <Route path="/person/:id" element={<PersonPage />} />
        </Routes>
      </MemoryRouter>
    </PrefsProvider>,
  );
}

function person(id: string): Person {
  const found = getPersonById(id);
  if (found === undefined) throw new Error(`missing person ${id}`);
  return found;
}

/** Text of a Markdown field as it appears on screen (emphasis markers removed). */
function plain(markdown: string): string {
  return markdown.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
}

function panelText(): string {
  return (screen.getByRole('tabpanel').textContent ?? '').replace(/\s+/g, ' ');
}

/** Text of every QuoteBlock on the page. (Some quote words also appear in the story text.) */
function blockquotes(): string[] {
  return Array.from(document.querySelectorAll('blockquote')).map((b) => b.textContent ?? '');
}

function expectShown(markdown: string) {
  expect(panelText()).toContain(plain(markdown));
}

function expectHidden(markdown: string) {
  expect(panelText()).not.toContain(plain(markdown));
}

const quoteText = (p: Person) => `„${p.quote.text}”`;
const graphic = getPeople().filter((p) => p.oct7Sensitivity === 'graphic');
const standard = getPeople().filter((p) => p.oct7Sensitivity === 'standard');

afterEach(() => {
  document.title = '';
});

describe('PersonPage — header', () => {
  it.each(getPeople().map((p) => [p.id]))('%s: h1, subtitle, back link, photo, share', (id) => {
    const p = person(id);
    renderPerson(id);
    const name = p.honorific ? `${p.name} ${p.honorific}` : p.name;
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name })).toBeInTheDocument();
    expect(screen.getByText(p.subtitle)).toBeInTheDocument();
    const station = getStations().find((s) => s.id === p.stationIds[0]);
    expect(station).toBeDefined();
    const back = screen.getByRole('link', {
      name: t('person.backToStation', { title: station!.title }),
    });
    expect(back).toHaveAttribute('href', `/station/${station!.slug}`);
    expect(screen.getByTestId('photo-placeholder')).toHaveTextContent(t('photo.pending'));
    expect(screen.getByTestId('share-button')).toBeInTheDocument();
    expect(document.title).toBe(`${p.name}${suffix}`);
  });

  it('never renders photo.referenceUrl', () => {
    for (const p of getPeople()) {
      const { container, unmount } = renderPerson(p.id, 'm5');
      const ref = p.photo.referenceUrl;
      // A referenceUrl may also be listed as a source link; it must never be an image source.
      if (ref !== undefined) {
        for (const el of Array.from(container.querySelectorAll('[src], [srcset]'))) {
          expect(el.getAttribute('src') ?? '').not.toContain(ref);
          expect(el.getAttribute('srcset') ?? '').not.toContain(ref);
        }
      }
      // The only image is the decorative end-of-story anemone at m5 (D-09 #9, F-22).
      const imgs = Array.from(container.querySelectorAll('img'));
      expect(imgs.map((img) => [img.getAttribute('src'), img.getAttribute('alt')])).toEqual([
        ['./icons/mark.svg', ''],
      ]);
      unmount();
    }
  });

  it('an unknown id shows NotFound', () => {
    renderPerson('no-such-person');
    expect(
      screen.getByRole('heading', { level: 1, name: t('notFound.title') }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('depth-tabs')).toBeNull();
    expect(document.title).toBe(`${t('notFound.title')}${suffix}`);
  });
});

describe('PersonPage — reading depth (ADR-007)', () => {
  it('defaults to m2 and the tabpanel is labelled by the selected tab', () => {
    renderPerson('roni-eshel');
    const tab = screen.getByRole('tab', { name: t('depth.m2') });
    expect(tab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', tab.id);
  });

  it('switching depth renders the right sections (standard person)', async () => {
    const p = person('roni-eshel');
    renderPerson(p.id, 's30');
    const user = userEvent.setup();

    // s30: guideLevels.s30 only, with the read-aloud hint.
    expect(screen.getByText(t('depth.s30.hint'))).toBeInTheDocument();
    expectShown(p.guideLevels.s30);
    expectHidden(p.opening);
    expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
    expect(screen.queryByText(quoteText(p))).toBeNull();

    // m2: opening + oct7 + quote.
    await user.click(screen.getByRole('tab', { name: t('depth.m2') }));
    expect(screen.queryByText(t('depth.s30.hint'))).toBeNull();
    expectHidden(p.guideLevels.s30);
    expectShown(p.opening);
    expect(screen.getByRole('heading', { level: 2, name: t('person.oct7') })).toBeInTheDocument();
    expectShown(p.oct7);
    expect(screen.getByText(quoteText(p))).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: t('person.personality.she') })).toBeNull();
    expect(screen.queryByRole('heading', { name: t('person.sources') })).toBeNull();
    expectHidden(p.personality);

    // m5: everything, in ADR-007 order.
    await user.click(screen.getByRole('tab', { name: t('depth.m5') }));
    expectShown(p.opening);
    expectShown(p.oct7);
    expectShown(p.personality);
    expectShown(p.past);
    expectShown(p.after ?? '');
    expect(screen.getByText(quoteText(p))).toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual([
      t('person.oct7'),
      t('person.personality.she'),
      t('person.past'),
      t('person.after'),
      t('person.sources'),
    ]);
    const sources = screen
      .getByRole('heading', { level: 2, name: t('person.sources') })
      .closest('section') as HTMLElement;
    expect(within(sources).getAllByRole('link')).toHaveLength(p.sources.length);
  });

  it('roni-eshel at m5 shows "מי היא הייתה"', () => {
    renderPerson('roni-eshel', 'm5');
    expect(
      screen.getByRole('heading', { level: 2, name: t('person.personality.she') }),
    ).toHaveTextContent('מי היא הייתה');
  });

  it('a "he" person at m5 shows "מי הוא היה"', () => {
    renderPerson('eliyahu-harosh', 'm5');
    expect(
      screen.getByRole('heading', { level: 2, name: t('person.personality.he') }),
    ).toBeInTheDocument();
    // eliyahu-harosh has no `after`: no "after" heading.
    expect(person('eliyahu-harosh').after).toBeUndefined();
    expect(screen.queryByRole('heading', { name: t('person.after') })).toBeNull();
  });

  it('never renders guideLevels.m2 or guideLevels.m5', () => {
    for (const depth of ['s30', 'm2', 'm5'] as const) {
      for (const p of getPeople()) {
        const { unmount } = renderPerson(p.id, depth);
        expectHidden(p.guideLevels.m2);
        expectHidden(p.guideLevels.m5);
        unmount();
      }
    }
  });

  it('the depth choice is shared through PrefsProvider (persisted)', async () => {
    const { unmount } = renderPerson('roni-eshel', 'm2');
    await userEvent.setup().click(screen.getByRole('tab', { name: t('depth.m5') }));
    unmount();
    renderPerson('eliyahu-harosh');
    expect(screen.getByRole('tab', { name: t('depth.m5') })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
});

describe('PersonPage — guideNote and altQuote', () => {
  it('raz-peretz at m5 shows the guideNote', () => {
    const p = person('raz-peretz');
    expect(p.guideNote).toBeDefined();
    renderPerson(p.id, 'm5');
    expect(
      screen.getByRole('heading', { level: 2, name: t('person.guideNote') }),
    ).toBeInTheDocument();
    expectShown(p.guideNote ?? '');
  });

  it('raz-peretz at m2 does not show the guideNote', () => {
    const p = person('raz-peretz');
    renderPerson(p.id, 'm2');
    expect(screen.queryByRole('heading', { name: t('person.guideNote') })).toBeNull();
    expectHidden(p.guideNote ?? '');
  });

  it('awad-darawshe (standard, has guideNote) shows it at m5 without a gate', () => {
    const p = person('awad-darawshe');
    renderPerson(p.id, 'm5');
    expect(screen.queryByTestId('warning-gate')).toBeNull();
    expectShown(p.guideNote ?? '');
  });
});

describe('PersonPage — content-warning gate', () => {
  it('aner-shapira at m2 hides opening and oct7 behind the gate until "show"', async () => {
    const p = person('aner-shapira');
    expect(p.oct7Sensitivity).toBe('graphic');
    renderPerson(p.id, 'm2');
    // F-22: a graphic person's opening sits behind the gate with oct7.
    expectHidden(p.opening);
    expect(screen.getByRole('heading', { level: 2, name: t('person.oct7') })).toBeInTheDocument();
    expect(screen.getByTestId('warning-gate')).toBeInTheDocument();
    expectHidden(p.oct7);
    await userEvent.setup().click(screen.getByTestId('warning-show'));
    expect(screen.queryByTestId('warning-gate')).toBeNull();
    expectShown(p.opening);
    expectShown(p.oct7);
  });

  it('"skip" keeps oct7 hidden', async () => {
    const p = person('aner-shapira');
    renderPerson(p.id, 'm2');
    await userEvent.setup().click(screen.getByTestId('warning-skip'));
    expect(screen.getByText(t('warning.skipped'))).toBeInTheDocument();
    expectHidden(p.oct7);
    expect(screen.queryByText(quoteText(p))).toBeNull();
  });

  it('graphic: the s30 block is behind the gate, the hint is not', async () => {
    const p = person('aner-shapira');
    renderPerson(p.id, 's30');
    expect(screen.getByText(t('depth.s30.hint'))).toBeInTheDocument();
    expect(screen.getByTestId('warning-gate')).toBeInTheDocument();
    expectHidden(p.guideLevels.s30);
    await userEvent.setup().click(screen.getByTestId('warning-show'));
    expectShown(p.guideLevels.s30);
  });

  it('standard people never show a gate, at any depth', () => {
    for (const depth of ['s30', 'm2', 'm5'] as const) {
      for (const p of standard) {
        const { unmount } = renderPerson(p.id, depth);
        expect(screen.queryByTestId('warning-gate')).toBeNull();
        unmount();
      }
    }
  });
});

describe('PersonPage — Gate G2: graphic quotes inside the oct7 gate', () => {
  it('there is at least one graphic and one standard person', () => {
    expect(graphic.length).toBeGreaterThan(0);
    expect(standard.length).toBeGreaterThan(0);
  });

  it.each(['m2', 'm5'] as const)(
    'graphic person at %s: quote text absent before "show", present after',
    async (depth) => {
      for (const p of graphic) {
        const { unmount } = renderPerson(p.id, depth);
        // One gate only: the quote shares the oct7 gate.
        expect(screen.getAllByTestId('warning-gate')).toHaveLength(1);
        expect(screen.queryByText(quoteText(p))).toBeNull();
        expect(blockquotes()).toEqual([]);
        await userEvent.setup().click(screen.getByTestId('warning-show'));
        expect(screen.getByText(quoteText(p))).toBeInTheDocument();
        unmount();
        sessionStorage.clear();
      }
    },
  );

  it('graphic person with altQuote at m5: altQuote absent before "show", present after', async () => {
    const p = person('aviel-rahamim');
    expect(p.oct7Sensitivity).toBe('graphic');
    expect(p.altQuote).toBeDefined();
    renderPerson(p.id, 'm5');
    expect(blockquotes()).toEqual([]);
    await userEvent.setup().click(screen.getByTestId('warning-show'));
    expect(blockquotes()).toEqual([quoteText(p), `„${p.altQuote!.text}”`]);
    // The rest of the story stays outside the gate.
    expectShown(p.personality);
  });

  it('graphic person at m5: personality, past and sources are visible while the gate is closed', () => {
    const p = person('aner-shapira');
    renderPerson(p.id, 'm5');
    expectHidden(p.oct7);
    expectShown(p.personality);
    expectShown(p.past);
    expect(
      screen.getByRole('heading', { level: 2, name: t('person.sources') }),
    ).toBeInTheDocument();
  });

  it.each(['m2', 'm5'] as const)('standard person at %s: quote always visible', (depth) => {
    for (const p of standard) {
      const { unmount } = renderPerson(p.id, depth);
      expect(screen.getByText(quoteText(p))).toBeInTheDocument();
      unmount();
    }
  });
});

/** Visible text of the whole rendered page, whitespace-normalised. */
function pageText(): string {
  return (document.body.textContent ?? '').replace(/\s+/g, ' ');
}

describe('PersonPage — F-22 gentle opening for graphic people', () => {
  it.each(['m2', 'm5'] as const)(
    'every graphic person at %s: no opening, oct7, quote or altQuote in the DOM before "show"',
    async (depth) => {
      for (const p of graphic) {
        const { unmount } = renderPerson(p.id, depth);
        const before = pageText();
        expect(before, `${p.id} opening`).not.toContain(plain(p.opening));
        expect(before, `${p.id} oct7`).not.toContain(plain(p.oct7));
        // quote / altQuote: no QuoteBlock at all. (Their words may also appear in the story text
        // outside the gate, e.g. in `after`, so the blocks are checked, as in the G2 tests.)
        expect(blockquotes(), `${p.id} quote/altQuote`).toEqual([]);
        expect(before, `${p.id} quote`).not.toContain(quoteText(p));
        // Every graphic person has a Shuki-approved gentleOpening (C-07), shown before the gate.
        expect(p.gentleOpening, `${p.id} gentleOpening`).toBeDefined();
        expect(before, `${p.id} gentleOpening visible`).toContain(plain(p.gentleOpening ?? ''));

        await userEvent.setup().click(screen.getByTestId('warning-show'));
        const after = pageText();
        expect(after).toContain(plain(p.opening));
        expect(after).toContain(plain(p.oct7));
        expect(blockquotes()[0]).toBe(quoteText(p));
        // The opening comes before oct7 inside the revealed region.
        expect(after.indexOf(plain(p.opening))).toBeLessThan(after.indexOf(plain(p.oct7)));
        unmount();
        sessionStorage.clear();
      }
    },
  );

  it('every graphic person at s30: guideLevels.s30 not in the DOM before "show"', () => {
    for (const p of graphic) {
      const { unmount } = renderPerson(p.id, 's30');
      expect(pageText()).not.toContain(plain(p.guideLevels.s30));
      expect(pageText()).not.toContain(plain(p.opening));
      unmount();
    }
  });

  it.each(['m2', 'm5'] as const)(
    'fictional graphic person with gentleOpening at %s: gentleOpening shown outside the gate',
    async (depth) => {
      renderPerson(gentle.id, depth);
      expect(screen.getByTestId('warning-gate')).toBeInTheDocument();
      expectShown(gentle.gentleOpening);
      const before = pageText();
      expect(before).not.toContain(gentle.opening);
      expect(before).not.toContain(gentle.oct7);
      expect(before).not.toContain(gentle.quote.text);
      expect(before).not.toContain(gentle.altQuote.text);
      // gentleOpening comes before the gate.
      expect(before.indexOf(gentle.gentleOpening)).toBeLessThan(before.indexOf(t('warning.title')));

      await userEvent.setup().click(screen.getByTestId('warning-show'));
      expectShown(gentle.gentleOpening);
      expectShown(gentle.opening);
      expectShown(gentle.oct7);
      expect(screen.getByText(`„${gentle.quote.text}”`)).toBeInTheDocument();
      sessionStorage.clear();
    },
  );

  it('fictional graphic person at s30: gentleOpening is not shown (s30 renders guideLevels.s30 only)', () => {
    renderPerson(gentle.id, 's30');
    expect(pageText()).not.toContain(gentle.gentleOpening);
    expect(pageText()).not.toContain(gentle.guideLevels.s30);
  });

  it.each(['m2', 'm5'] as const)(
    'standard people at %s: opening shown before the oct7 section, no gate',
    (depth) => {
      for (const p of standard) {
        const { unmount } = renderPerson(p.id, depth);
        expect(screen.queryByTestId('warning-gate')).toBeNull();
        expectShown(p.opening);
        expect(screen.getByRole('tabpanel').firstElementChild?.tagName).not.toBe('SECTION');
        unmount();
      }
    },
  );
});

describe('PersonPage — end-of-story anemone (D-09 #9)', () => {
  const marks = () => Array.from(document.querySelectorAll('img[src="./icons/mark.svg"]'));

  it('m5: one decorative mark, after the story and before the sources heading', () => {
    renderPerson('roni-eshel', 'm5');
    const all = marks();
    expect(all).toHaveLength(1);
    const mark = all[0]!;
    expect(mark).toHaveAttribute('alt', '');
    expect(mark).toHaveAttribute('aria-hidden', 'true');
    const sources = screen.getByRole('heading', { level: 2, name: t('person.sources') });
    expect(mark.compareDocumentPosition(sources) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const quote = document.querySelector('blockquote')!;
    expect(quote.compareDocumentPosition(mark) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it.each(['s30', 'm2'] as const)('%s: no end mark', (depth) => {
    renderPerson('roni-eshel', depth);
    expect(marks()).toHaveLength(0);
  });
});
