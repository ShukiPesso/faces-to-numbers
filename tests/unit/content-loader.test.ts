import { describe, expect, it } from 'vitest';
import { raw as realRaw } from '@/content/data.real';
import {
  ContentError,
  getNextStation,
  getPeople,
  getPeopleForStation,
  getPersonById,
  getPrevStation,
  getStationBySlug,
  getStations,
  getTour,
  validateContent,
} from '@/content/index';

type Item = Record<string, unknown>;
interface MutableSet {
  tour: Item;
  stations: Item[];
  people: Item[];
}

/** Deep clone of the real raw content, typed loosely so a test can break it on purpose. */
function cloneReal(): MutableSet {
  return structuredClone(realRaw) as unknown as MutableSet;
}

function find(items: Item[], id: string): Item {
  const item = items.find((i) => i['id'] === id);
  if (!item) {
    throw new Error(`test setup: no item with id ${id}`);
  }
  return item;
}

function strings(item: Item, key: string): string[] {
  const value = item[key];
  if (!Array.isArray(value)) {
    throw new Error(`test setup: ${key} is not an array`);
  }
  return value as string[];
}

/** Runs validateContent and returns the ContentError it throws (fails the test otherwise). */
function expectContentError(set: MutableSet): ContentError {
  try {
    validateContent(set);
  } catch (error) {
    expect(error).toBeInstanceOf(ContentError);
    return error as ContentError;
  }
  throw new Error('validateContent did not throw');
}

