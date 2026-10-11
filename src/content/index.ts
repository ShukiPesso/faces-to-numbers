/**
 * Content loader and typed getters (Architecture §6). All content in the app is read through
 * these functions. `@content-data` resolves to the real content (`./data.real.ts`) or, in the
 * `e2e` build mode only, to the fictional fixtures (`./data.fixture.ts`).
 */
import { raw } from '@content-data';
import type { ZodError } from 'zod';
import {
  PersonSchema,
  StationSchema,
  TourSchema,
  type ContentSet,
  type Person,
  type RawContentSet,
  type Station,
  type Tour,
} from './schema';

/** Thrown by `validateContent`; `problems` lists every problem found, not just the first. */
export class ContentError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(
      `Invalid content: ${problems.length} problem(s) found\n${problems.map((p) => `- ${p}`).join('\n')}`,
    );
    this.name = 'ContentError';
    this.problems = problems;
  }
}

function formatZodError(label: string, error: ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `${label}: ${path}: ${issue.message}`;
  });
}

/** Best-effort id of an unparsed item, so problem messages can name it. */
function rawId(item: unknown): string | undefined {
  if (typeof item === 'object' && item !== null && 'id' in item) {
    const id = item.id;
    if (typeof id === 'string') {
      return id;
    }
  }
  return undefined;
}

function itemLabel(kind: 'station' | 'person', item: unknown, index: number): string {
  const id = rawId(item);
  return id === undefined ? `${kind}[${index}]` : `${kind} "${id}"`;
}

function findDuplicates<T>(values: readonly T[]): T[] {
  const seen = new Set<T>();
  const duplicates = new Set<T>();
  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }
    seen.add(value);
  }
  return [...duplicates];
}

function checkUnique(kind: string, field: string, values: readonly (string | number)[]): string[] {
  return findDuplicates(values).map((value) => `duplicate ${kind} ${field}: ${String(value)}`);
}

function checkContiguousOrders(kind: string, orders: readonly number[]): string[] {
  const sorted = [...orders].sort((a, b) => a - b);
  const contiguous = sorted.every((order, index) => order === index + 1);
  return contiguous
    ? []
    : [`${kind} orders must be contiguous from 1 to ${orders.length}; got [${sorted.join(', ')}]`];
}

function byOrder<T extends { order: number }>(a: T, b: T): number {
  return a.order - b.order;
}

/**
 * Parses every item with its zod schema and checks every cross-reference rule of
 * Architecture §6. Collects all problems and throws one `ContentError` listing them all.
 * Returns stations and people sorted by `order`.
 */
