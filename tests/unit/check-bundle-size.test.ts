import { describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM script without type declarations
import * as script from '../../scripts/check-bundle-size.mjs';

interface Row {
  key: string;
  actual: number;
  limit: number;
  ok: boolean;
}

type Sizes = Record<string, number>;
const { BUDGETS, evaluate } = script as unknown as {
  BUDGETS: Sizes;
  evaluate: (sizes: Sizes, budgets?: Sizes) => Row[];
};

const under = { jsGzip: 100, cssGzip: 10, fontsRaw: 50, precacheTotal: 1000, fileCount: 20 };
const budgets = { jsGzip: 200, cssGzip: 30, fontsRaw: 220, precacheTotal: 2000, fileCount: 300 };

describe('check-bundle-size evaluate()', () => {
  it('passes when every size is under its budget', () => {
    const rows = evaluate(under, budgets);
    expect(rows).toHaveLength(5);
    expect(rows.every((r) => r.ok)).toBe(true);
  });

  it('fails only the row that is over its budget', () => {
    const rows = evaluate({ ...under, cssGzip: 31 }, budgets);
    expect(rows.filter((r) => !r.ok).map((r) => r.key)).toEqual(['cssGzip']);
  });

  it('passes when a size is exactly at its limit', () => {
    const rows = evaluate({ ...budgets }, budgets);
    expect(rows.every((r) => r.ok)).toBe(true);
  });

  it('uses the Architecture §9 budgets by default', () => {
    expect(BUDGETS).toEqual({
      jsGzip: 200 * 1024,
      cssGzip: 30 * 1024,
      fontsRaw: 220 * 1024,
      precacheTotal: 2 * 1024 * 1024,
      fileCount: 300,
    });
  });
});
