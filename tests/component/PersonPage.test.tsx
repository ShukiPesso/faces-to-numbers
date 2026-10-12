import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { PrefsProvider } from '@/app/PrefsProvider';
import { getPeople, getPersonById, getStations } from '@/content';
import type { Depth, Person } from '@/content/schema';
import { t } from '@/lib/i18n';
import { setDepth } from '@/lib/storage';
import { PersonPage } from '@/pages/PersonPage';

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
      expect(container.querySelector('img')).toBeNull();
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
  it('aner-shapira at m2 hides oct7 behind the gate until "show"', async () => {
    const p = person('aner-shapira');
    expect(p.oct7Sensitivity).toBe('graphic');
    renderPerson(p.id, 'm2');
    expectShown(p.opening);
    expect(screen.getByRole('heading', { level: 2, name: t('person.oct7') })).toBeInTheDocument();
    expect(screen.getByTestId('warning-gate')).toBeInTheDocument();
    expectHidden(p.oct7);
    await userEvent.setup().click(screen.getByTestId('warning-show'));
    expect(screen.queryByTestId('warning-gate')).toBeNull();
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
