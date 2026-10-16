/**
 * Design system "מאפר לכלנית" (2026-10-16): pages about what happened render in the `ash` theme,
 * everything else in `bloom`. The closing station (Netivot, "איך קמנו") is bloom.
 */
export type Theme = 'ash' | 'bloom';

export const CLOSING_STATION_SLUG = 'closing-drive';

export function themeForPath(pathname: string): Theme {
  const match = /^\/(station|person)\/([^/?#]+)/.exec(pathname);
  if (!match) return 'bloom';
  if (match[1] === 'station' && match[2] === CLOSING_STATION_SLUG) return 'bloom';
  return 'ash';
}
