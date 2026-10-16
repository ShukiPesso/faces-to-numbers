import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { PrefsProvider } from '@/app/PrefsProvider';
import { routerFutureFlags, routes } from '@/app/router';
import { getStationBySlug, getStations, getTour } from '@/content';
import type { Station } from '@/content/schema';
import { t } from '@/lib/i18n';
import { getVisited } from '@/lib/storage';

// Mounts the full route table, so the page is tested inside the real AppLayout.
function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path], future: routerFutureFlags });
  const result = render(
    <PrefsProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </PrefsProvider>,
  );
  return { router, ...result };
}

function station(slug: string): Station {
  const found = getStationBySlug(slug);
  if (!found) throw new Error(`station ${slug} missing from content`);
  return found;
}

beforeAll(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  document.title = '';
});

describe('StationPage', () => {
  it('nova shows the header and the moment of silence', () => {
    const nova = station('nova');
    renderAt('/station/nova');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(nova.title);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    const main = within(screen.getByRole('main'));
    expect(
      main.getByText(
        (_c, el) =>
          el?.tagName === 'P' &&
          el.textContent === t('tour.stationOf', { n: nova.order, total: getStations().length }),
      ),
    ).toBeInTheDocument();
    expect(main.getByText(nova.subtitle)).toBeInTheDocument();
    expect(main.getByText(t('tour.kind.stop'))).toBeInTheDocument();
    expect(screen.getByTestId('share-button')).toBeInTheDocument();
    expect(screen.getByTestId('silence-start')).toBeInTheDocument();
    expect(main.getByText(nova.silenceMoment!.prompt)).toBeInTheDocument();
    expect(screen.queryByTestId('driver-warning')).not.toBeInTheDocument();
    expect(document.title).toBe(`${nova.title}${t('app.titleSuffix')}`);
  });

  it('renders the sections in the specified order', () => {
    renderAt('/station/reim-shelter');
    const headings = screen
      .getAllByRole('heading', { level: 2 })
      .map((h) => h.textContent)
      .filter((text) => text !== t('tour.title')); // SideNav list heading
    expect(headings).toEqual([
      t('station.background'),
      t('station.talkingPoints'),
      t('station.people'),
      t('station.companions'),
      t('silence.title'),
      t('station.access'),
      t('station.sources'),
    ]);
  });

  it('route-232 shows the driver warning and two PersonCards', () => {
    const drive = station('route-232');
    renderAt('/station/route-232');
    const warning = screen.getByTestId('driver-warning');
    expect(warning).toHaveTextContent(t('drive.warning'));
    // The warning comes before any section to read.
    const firstSection = screen.getByRole('heading', { name: t('station.background') });
    expect(
      warning.compareDocumentPosition(firstSection) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const cards = screen.getAllByTestId(/^person-card-/);
    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.dataset.testid)).toEqual(
      drive.personIds.map((id) => `person-card-${id}`),
    );
    expect(screen.queryByText(t('station.companions'))).not.toBeInTheDocument();
    expect(screen.queryByTestId('silence-start')).not.toBeInTheDocument();
    expect(screen.getByText(t('tour.kind.drive'))).toBeInTheDocument();
  });

  it('reim-shelter shows 2 primary and 2 companion cards', () => {
    const reim = station('reim-shelter');
    renderAt('/station/reim-shelter');
    const people = screen.getByRole('heading', { name: t('station.people') }).closest('section');
    const companions = screen
      .getByRole('heading', { name: t('station.companions') })
      .closest('section');
    expect(people).not.toBeNull();
    expect(companions).not.toBeNull();
    const primaryCards = within(people!).getAllByTestId(/^person-card-/);
    const companionCards = within(companions!).getAllByTestId(/^person-card-/);
    expect(primaryCards.map((c) => c.dataset.testid)).toEqual(
      reim.personIds.map((id) => `person-card-${id}`),
    );
    expect(companionCards.map((c) => c.dataset.testid)).toEqual(
      reim.companionPersonIds.map((id) => `person-card-${id}`),
    );
    for (const card of companionCards) {
      expect(card).toHaveTextContent(t('person.companion'));
    }
    for (const card of primaryCards) {
      expect(card).not.toHaveTextContent(t('person.companion'));
    }
  });

  it('closing-drive shows the end label and the closing text', () => {
    renderAt('/station/closing-drive');
    expect(screen.queryByTestId('next-station')).not.toBeInTheDocument();
    expect(screen.getByText(t('station.end'))).toBeInTheDocument();
    expect(screen.getByTestId('prev-station')).toHaveAttribute('href', '/station/tkuma');
    const firstParagraph = getTour().closing.split('\n\n')[0]!;
    expect(screen.getByText(firstParagraph)).toBeInTheDocument();
    // No people in the data → that section is not rendered. Since 2026-10-16 the Netivot
    // station has sources, so the sources section is shown.
    expect(screen.queryByText(t('station.people'))).not.toBeInTheDocument();
    expect(screen.getByText(t('station.sources'))).toBeInTheDocument();
  });

  it('an unknown slug shows NotFound', () => {
    renderAt('/station/no-such-station');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(t('notFound.title'));
    expect(screen.queryByTestId('mark-visited')).not.toBeInTheDocument();
    expect(document.querySelector('[data-sticky-bar]')).toBeNull();
  });

  it('renders previous and next as one bar marked for the layout to measure', () => {
    const first = getStations()[0]!;
    renderAt(`/station/${first.slug}`);
    expect(screen.queryByTestId('prev-station')).not.toBeInTheDocument();
    const next = screen.getByTestId('next-station');
    expect(next).toHaveAttribute('href', `/station/${getStations()[1]!.slug}`);
    expect(next).toHaveTextContent(t('station.next'));
    expect(next).toHaveTextContent(getStations()[1]!.title);
    expect(screen.getAllByTestId('next-station')).toHaveLength(1);
    expect(next.closest('[data-sticky-bar]')).not.toBeNull();
    expect(screen.queryByText(t('station.end'))).not.toBeInTheDocument();
  });

  it('navigates to the next station', async () => {
    const { router } = renderAt('/station/reim-shelter');
    await userEvent.setup().click(screen.getByTestId('next-station'));
    expect(router.state.location.pathname).toBe('/station/nova');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(station('nova').title);
  });

  it('mark-visited toggles the stored visit and its label', async () => {
    const nova = station('nova');
    renderAt('/station/nova');
    const user = userEvent.setup();
    const button = screen.getByTestId('mark-visited');
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).toHaveTextContent(t('station.markVisited'));
    await user.click(button);
    expect(getVisited()).toContain(nova.id);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button).toHaveTextContent(t('station.unmarkVisited'));
    await user.click(button);
    expect(getVisited()).not.toContain(nova.id);
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows Waze, Google Maps and Apple Maps links once a location is verified (Shuki, 2026-10-16)', () => {
    renderAt('/station/observers-hill');
    expect(screen.queryByTestId('location-unverified')).not.toBeInTheDocument();
    expect(screen.getByTestId('nav-waze')).toBeInTheDocument();
    expect(screen.getByTestId('nav-google')).toBeInTheDocument();
    expect(screen.getByTestId('nav-apple')).toBeInTheDocument();
  });

  it('renders every talking point and every source of the station', () => {
    const tkuma = station('tkuma');
    renderAt('/station/tkuma');
    for (const point of tkuma.talkingPoints) {
      expect(screen.getByText(point)).toBeInTheDocument();
    }
    const sources = screen.getByRole('heading', { name: t('station.sources') }).closest('section');
    expect(within(sources!).getAllByRole('link')).toHaveLength(tkuma.sources.length);
  });
});

