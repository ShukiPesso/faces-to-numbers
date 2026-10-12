// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Station } from '@/content/schema';
import { useNearbyStation } from '@/hooks/useNearbyStation';

const stations: Station[] = [
  {
    id: 'test-station-a',
    order: 1,
    slug: 'test-station-a',
    title: 'תחנת בדיקה א',
    subtitle: 'דמות בדיקה 1',
    kind: 'stop',
    durationMin: 10,
    location: {
      lat: 31.5,
      lng: 34.5,
      verified: true,
      verifiedBy: 'בודק',
      verifiedAt: '2026-01-01',
    },
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
  },
];

vi.mock('@/content', () => ({ getStations: () => stations }));

type Success = (p: { coords: { latitude: number; longitude: number } }) => void;
type Failure = (e: { code: number }) => void;

let getCurrentPosition: ReturnType<typeof vi.fn>;
let watchPosition: ReturnType<typeof vi.fn>;

function stubGeolocation(): void {
  getCurrentPosition = vi.fn();
  watchPosition = vi.fn();
  vi.stubGlobal('navigator', { geolocation: { getCurrentPosition, watchPosition } });
}

const succeedWith = (lat: number, lng: number) =>
  getCurrentPosition.mockImplementation((ok: Success) =>
    ok({ coords: { latitude: lat, longitude: lng } }),
  );
const failWith = (code: number) =>
  getCurrentPosition.mockImplementation((_ok: Success, err: Failure) => err({ code }));

beforeEach(stubGeolocation);
afterEach(() => vi.unstubAllGlobals());

describe('useNearbyStation', () => {
  it('does not call geolocation on mount', () => {
    const { result } = renderHook(() => useNearbyStation());
    expect(result.current.state).toEqual({ status: 'idle' });
    expect(getCurrentPosition).not.toHaveBeenCalled();
    expect(watchPosition).not.toHaveBeenCalled();
  });

  it('success inside a radius → done / at, with the documented options', () => {
    succeedWith(31.5, 34.5);
    const { result } = renderHook(() => useNearbyStation());
    act(() => result.current.locate());
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    expect(getCurrentPosition.mock.calls[0]?.[2]).toEqual({
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 60000,
    });
    expect(watchPosition).not.toHaveBeenCalled();
    const s = result.current.state;
    expect(s.status).toBe('done');
    if (s.status === 'done') {
      expect(s.result.kind).toBe('at');
      if (s.result.kind === 'at') expect(s.result.station.id).toBe('test-station-a');
    }
  });

  it('success far away → done / none', () => {
    succeedWith(31.7, 34.8);
    const { result } = renderHook(() => useNearbyStation());
    act(() => result.current.locate());
    expect(result.current.state).toEqual({ status: 'done', result: { kind: 'none' } });
  });

  it('shows locating until the browser answers', () => {
    getCurrentPosition.mockImplementation(() => undefined);
    const { result } = renderHook(() => useNearbyStation());
    act(() => result.current.locate());
    expect(result.current.state).toEqual({ status: 'locating' });
  });

  it('error code 1 → denied', () => {
    failWith(1);
    const { result } = renderHook(() => useNearbyStation());
    act(() => result.current.locate());
    expect(result.current.state).toEqual({ status: 'denied' });
  });

  it('error code 2 → unavailable', () => {
    failWith(2);
    const { result } = renderHook(() => useNearbyStation());
    act(() => result.current.locate());
    expect(result.current.state).toEqual({ status: 'unavailable' });
  });

  it('error code 3 (timeout) → unavailable', () => {
    failWith(3);
    const { result } = renderHook(() => useNearbyStation());
    act(() => result.current.locate());
    expect(result.current.state).toEqual({ status: 'unavailable' });
  });

  it('missing API → unavailable', () => {
    vi.stubGlobal('navigator', {});
    const { result } = renderHook(() => useNearbyStation());
    act(() => result.current.locate());
    expect(result.current.state).toEqual({ status: 'unavailable' });
  });

  it('reset returns to idle, and a late answer after reset is ignored', () => {
    let ok: Success | undefined;
    getCurrentPosition.mockImplementation((cb: Success) => {
      ok = cb;
    });
    const { result } = renderHook(() => useNearbyStation());
    act(() => result.current.locate());
    act(() => result.current.reset());
    expect(result.current.state).toEqual({ status: 'idle' });
    act(() => ok?.({ coords: { latitude: 31.5, longitude: 34.5 } }));
    expect(result.current.state).toEqual({ status: 'idle' });
  });
});
