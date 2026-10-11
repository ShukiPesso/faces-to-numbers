import type { Station } from '@/content/schema';

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_M = 6_371_008.8;
const DEFAULT_MAX_DISTANCE_M = 5000;

const toRadians = (deg: number): number => (deg * Math.PI) / 180;

/** Great-circle distance in metres. Earth radius = 6_371_008.8 m. Symmetric; 0 for identical points. */
export function haversineMeters(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export type NearbyResult =
  | { kind: 'at'; station: Station; distanceM: number } // inside station.radiusM
  | { kind: 'near'; station: Station; distanceM: number } // nearest, within maxDistanceM
  | { kind: 'none' };

type Candidate = { station: Station; distance: number };

const byDistanceThenOrder = (x: Candidate, y: Candidate): number =>
  x.distance - y.distance || x.station.order - y.station.order;

/**
 * Considers ONLY stations whose location is non-null AND verified === true.
 * If the position is inside the radius of one or more stations → 'at' the closest of them.
 * Else the closest station within maxDistanceM → 'near'. Else 'none'.
 * Ties (equal distance) → lower `order` wins.
 */
export function findNearbyStation(
  pos: LatLng,
  stations: Station[],
  maxDistanceM: number = DEFAULT_MAX_DISTANCE_M,
): NearbyResult {
  const candidates: Candidate[] = [];
  for (const station of stations) {
    if (station.location?.verified === true) {
      candidates.push({ station, distance: haversineMeters(pos, station.location) });
    }
  }
  candidates.sort(byDistanceThenOrder);

  const inside = candidates.find((c) => c.distance <= c.station.radiusM);
  if (inside) {
    return { kind: 'at', station: inside.station, distanceM: Math.round(inside.distance) };
  }
  const nearest = candidates[0];
  if (nearest && nearest.distance <= maxDistanceM) {
    return { kind: 'near', station: nearest.station, distanceM: Math.round(nearest.distance) };
  }
  return { kind: 'none' };
}