describe('content loader — real content', () => {
  it('has 7 stations and 9 people, sorted by order', () => {
    const stations = getStations();
    const people = getPeople();
    expect(stations).toHaveLength(7);
    expect(people).toHaveLength(9);
    expect(stations.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(people.map((p) => p.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('tour.stationIds matches the stations in order', () => {
    expect(getTour().stationIds).toEqual(getStations().map((s) => s.id));
  });

  it('getStationBySlug finds nova and returns undefined for an unknown slug', () => {
    expect(getStationBySlug('nova')?.id).toBe('nova');
    expect(getStationBySlug('no-such-station')).toBeUndefined();
  });

  it('getPersonById finds a person and returns undefined for an unknown id', () => {
    expect(getPersonById('roni-eshel')?.id).toBe('roni-eshel');
    expect(getPersonById('no-such-person')).toBeUndefined();
  });

  it('getPeopleForStation(reim-shelter) returns 2 primary and 2 companions', () => {
    const { primary, companions } = getPeopleForStation('reim-shelter');
    expect(primary.map((p) => p.id)).toEqual(['aner-shapira', 'hersh-goldberg-polin']);
    expect(companions.map((p) => p.id)).toEqual(['raz-peretz', 'aviel-rahamim']);
  });

  it('getPeopleForStation of an unknown station returns empty lists', () => {
    expect(getPeopleForStation('no-such-station')).toEqual({ primary: [], companions: [] });
  });

  it('next/prev walk the stations in order and are undefined at both ends', () => {
    const stations = getStations();
    const first = stations[0];
    const second = stations[1];
    const last = stations[stations.length - 1];
    if (!first || !second || !last) {
      throw new Error('expected stations');
    }
    expect(getPrevStation(first.id)).toBeUndefined();
    expect(getNextStation(last.id)).toBeUndefined();
    expect(getNextStation(first.id)?.id).toBe(second.id);
    expect(getPrevStation(second.id)?.id).toBe(first.id);
    expect(getNextStation('no-such-station')).toBeUndefined();
    expect(getPrevStation('no-such-station')).toBeUndefined();
  });

  it('getters return copies, so callers cannot reorder the cached content', () => {
    getStations().reverse();
    getPeople().reverse();
    expect(getStations()[0]?.order).toBe(1);
    expect(getPeople()[0]?.order).toBe(1);
  });
});

describe('validateContent', () => {
  it('accepts the real content and sorts by order', () => {
    const set = cloneReal();
    set.stations.reverse();
    const result = validateContent(set);
    expect(result.stations.map((s) => s.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('reports a duplicate id', () => {
    const set = cloneReal();
    const copy = structuredClone(find(set.people, 'roni-eshel'));
    set.people.push(copy);
    const error = expectContentError(set);
    expect(error.message).toContain('duplicate person id: roni-eshel');
  });

  it('reports a duplicate station slug', () => {
    const set = cloneReal();
    find(set.stations, 'tkuma')['slug'] = 'nova';
    expect(expectContentError(set).message).toContain('duplicate station slug: nova');
  });

  it('reports an unknown referenced person', () => {
    const set = cloneReal();
    strings(find(set.stations, 'nova'), 'personIds').push('ghost-person');
    const error = expectContentError(set);
    expect(error.message).toContain(
      'station "nova": personIds references unknown person "ghost-person"',
    );
  });

  it('reports an unknown referenced station', () => {
    const set = cloneReal();
    strings(find(set.people, 'roni-eshel'), 'stationIds').push('ghost-station');
    expect(expectContentError(set).message).toContain(
      'person "roni-eshel": stationIds references unknown station "ghost-station"',
    );
  });

  it('reports a one-directional reference (station → person)', () => {
    const set = cloneReal();
    strings(find(set.stations, 'nova'), 'companionPersonIds').push('roni-eshel');
    const error = expectContentError(set);
    expect(error.message).toContain('one-directional reference');
    expect(error.message).toContain('station "nova" lists person "roni-eshel"');
  });

  it('reports a one-directional reference (person → station)', () => {
    const set = cloneReal();
    strings(find(set.people, 'roni-eshel'), 'stationIds').push('nova');
    const error = expectContentError(set);
    expect(error.message).toContain('one-directional reference');
    expect(error.message).toContain('person "roni-eshel" lists station "nova"');
  });

  it('reports a non-contiguous order', () => {
    const set = cloneReal();
    find(set.stations, 'closing-drive')['order'] = 9;
    const error = expectContentError(set);
    expect(error.message).toContain('station orders must be contiguous from 1 to 7');
    expect(error.message).toContain('[1, 2, 3, 4, 5, 6, 9]');
  });

  it('reports a person who is both primary and companion at one station', () => {
    const set = cloneReal();
    strings(find(set.stations, 'reim-shelter'), 'companionPersonIds').push('aner-shapira');
    expect(expectContentError(set).message).toContain(
      'station "reim-shelter": person "aner-shapira" is both primary and companion',
    );
  });

  it('reports tour.stationIds out of order', () => {
    const set = cloneReal();
    strings(set.tour, 'stationIds').reverse();
    expect(expectContentError(set).message).toContain(
      'tour.stationIds must equal the station ids sorted by order',
    );
  });

  it('reports a person who appears in no station', () => {
    const set = cloneReal();
    find(set.stations, 'observers-hill')['personIds'] = [];
    const message = expectContentError(set).message;
    expect(message).toContain('person "roni-eshel" does not appear in any station');
  });

  it('reports zod schema problems with the item and field path', () => {
    const set = cloneReal();
    find(set.people, 'roni-eshel')['pronoun'] = 'it';
    expect(expectContentError(set).message).toMatch(/person "roni-eshel": pronoun: /);
  });

  it('reports ALL problems at once, not just the first', () => {
    const set = cloneReal();
    set.people.push(structuredClone(find(set.people, 'roni-eshel')));
    strings(find(set.stations, 'nova'), 'personIds').push('ghost-person');
    strings(find(set.stations, 'tkuma'), 'companionPersonIds').push('roni-eshel');
    find(set.stations, 'closing-drive')['order'] = 9;
    const error = expectContentError(set);
    expect(error.problems.length).toBeGreaterThanOrEqual(4);
    expect(error.message).toContain('duplicate person id: roni-eshel');
    expect(error.message).toContain('unknown person "ghost-person"');
    expect(error.message).toContain('station "tkuma" lists person "roni-eshel"');
    expect(error.message).toContain('station orders must be contiguous');
    expect(error.message).toContain(`${error.problems.length} problem(s)`);
  });
});
