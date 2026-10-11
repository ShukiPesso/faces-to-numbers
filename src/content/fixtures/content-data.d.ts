/**
 * Type of the `@content-data` Vite alias (vite.config.ts), which resolves to
 * `src/content/data.real.ts` or, in the `e2e` mode, `src/content/data.fixture.ts`.
 * TypeScript has no path mapping for it in tsconfig.json, so it is declared here.
 * Both data modules annotate `raw` with the same type, so they stay in sync with this.
 */
declare module '@content-data' {
  export const raw: import('@/content/schema').RawContentSet;
}
