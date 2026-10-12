import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { PrefsProvider } from '@/app/PrefsProvider';
import { usePrefs } from '@/app/prefsContext';
import { routerFutureFlags, routes } from '@/app/router';
import { getPeople, getStationBySlug, getStations, getTour } from '@/content';
import { t } from '@/lib/i18n';
import { markVisited } from '@/lib/storage';

function renderAt(path: string) {
  const router = createMemoryRouter(routes, {
    initialEntries: [path],
    future: routerFutureFlags,
  });
  const result = render(
    <PrefsProvider>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </PrefsProvider>,
  );
  return { router, ...result };
}

const suffix = t('app.titleSuffix');

beforeAll(() => {
  // jsdom does not implement scrolling; the layout scrolls to top on route change.
  vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
});

afterEach(() => {
  cleanup();
  document.title = '';
  delete document.documentElement.dataset.readAloud;
});

describe('AppLayout — landmarks and skip link', () => {
  it('makes the skip link the first focusable element, pointing at #main', async () => {
    renderAt('/');
    const user = userEvent.setup();
    await user.tab();
    const skip = screen.getByTestId('skip-link');
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute('href', '#main');
    expect(skip).toHaveTextContent(t('app.skipToContent'));
  });

  it('moves focus to <main> when the skip link is activated, without navigating', async () => {
    const { router } = renderAt('/about');
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('main')).toHaveFocus();
    expect(router.state.location.pathname).toBe('/about');
  });

  it('renders the banner, labelled navigation, main and contentinfo landmarks', () => {
    renderAt('/');
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main');
    expect(main).toHaveAttribute('tabindex', '-1');
    const navs = screen.getAllByRole('navigation', { name: t('nav.label') });
    // BottomNav and SideNav; CSS shows exactly one of them per breakpoint.
    expect(navs).toHaveLength(2);
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument();
    expect(screen.getByTestId('side-nav')).toBeInTheDocument();
  });

  it('keeps DOM order: skip link, header, side nav, main, footer, bottom nav', () => {
    const { container } = renderAt('/');
    const order = [
      screen.getByTestId('skip-link'),
      screen.getByRole('banner'),
      screen.getByTestId('side-nav'),
      screen.getByRole('main'),
      screen.getByRole('contentinfo'),
      screen.getByTestId('bottom-nav'),
    ];
    for (let i = 1; i < order.length; i += 1) {
      const prev = order[i - 1]!;
      const next = order[i]!;
      expect(prev.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    }
    expect(container.querySelector('[data-slot="header-actions"]')).toBeInTheDocument();
  });
});

describe('routes', () => {
  it('/ renders the home stub with its title', async () => {
    renderAt('/');
    expect(
      await screen.findByRole('heading', { level: 1, name: t('app.name') }),
    ).toBeInTheDocument();
    expect(document.title).toBe(`${t('app.name')}${suffix}`);
  });

  it.each([
    ['/tour', 'tour.title'],
    ['/about', 'about.title'],
    ['/sources', 'sources.title'],
  ] as const)('%s renders its h1 and document.title', async (path, key) => {
    renderAt(path);
    expect(await screen.findByRole('heading', { level: 1, name: t(key) })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(document.title).toBe(`${t(key)}${suffix}`);
  });

  it('/station/nova renders the station title from content', async () => {
    const station = getStationBySlug('nova');
    expect(station).toBeDefined();
    renderAt('/station/nova');
    const title = station!.title;
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument();
    expect(document.title).toBe(`${title}${suffix}`);
  });

  it('/person/:id renders the person name from content', async () => {
    const person = getPeople()[0]!;
    renderAt(`/person/${person.id}`);
    expect(await screen.findByRole('heading', { level: 1, name: person.name })).toBeInTheDocument();
    expect(document.title).toBe(`${person.name}${suffix}`);
  });

  it.each(['/nope', '/station/no-such-station', '/person/no-such-person'])(
    '%s shows NotFound with a link home',
    async (path) => {
      renderAt(path);
      expect(
        await screen.findByRole('heading', { level: 1, name: t('notFound.title') }),
      ).toBeInTheDocument();
      expect(screen.getByText(t('notFound.body'))).toBeInTheDocument();
      const main = screen.getByRole('main');
      expect(within(main).getByRole('link', { name: t('notFound.home') })).toHaveAttribute(
        'href',
        '/',
      );
      expect(document.title).toBe(`${t('notFound.title')}${suffix}`);
    },
  );

  it('moves focus to <main> after navigating', async () => {
    renderAt('/');
    const user = userEvent.setup();
    const bottomNav = screen.getByTestId('bottom-nav');
    await user.click(within(bottomNav).getByRole('link', { name: t('nav.about') }));
    expect(
      await screen.findByRole('heading', { level: 1, name: t('about.title') }),
    ).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
  });
});

describe('BottomNav', () => {
  it('has four labelled links with the right targets', () => {
    renderAt('/');
    const nav = screen.getByTestId('bottom-nav');
    const links = within(nav).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([
      t('nav.home'),
      t('nav.tour'),
      t('nav.whereAmI'),
      t('nav.about'),
    ]);
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/',
      '/tour',
      '/tour?locate=1',
      '/about',
    ]);
    expect(links[0]).toHaveAttribute('aria-current', 'page');
  });

  it('on /tour?locate=1 marks the tour item current and never "where am I"', () => {
    renderAt('/tour?locate=1');
    const nav = screen.getByTestId('bottom-nav');
    expect(within(nav).getByRole('link', { name: t('nav.tour') })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(within(nav).getByRole('link', { name: t('nav.whereAmI') })).not.toHaveAttribute(
      'aria-current',
    );
  });
});