export function validateContent(rawSet: RawContentSet): ContentSet {
  const problems: string[] = [];

  // 1. Schema parsing.
  const tourResult = TourSchema.safeParse(rawSet.tour);
  if (!tourResult.success) {
    problems.push(...formatZodError('tour', tourResult.error));
  }

  const stations: Station[] = [];
  rawSet.stations.forEach((item, index) => {
    const result = StationSchema.safeParse(item);
    if (result.success) {
      stations.push(result.data);
    } else {
      problems.push(...formatZodError(itemLabel('station', item, index), result.error));
    }
  });

  const people: Person[] = [];
  rawSet.people.forEach((item, index) => {
    const result = PersonSchema.safeParse(item);
    if (result.success) {
      people.push(result.data);
    } else {
      problems.push(...formatZodError(itemLabel('person', item, index), result.error));
    }
  });

  // Ids of every raw item (parsed or not), so a schema failure does not cascade into
  // misleading "unknown reference" problems.
  const knownStationIds = new Set(rawSet.stations.map(rawId).filter((id) => id !== undefined));
  const knownPersonIds = new Set(rawSet.people.map(rawId).filter((id) => id !== undefined));

  // 2. Uniqueness.
  problems.push(
    ...checkUnique(
      'station',
      'id',
      stations.map((s) => s.id),
    ),
  );
  problems.push(
    ...checkUnique(
      'station',
      'slug',
      stations.map((s) => s.slug),
    ),
  );
  problems.push(
    ...checkUnique(
      'station',
      'order',
      stations.map((s) => s.order),
    ),
  );
  problems.push(
    ...checkUnique(
      'person',
      'id',
      people.map((p) => p.id),
    ),
  );
  problems.push(
    ...checkUnique(
      'person',
      'order',
      people.map((p) => p.order),
    ),
  );

  // 3. Orders contiguous from 1 (stations and people separately).
  problems.push(
    ...checkContiguousOrders(
      'station',
      stations.map((s) => s.order),
    ),
  );
  problems.push(
    ...checkContiguousOrders(
      'person',
      people.map((p) => p.order),
    ),
  );

  // 4. References exist.
  for (const station of stations) {
    for (const personId of station.personIds) {
      if (!knownPersonIds.has(personId)) {
        problems.push(`station "${station.id}": personIds references unknown person "${personId}"`);
      }
    }
    for (const personId of station.companionPersonIds) {
      if (!knownPersonIds.has(personId)) {
        problems.push(
          `station "${station.id}": companionPersonIds references unknown person "${personId}"`,
        );
      }
    }
  }
  for (const person of people) {
    for (const stationId of person.stationIds) {
      if (!knownStationIds.has(stationId)) {
        problems.push(
          `person "${person.id}": stationIds references unknown station "${stationId}"`,
        );
      }
    }
  }

  // 5. No person is both primary and companion at the same station.
  for (const station of stations) {
    for (const personId of station.personIds) {
      if (station.companionPersonIds.includes(personId)) {
        problems.push(
          `station "${station.id}": person "${personId}" is both primary and companion`,
        );
      }
    }
  }

  // 6. Bidirectional: station S lists person P (primary or companion) ⇔ P.stationIds has S.
  const stationById = new Map(stations.map((s) => [s.id, s]));
  const personById = new Map(people.map((p) => [p.id, p]));
  for (const station of stations) {
    for (const personId of new Set([...station.personIds, ...station.companionPersonIds])) {
      const person = personById.get(personId);
      if (person && !person.stationIds.includes(station.id)) {
        problems.push(
          `one-directional reference: station "${station.id}" lists person "${personId}", but that person's stationIds does not include "${station.id}"`,
        );
      }
    }
  }
  for (const person of people) {
    for (const stationId of person.stationIds) {
      const station = stationById.get(stationId);
      if (
        station &&
        !station.personIds.includes(person.id) &&
        !station.companionPersonIds.includes(person.id)
      ) {
        problems.push(
          `one-directional reference: person "${person.id}" lists station "${stationId}", but that station does not list the person in personIds or companionPersonIds`,
        );
      }
    }
  }

  // 7. Every person appears in at least one station.
  const referencedPersonIds = new Set(
    stations.flatMap((s) => [...s.personIds, ...s.companionPersonIds]),
  );
  for (const person of people) {
    if (!referencedPersonIds.has(person.id)) {
      problems.push(`person "${person.id}" does not appear in any station`);
    }
  }

  // 8. tour.stationIds equals station ids sorted by order.
  const sortedStations = [...stations].sort(byOrder);
  if (tourResult.success) {
    const expected = sortedStations.map((s) => s.id);
    const actual = tourResult.data.stationIds;
    const equal =
      expected.length === actual.length && expected.every((id, index) => id === actual[index]);
    if (!equal) {
      problems.push(
        `tour.stationIds must equal the station ids sorted by order; expected [${expected.join(', ')}], got [${actual.join(', ')}]`,
      );
    }
  }

  // 9. Every cleared photo src starts with /photos/.
  for (const person of people) {
    if (person.photo.status === 'cleared' && !person.photo.src.startsWith('/photos/')) {
      problems.push(`person "${person.id}": cleared photo src must start with /photos/`);
    }
  }

  if (problems.length > 0 || !tourResult.success) {
    throw new ContentError(problems);
  }

  return { tour: tourResult.data, stations: sortedStations, people: [...people].sort(byOrder) };
}

// Validated once at module load; every getter reads this cached result.
const content: ContentSet = validateContent(raw);
const stationsById = new Map(content.stations.map((s) => [s.id, s]));
const stationsBySlug = new Map(content.stations.map((s) => [s.slug, s]));
const peopleById = new Map(content.people.map((p) => [p.id, p]));

export function getTour(): Tour {
  return content.tour;
}

/** All stations, sorted by `order`. */
export function getStations(): Station[] {
  return [...content.stations];
}

export function getStationBySlug(slug: string): Station | undefined {
  return stationsBySlug.get(slug);
}

/** All people, sorted by `order`. */
export function getPeople(): Person[] {
  return [...content.people];
}

export function getPersonById(id: string): Person | undefined {
  return peopleById.get(id);
}

/**
 * The people of a station, in the order the station lists them. Primary vs companion is decided
 * by the station (Architecture §5). Unknown station → both lists empty.
 */
export function getPeopleForStation(stationId: string): {
  primary: Person[];
  companions: Person[];
} {
  const station = stationsById.get(stationId);
  if (!station) {
    return { primary: [], companions: [] };
  }
  const resolve = (ids: readonly string[]): Person[] =>
    ids.map((id) => peopleById.get(id)).filter((p): p is Person => p !== undefined);
  return { primary: resolve(station.personIds), companions: resolve(station.companionPersonIds) };
}

function stationAtOffset(stationId: string, offset: 1 | -1): Station | undefined {
  const index = content.stations.findIndex((s) => s.id === stationId);
  if (index === -1) {
    return undefined;
  }
  return content.stations[index + offset];
}

/** The station after `stationId` in tour order; undefined for the last or an unknown station. */
export function getNextStation(stationId: string): Station | undefined {
  return stationAtOffset(stationId, 1);
}

/** The station before `stationId` in tour order; undefined for the first or an unknown station. */
export function getPrevStation(stationId: string): Station | undefined {
  return stationAtOffset(stationId, -1);
}
