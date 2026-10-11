import { describe, expect, it } from 'vitest';
import { formatDistance, formatMinutes } from '@/lib/format';

describe('formatMinutes', () => {
  // UT-FMT-01
  it.each([
    [1, 'דקה'],
    [2, '2 דקות'],
    [15, '15 דקות'],
    [59, '59 דקות'],
    [60, 'שעה'],
    [61, 'שעה ודקה'],
    [75, 'שעה ו-15 דקות'],
    [90, 'שעה וחצי'],
    [120, 'שעתיים'],
    [121, 'שעתיים ודקה'],
    [150, 'שעתיים וחצי'],
    [180, '3 שעות'],
    [195, '3 שעות ו-15 דקות'],
    [210, '3 שעות וחצי'],
  ])('formats %i as %s', (input, expected) => {
    expect(formatMinutes(input)).toBe(expected);
  });

  // UT-FMT-02
  it.each([0, -1, 1.5, NaN])('throws RangeError for %s', (input) => {
    expect(() => formatMinutes(input)).toThrow(RangeError);
  });
});

describe('formatDistance', () => {
  // UT-FMT-03
  it.each([
    [0, '10 מטר'],
    [4, '10 מטר'],
    [345, '350 מטר'],
    [994, '990 מטר'],
    [995, '1 ק״מ'],
    [1000, '1 ק״מ'],
    [1234, '1.2 ק״מ'],
    [1250, '1.3 ק״מ'],
    [2950, '3 ק״מ'],
  ])('formats %i as %s', (input, expected) => {
    expect(formatDistance(input)).toBe(expected);
  });
});
