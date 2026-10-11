import { he } from '@/i18n/he';

export type StringKey = keyof typeof he;

export type StringParams = Record<string, string | number>;

const warned = new Set<string>();

/**
 * Returns the Hebrew string for `key`, replacing each `{name}` placeholder with
 * `String(params[name])` when `params` has that name. Unknown placeholders are left untouched;
 * in dev a single console warning is emitted per missing placeholder.
 */
export function t(key: StringKey, params?: StringParams): string {
  const template: string = he[key];
  return template.replace(/\{(\w+)\}/g, (match: string, name: string) => {
    if (params !== undefined && Object.prototype.hasOwnProperty.call(params, name)) {
      return String(params[name]);
    }
    if (import.meta.env.DEV) {
      const id = `${key}:${name}`;
      if (!warned.has(id)) {
        warned.add(id);
        console.warn(`t(): missing placeholder {${name}} for key "${key}"`);
      }
    }
    return match;
  });
}
