// Types for geo-utils.mjs (plain JS so the Map data workflow can run it with bare node).
export type Pt = number[]; // [lng, lat]
export interface Box {
  west: number;
  south: number;
  east: number;
  north: number;
}
export function toMetres(p: Pt, refLat: number): Pt;
export function simplify(coords: Pt[], toleranceM: number, refLat: number): Pt[];
export function roundCoords(coords: Pt[], digits?: number): Pt[];
export function stitch(ways: Pt[][]): Pt[][];
export function clipPolygon(ring: Pt[], box: Box): Pt[];
export function clipLine(coords: Pt[], box: Box): Pt[][];
export function nearestOnLines(p: Pt, lines: Pt[][], refLat: number): Pt | null;
