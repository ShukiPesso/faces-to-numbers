/**
 * FICTIONAL fixture content set (Conventions §1.11), used only by the `e2e` Vite mode through
 * the `@content-data` alias (Architecture §3) and by tests. It never reaches the production
 * bundle. Shape and fixture table: docs/04_TESTING_STRATEGY.md §3.
 */
import type { RawContentSet } from './schema';
import stations from './fixtures/stations.json';
import tour from './fixtures/tour.json';

const peopleModules: Record<string, unknown> = import.meta.glob('./fixtures/people/*.json', {
  eager: true,
  import: 'default',
});

export const raw: RawContentSet = {
  tour,
  stations,
  people: Object.keys(peopleModules)
    .sort()
    .map((file) => peopleModules[file]),
};
