// UT-MAP-01..05 — pure geometry helpers used by scripts/map/build-map-data.mjs.
import { describe, expect, it } from 'vitest';
import {
  clipLine,
  clipPolygon,
  nearestOnLines,
  roundCoords,
  simplify,
  stitch,
} from '../../scripts/map/geo-utils.mjs';

const BOX = { west: 34, south: 31, east: 35, north: 32 };

describe('map geo utils', () => {
  it('UT-MAP-01 simplify drops near-collinear points and keeps the ends', () => {
    const line = [
      [34.5, 31.5],
      [34.50001, 31.55],
      [34.5, 31.6],
    ];
    expect(simplify(line, 50, 31.5)).toEqual([
      [34.5, 31.5],
      [34.5, 31.6],
    ]);
    const bent = [
      [34.5, 31.5],
      [34.6, 31.55],
      [34.5, 31.6],
    ];
    expect(simplify(bent, 50, 31.5)).toHaveLength(3);
  });

  it('UT-MAP-02 stitch joins ways sharing end points in any direction', () => {
    const a = [
      [0, 0],
      [1, 0],
    ];
    const b = [
      [2, 0],
      [1, 0],
    ];
    const c = [
      [2, 0],
      [3, 0],
    ];
    expect(stitch([a, c, b])).toEqual([
      [
        [0, 0],
        [1, 0],
        [2, 0],
        [3, 0],
      ],
    ]);
  });

  it('UT-MAP-03 clipPolygon keeps the part inside the box and closes the ring', () => {
    const square = [
      [33.5, 31.5],
      [34.5, 31.5],
      [34.5, 31.8],
      [33.5, 31.8],
      [33.5, 31.5],
    ];
    const out = clipPolygon(square, BOX);
    expect(out[0]).toEqual(out[out.length - 1]);
    for (const [x, y] of out) {
      expect(x).toBeGreaterThanOrEqual(34);
      expect(y).toBeGreaterThanOrEqual(31);
    }
    expect(
      clipPolygon(
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 0],
        ],
        BOX,
      ),
    ).toEqual([]);
  });

  it('UT-MAP-04 clipLine splits at the box edge with interpolated end points', () => {
    const pieces = clipLine(
      [
        [33.5, 31.5],
        [34.5, 31.5],
        [35.5, 31.5],
      ],
      BOX,
    );
    expect(pieces).toHaveLength(1);
    const piece = pieces[0] ?? [];
    expect(piece[0]?.[0]).toBeCloseTo(34, 6);
    expect(piece.at(-1)?.[0]).toBeCloseTo(35, 6);
  });

  it('UT-MAP-05 nearestOnLines and roundCoords', () => {
    const p = nearestOnLines(
      [34.5, 31.6],
      [
        [
          [34, 31.5],
          [35, 31.5],
        ],
      ],
      31.5,
    );
    expect(p?.[0]).toBeCloseTo(34.5, 6);
    expect(p?.[1]).toBeCloseTo(31.5, 6);
    expect(roundCoords([[34.1234567, 31.7654321]])).toEqual([[34.12346, 31.76543]]);
  });
});
