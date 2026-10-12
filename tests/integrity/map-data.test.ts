// CI-11..12 — src/content/data/map-base.json must match the station coordinates it was built from.
// If this fails after a coordinate change: run the "Map data" workflow (Actions) and merge its branch.
import { describe, expect, it } from 'vitest';
import mapBase from '../../src/content/data/map-base.json';
import stationsJson from '../../src/content/data/stations.json';

interface Loc {
  lat: number;
  lng: number;
}
const raw = stationsJson as unknown as
  { id: string; location: Loc | null }[] | { stations: { id: string; location: Loc | null }[] };
const stations = Array.isArray(raw) ? raw : raw.stations;
const base = mapBase as unknown as {
  inputs: Record<string, [number, number]>;
  route: { from: string; to: string; coords: [number, number][] }[];
};

describe('map data', () => {
  it('CI-11 was built from the current station coordinates (else re-run the Map data workflow)', () => {
    const current = Object.fromEntries(
      stations.filter((s) => s.location).map((s) => [s.id, [s.location?.lng, s.location?.lat]]),
    );
    expect(base.inputs).toEqual(current);
  });

  it('CI-12 route legs start at the station they leave from', () => {
    for (const leg of base.route) {
      const from = base.inputs[leg.from];
      const first = leg.coords[0];
      expect(from, `leg from ${leg.from}`).toBeDefined();
      if (!from || !first) continue;
      // OSRM snaps to the nearest road; allow ~1 km.
      expect(Math.abs(first[0] - from[0]) + Math.abs(first[1] - from[1])).toBeLessThan(0.012);
    }
  });
});
