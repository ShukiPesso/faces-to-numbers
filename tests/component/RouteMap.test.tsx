import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RouteMap } from '@/components/tour/RouteMap';
import { getStations } from '@/content';
import { t } from '@/lib/i18n';

afterEach(cleanup);

function renderMap(visitedIds: string[] = [], currentId?: string) {
  const stations = getStations();
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <RouteMap stations={stations} visitedIds={visitedIds} currentId={currentId} />
    </MemoryRouter>,
  );
  return stations;
}

const markerLinks = (container: Element) => Array.from(container.querySelectorAll('a'));

describe('RouteMap', () => {
  it('renders the svg with role img, the aria-label and the test id', () => {
    renderMap();
    const svg = screen.getByTestId('route-map');
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(svg).toHaveAttribute('role', 'img');
    expect(svg).toHaveAttribute('aria-label', t('tour.mapAlt'));
  });

  it('wraps the svg in a left-to-right container', () => {
    renderMap();
    expect(screen.getByTestId('route-map').parentElement?.className).toContain('[direction:ltr]');
  });

  it('renders 7 marker links with the station hrefs', () => {
    const stations = renderMap();
    const svg = screen.getByTestId('route-map');
    const links = markerLinks(svg);
    expect(links).toHaveLength(7);
    for (const station of stations) {
      const group = svg.querySelector(`g#marker-${station.id}`);
      expect(group).not.toBeNull();
      expect(group?.closest('a')).toHaveAttribute('href', `/station/${station.slug}`);
    }
  });

  it('keeps marker links out of the keyboard and accessibility tree', () => {
    renderMap();
    for (const a of markerLinks(screen.getByTestId('route-map'))) {
      expect(a).toHaveAttribute('tabindex', '-1');
      expect(a).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('applies the visited class and a check badge only for visited ids', () => {
    renderMap(['sderot', 'nova']);
    const svg = screen.getByTestId('route-map');
    const visited = Array.from(svg.querySelectorAll('g.is-visited')).map((g) => g.id);
    expect(visited).toEqual(['marker-sderot', 'marker-nova']);
    expect(svg.querySelectorAll('.visited-badge')).toHaveLength(2);
    expect(svg.querySelector('#marker-route-232')).not.toHaveClass('is-visited');
  });

  it('marks the current station with the class and aria-current', () => {
    renderMap([], 'observers-hill');
    const svg = screen.getByTestId('route-map');
    const group = svg.querySelector('#marker-observers-hill');
    expect(group).toHaveClass('is-current');
    expect(group?.closest('a')).toHaveAttribute('aria-current', 'step');
    expect(svg.querySelectorAll('.is-current')).toHaveLength(1);
  });

  it('renders the border label, the north label and the schematic note', () => {
    renderMap();
    const texts = Array.from(screen.getByTestId('route-map').querySelectorAll('text')).map(
      (node) => node.textContent,
    );
    expect(texts).toContain(t('map.border'));
    expect(texts).toContain(t('map.north'));
    expect(texts).toContain(t('map.schematicNote'));
  });

  it('makes no network request', () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    renderMap(['sderot'], 'nova');
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByTestId('route-map').querySelector('image, use, foreignObject')).toBeNull();
    vi.unstubAllGlobals();
  });
});
