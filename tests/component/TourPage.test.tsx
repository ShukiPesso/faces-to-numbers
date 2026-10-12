import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { routerFutureFlags } from '@/app/router';
import { getStations } from '@/content';
import type { Station } from '@/content/schema';
import { t } from '@/lib/i18n';
import { markVisited } from '@/lib/storage';
import { TourPage } from '@/pages/TourPage';

const getCurrentPosition = vi.fn();

beforeEach(() => {
  getCurrentPosition.mockReset();
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition },
  });
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function renderAt(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]} future={routerFutureFlags}>
      <TourPage />
    </MemoryRouter>,
  );
}

describe('TourPage', () => {
  it('shows the title, the map and 7 station cards', () => {
    renderAt('/tour');
    expect(screen.getByRole('heading', { level: 1, name: t('tour.title') })).toBeInTheDocument();
    expect(screen.getByTestId('route-map')).toBeInTheDocument();
    const stations = getStations();
    expect(stations).toHaveLength(7);
    for (const s of stations) {
      expect(screen.getByTestId(`station-card-${s.id}`)).toBeInTheDocument();
    }
    expect(screen.getAllByTestId(/^station-card-/)).toHaveLength(7);
    expect(document.title).toContain(t('tour.title'));
  });

  it('marks visited stations and the next one as current', () => {
    const [first, second] = getStations() as [Station, Station];
    markVisited(first.id);
    renderAt('/tour');
    expect(screen.getByTestId(`station-card-${first.id}`)).toHaveTextContent(t('tour.visited'));
    expect(screen.getByTestId(`station-card-${second.id}`)).toHaveAttribute('aria-current', 'step');
  });

  it('?locate=1 focuses the where-am-i button without reading the location', () => {
    renderAt('/tour?locate=1');
    expect(screen.getByTestId('where-am-i')).toHaveFocus();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('without ?locate=1 nothing is focused and the location is not read', () => {
    renderAt('/tour');
    expect(screen.getByTestId('where-am-i')).not.toHaveFocus();
    expect(getCurrentPosition).not.toHaveBeenCalled();
  });

  it('reads the location only after a tap', async () => {
    renderAt('/tour');
    await userEvent.click(screen.getByTestId('where-am-i'));
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
  });
});
