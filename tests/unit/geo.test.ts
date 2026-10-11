import { describe, expect, it } from 'vitest';
import type { Station } from '@/content/schema';
import { findNearbyStation, haversineMeters } from '@/lib/geo';

const base: Station = {
  id: 'test-station-a',
  order: 1,
  slug: 'test-station-a',
  title: 'תחנת בדיקה א',
  subtitle: 'דמות בדיקה 1',
  kind: 'stop',
  durationMin: 10,
  location: null,
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

const origin = { lat: 31.5, lng: 34.5 };
// ~111.19 m per 0.001 degree of latitude
const northOf = (m: number) => ({ lat: origin.lat + m / 111_194.9, lng: origin.lng });

function makeStation(overrides: Partial<Station> = {}): Station {
  return { ...base, ...overrides };
}

function placed(
  id: string,
  order: number,
  point: { lat: number; lng: number },
  extra: Partial<Station> = {},
  verified = true,
): Station {
  return makeStation({
    id,
    slug: id,
    order,
    location: {
      ...point,
      verified,
      ...(verified ? { verifiedBy: 'בודק', verifiedAt: '2026-01-01' } : {}),
    },
    ...extra,
  });
}

describe('haversineMeters', () => {
  it('UT-GEO-01 identical points = 0', () => {
    expect(haversineMeters(origin, origin)).toBe(0);
  });

  it('UT-GEO-02 is symmetric', () => {
    const a = { lat: 31.52, lng: 34.6 };
    const b = { lat: 31.4, lng: 34.45 };
    expect(haversineMeters(a, b)).toBe(haversineMeters(b, a));
  });

  it('UT-GEO-03 0.1 degree of latitude = 11119.5 m', () => {
    const d = haversineMeters({ lat: 31.5, lng: 34.5 }, { lat: 31.6, lng: 34.5 });
    expect(Math.abs(d - 11_119.5)).toBeLessThanOrEqual(1);
  });
});

describe('findNearbyStation', () => {
  it('UT-GEO-04 ignores location null and verified false', () => {
    const stations = [
      makeStation({ id: 'no-loc', slug: 'no-loc', order: 1, location: null }),
      placed('unverified', 2, origin, {}, false),
    ];
    expect(findNearbyStation(origin, stations)).toEqual({ kind: 'none' });
  });

  it('UT-GEO-05 inside radius -> at', () => {
    const s = placed('inside', 1, northOf(100), { radiusM: 300 });
    const r = findNearbyStation(origin, [s]);
    expect(r.kind).toBe('at');
    if (r.kind === 'at') {
      expect(r.station.id).toBe('inside');
      expect(r.distanceM).toBe(Math.round(haversineMeters(origin, s.location!)));
    }
  });

  it('UT-GEO-06 outside radius within max -> near with distance', () => {
    const s = placed('outside', 1, northOf(1000), { radiusM: 300 });
    const r = findNearbyStation(origin, [s]);
    expect(r.kind).toBe('near');
    if (r.kind === 'near') {
      expect(r.station.id).toBe('outside');
      expect(Number.isInteger(r.distanceM)).toBe(true);
      expect(Math.abs(r.distanceM - 1000)).toBeLessThanOrEqual(1);
    }
  });

  it('UT-GEO-07 beyond max -> none; custom maxDistanceM respected', () => {
    const s = placed('far', 1, northOf(6000));
    expect(findNearbyStation(origin, [s])).toEqual({ kind: 'none' });
    expect(findNearbyStation(origin, [s], 7000).kind).toBe('near');
    const close = placed('close', 1, northOf(1000));
    expect(findNearbyStation(origin, [close], 500)).toEqual({ kind: 'none' });
    expect(findNearbyStation(origin, [])).toEqual({ kind: 'none' });
  });

  it('UT-GEO-08 equal distance -> lower order wins', () => {
    const p = northOf(1000);
    const hi = placed('order-two', 2, p);
    const lo = placed('order-one', 1, p);
    for (const list of [
      [hi, lo],
      [lo, hi],
    ]) {
      const r = findNearbyStation(origin, list);
      expect(r.kind === 'near' && r.station.id).toBe('order-one');
    }
    const atR = findNearbyStation(origin, [
      placed('a-two', 2, northOf(50)),
      placed('a-one', 1, northOf(50)),
    ]);
    expect(atR.kind === 'at' && atR.station.id).toBe('a-one');
  });

  it('UT-GEO-09 inside two radii -> closest wins', () => {
    const far = placed('wider', 1, northOf(400), { radiusM: 1000 });
    const near = placed('closer', 2, northOf(100), { radiusM: 300 });
    const r = findNearbyStation(origin, [far, near]);
    expect(r.kind).toBe('at');
    if (r.kind === 'at') expect(r.station.id).toBe('closer');
  });

  it('picks an inside station even when a closer one is outside its own smaller radius', () => {
    const smallClose = placed('small', 1, northOf(150), { radiusM: 100 });
    const wideFar = placed('wide', 2, northOf(500), { radiusM: 1000 });
    const r = findNearbyStation(origin, [smallClose, wideFar]);
    expect(r.kind === 'at' && r.station.id).toBe('wide');
  });
});
