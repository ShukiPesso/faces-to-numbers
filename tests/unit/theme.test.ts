import { describe, expect, it } from 'vitest';
import { themeForPath } from '@/lib/theme';

describe('themeForPath (design system "מאפר לכלנית")', () => {
  it('stations 1–6 and people are ash', () => {
    expect(themeForPath('/station/sderot')).toBe('ash');
    expect(themeForPath('/station/nova')).toBe('ash');
    expect(themeForPath('/person/aner-shapira')).toBe('ash');
  });
  it('the closing station, home, tour, about and sources are bloom', () => {
    expect(themeForPath('/station/closing-drive')).toBe('bloom');
    expect(themeForPath('/')).toBe('bloom');
    expect(themeForPath('/tour')).toBe('bloom');
    expect(themeForPath('/about')).toBe('bloom');
    expect(themeForPath('/sources')).toBe('bloom');
  });
});