describe('SideNav', () => {
  it('lists every station in order, marks the current and visited ones', () => {
    const stations = getStations();
    const nova = getStationBySlug('nova')!;
    const first = stations[0]!;
    markVisited(first.id);
    renderAt('/station/nova');
    const nav = screen.getByTestId('side-nav');
    const items = within(nav).getAllByRole('listitem');
    // four primary links + one item per station
    expect(items).toHaveLength(4 + stations.length);
    expect(
      within(nav).getByRole('heading', { level: 2, name: t('tour.title') }),
    ).toBeInTheDocument();

    const novaLink = within(nav).getByRole('link', { name: new RegExp(nova.title) });
    expect(novaLink).toHaveAttribute('aria-current', 'page');
    expect(novaLink).toHaveAttribute('href', '/station/nova');
    expect(novaLink).toHaveTextContent(
      t('tour.stationOf', { n: nova.order, total: stations.length }),
    );

    const firstLink = within(nav).getByRole('link', { name: new RegExp(first.title) });
    expect(firstLink).toHaveTextContent(t('tour.visited'));
    expect(novaLink).not.toHaveTextContent(t('tour.visited'));
  });
});

describe('Footer', () => {
  it('links to sources and about and shows the last content review date', () => {
    renderAt('/');
    const footer = screen.getByRole('contentinfo');
    expect(within(footer).getByRole('link', { name: t('nav.sources') })).toHaveAttribute(
      'href',
      '/sources',
    );
    expect(within(footer).getByRole('link', { name: t('nav.about') })).toHaveAttribute(
      'href',
      '/about',
    );
    const date = getTour().lastContentReview;
    expect(footer).toHaveTextContent(t('about.lastReview', { date }));
    expect(within(footer).getByText(date).tagName).toBe('BDI');
  });
});

describe('PrefsProvider', () => {
  function ReadAloudProbe() {
    const { readAloud, setReadAloud, depth, setDepth } = usePrefs();
    return (
      <>
        <button type="button" onClick={() => setReadAloud(!readAloud)}>
          read-aloud {String(readAloud)}
        </button>
        <button type="button" onClick={() => setDepth('m5')}>
          depth {depth}
        </button>
      </>
    );
  }

  it('reflects read-aloud on <html> and persists both prefs', async () => {
    render(
      <PrefsProvider>
        <ReadAloudProbe />
      </PrefsProvider>,
    );
    const user = userEvent.setup();
    expect(document.documentElement.dataset.readAloud).toBeUndefined();
    await user.click(screen.getByRole('button', { name: 'read-aloud false' }));
    expect(document.documentElement.dataset.readAloud).toBe('true');
    expect(localStorage.getItem('ftn:v1:readAloud')).toBe('true');
    await user.click(screen.getByRole('button', { name: 'read-aloud true' }));
    expect(document.documentElement.dataset.readAloud).toBeUndefined();

    await user.click(screen.getByRole('button', { name: 'depth m2' }));
    expect(screen.getByRole('button', { name: 'depth m5' })).toBeInTheDocument();
    expect(localStorage.getItem('ftn:v1:depth')).toBe('"m5"');
  });

  it('throws when usePrefs is used outside the provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => render(<ReadAloudProbe />)).toThrow(/PrefsProvider/);
    spy.mockRestore();
  });
});

describe('ErrorBoundary', () => {
  it('renders the error element with a reload button when a route throws', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    function Boom(): never {
      throw new Error('boom');
    }
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: routes[0]!.element,
          errorElement: routes[0]!.errorElement,
          children: [{ index: true, element: <Boom /> }],
        },
      ],
      { initialEntries: ['/'], future: routerFutureFlags },
    );
    await act(async () => {
      render(<RouterProvider router={router} future={{ v7_startTransition: true }} />);
      await Promise.resolve();
    });
    expect(
      await screen.findByRole('heading', { level: 1, name: t('error.title') }),
    ).toBeInTheDocument();
    expect(screen.getByText(t('error.body'))).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t('error.reload') })).toBeInTheDocument();
    expect(document.title).toBe(`${t('error.title')}${suffix}`);
    spy.mockRestore();
  });
});
