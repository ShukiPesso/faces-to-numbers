import { describe, expect, it, vi } from 'vitest';
import { he } from '@/i18n/he';
import { t, type StringKey } from '@/lib/i18n';

describe('UT-I18N-01 t()', () => {
  it('replaces a single placeholder', () => {
    expect(t('home.resume', { n: 4 })).toBe(he['home.resume'].replace('{n}', '4'));
  });

  it('replaces several placeholders', () => {
    expect(t('tour.stationOf', { n: 2, total: 7 })).toBe(
      he['tour.stationOf'].replace('{n}', '2').replace('{total}', '7'),
    );
  });

  it('leaves a missing placeholder untouched and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(t('home.resume')).toBe(he['home.resume']);
    expect(t('home.resume', {})).toContain('{n}');
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('returns keys without placeholders unchanged', () => {
    const key = (Object.keys(he) as StringKey[]).find((k) => !/\{\w+\}/.test(he[k]));
    expect(key).toBeDefined();
    if (key !== undefined) {
      expect(t(key)).toBe(he[key]);
    }
  });
});