describe('StationPage reading depth (Shuki, 2026-10-16)', () => {
  it('shows 2 min / 5 min / full tabs with 2 min selected and the background text', () => {
    renderAt('/station/sderot');
    const tablist = screen.getByTestId('depth-tabs');
    const tabs = within(tablist).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      t('depth.m2'),
      t('depth.m5'),
      t('depth.full'),
    ]);
    expect(within(tablist).getByRole('tab', { name: t('depth.m2') })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const panel = screen.getByTestId('station-depth-panel');
    const firstParagraph = station('sderot').background.split('\n\n')[0]!;
    expect(within(panel).getByText(firstParagraph)).toBeInTheDocument();
  });

  it('switches to history5 and historyFull', async () => {
    const user = userEvent.setup();
    const sderot = station('sderot');
    renderAt('/station/sderot');
    await user.click(screen.getByRole('tab', { name: t('depth.m5') }));
    const panel = screen.getByTestId('station-depth-panel');
    const first5 = sderot.history5!.split('\n\n')[0]!;
    expect(within(panel).getByText(first5)).toBeInTheDocument();
    expect(within(panel).queryByText(t('depth.full.hint'))).not.toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: t('depth.full') }));
    expect(screen.getByRole('tab', { name: t('depth.full') })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const fullPanel = screen.getByTestId('station-depth-panel');
    expect(within(fullPanel).getByText(t('depth.full.hint'))).toBeInTheDocument();
    expect(within(fullPanel).getByText('העיר שלפני')).toBeInTheDocument();
  });

  it('every station has both history levels', () => {
    for (const s of getStations()) {
      expect(s.history5, s.id).toBeTruthy();
      expect(s.historyFull, s.id).toBeTruthy();
    }
  });

  it('keeps the person depth tabs unchanged (30 sec / 2 min / 5 min)', () => {
    renderAt('/person/aner-shapira');
    const tabs = within(screen.getByTestId('depth-tabs')).getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual([
      t('depth.s30'),
      t('depth.m2'),
      t('depth.m5'),
    ]);
  });
});

describe('StationPage — design system "מאפר לכלנית"', () => {
  it('opens with a NightBand holding the only h1, and sets the ash theme', () => {
    renderAt('/station/sderot');
    const band = screen.getByTestId('night-band');
    expect(within(band).getByRole('heading', { level: 1 })).toHaveTextContent(station('sderot').title);
    expect(document.documentElement.dataset.theme).toBe('ash');
    expect(screen.queryByTestId('rising-anemone')).not.toBeInTheDocument();
  });

  it('the closing station is bloom and shows the rising anemone', () => {
    renderAt('/station/closing-drive');
    expect(document.documentElement.dataset.theme).toBe('bloom');
    expect(screen.getByTestId('rising-anemone')).toHaveAttribute('alt', '');
  });
});
