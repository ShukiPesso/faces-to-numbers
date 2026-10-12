import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NearbyBanner } from '@/components/tour/NearbyBanner';
import type { Station } from '@/content/schema';
import type { NearbyState } from '@/hooks/useNearbyStation';
import { t } from '@/lib/i18n';

const station: Station = {
  id: 'test-station-a',
  order: 1,
  slug: 'test-station-a',
  title: 'תחנת בדיקה א',
  subtitle: 'דמות בדיקה 1',
  kind: 'stop',
  durationMin: 10,
  location: { lat: 31.5, lng: 34.5, verified: true, verifiedBy: 'בודק', verifiedAt: '2026-01-01' },
  radiusM: 300,
  background: 'רקע בדיקה לתחנה בדיקה',
  talkingPoints: ['נקודת בדיקה ראשונה'],
  personIds: [],
  companionPersonIds: [],
  sensitivity: 'standard',
  silenceMoment: null,
  driverWarning: false,
  sourceFile: 'content-source/stations/01_test-station-a.md',
  sources: [],
};

function setup(state: NearbyState) {
  const onLocate = vi.fn();
  render(<NearbyBanner state={state} onLocate={onLocate} />);
  return { onLocate, banner: screen.getByTestId('nearby-banner') };
}

describe('CT-NEARBY-01 NearbyBanner', () => {
  it('idle: button, privacy line, empty polite region, no link', () => {
    const { banner } = setup({ status: 'idle' });
    expect(screen.getByTestId('where-am-i')).toHaveTextContent(t('nearby.button'));
    expect(screen.getByText(t('nearby.privacy'))).toBeInTheDocument();
    expect(banner).toHaveAttribute('aria-live', 'polite');
    expect(banner).toHaveTextContent('');
    expect(within(banner).queryByRole('link')).toBeNull();
  });

  it('clicking the button calls onLocate', async () => {
    const { onLocate } = setup({ status: 'idle' });
    await userEvent.click(screen.getByTestId('where-am-i'));
    expect(onLocate).toHaveBeenCalledTimes(1);
  });

  it('locating: message, busy button ignores clicks', async () => {
    const { banner, onLocate } = setup({ status: 'locating' });
    expect(banner).toHaveTextContent(t('nearby.locating'));
    const button = screen.getByTestId('where-am-i');
    expect(button).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(button);
    expect(onLocate).not.toHaveBeenCalled();
  });

  it('denied', () => {
    const { banner } = setup({ status: 'denied' });
    expect(banner).toHaveTextContent(t('nearby.denied'));
    expect(within(banner).queryByRole('link')).toBeNull();
    expect(screen.getByTestId('where-am-i')).not.toHaveAttribute('aria-busy');
  });

  it('unavailable', () => {
    const { banner } = setup({ status: 'unavailable' });
    expect(banner).toHaveTextContent(t('nearby.unavailable'));
    expect(within(banner).queryByRole('link')).toBeNull();
  });

  it('at: message with title and link to the station', () => {
    const { banner } = setup({
      status: 'done',
      result: { kind: 'at', station, distanceM: 40 },
    });
    expect(banner).toHaveTextContent(t('nearby.at', { title: station.title }));
    const link = within(banner).getByRole('link', { name: t('nearby.open') });
    expect(link).toHaveAttribute('href', '#/station/test-station-a');
  });

  it('near: message with title and formatted distance, and link', () => {
    const { banner } = setup({
      status: 'done',
      result: { kind: 'near', station, distanceM: 1234 },
    });
    expect(banner).toHaveTextContent(
      t('nearby.near', { title: station.title, distance: '1.2 ק״מ' }),
    );
    expect(within(banner).getByRole('link', { name: t('nearby.open') })).toHaveAttribute(
      'href',
      '#/station/test-station-a',
    );
  });

  it('none: message, no link', () => {
    const { banner } = setup({ status: 'done', result: { kind: 'none' } });
    expect(banner).toHaveTextContent(t('nearby.none'));
    expect(within(banner).queryByRole('link')).toBeNull();
  });

  it('shows the privacy line in every state', () => {
    const states: NearbyState[] = [
      { status: 'idle' },
      { status: 'locating' },
      { status: 'denied' },
      { status: 'unavailable' },
      { status: 'done', result: { kind: 'none' } },
    ];
    for (const s of states) {
      const { unmount } = render(<NearbyBanner state={s} onLocate={() => undefined} />);
      expect(screen.getByText(t('nearby.privacy'))).toBeInTheDocument();
      unmount();
    }
  });
});
