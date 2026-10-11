/** Hebrew duration. Throws RangeError for non-integers or values < 1. */
export function formatMinutes(min: number): string {
  if (!Number.isInteger(min) || min < 1) {
    throw new RangeError(`formatMinutes: expected an integer >= 1, got ${min}`);
  }
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) {
    return m === 1 ? 'דקה' : `${m} דקות`;
  }
  const hours = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : `${h} שעות`;
  if (m === 0) return hours;
  if (m === 30) return `${hours} וחצי`;
  if (m === 1) return `${hours} ודקה`;
  return `${hours} ו-${m} דקות`;
}

/**
 * Hebrew distance.
 * m < 995  → `${Math.max(10, Math.round(m / 10) * 10)} מטר`
 * m >= 995 → `${Math.round(m / 100) / 10} ק״מ` (no trailing ".0")
 */
export function formatDistance(meters: number): string {
  if (meters < 995) {
    return `${Math.max(10, Math.round(meters / 10) * 10)} מטר`;
  }
  return `${Math.round(meters / 100) / 10} ק״מ`;
}
