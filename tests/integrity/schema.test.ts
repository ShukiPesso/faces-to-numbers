import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { raw as fixtureRaw } from '@/content/data.fixture';
import { raw as realRaw } from '@/content/data.real';
import { validateContent } from '@/content/index';
import { PersonSchema, StationSchema, TourSchema } from '@/content/schema';
import type { ZodError } from 'zod';

const CONTENT_DIR = fileURLToPath(new URL('../../src/content', import.meta.url));

const SETS = [
  { name: 'real', dir: join(CONTENT_DIR, 'data'), raw: realRaw, stations: 7, people: 9 },
  { name: 'fixture', dir: join(CONTENT_DIR, 'fixtures'), raw: fixtureRaw, stations: 3, people: 3 },
] as const;

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, 'utf8')) as unknown;
}

function describeIssues(error: ZodError | undefined): string {
  return error ? error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') : '';
}

describe.each(SETS)('$name content', (set) => {
  const peopleDir = join(set.dir, 'people');
  const personFiles = readdirSync(peopleDir)
    .filter((name) => name.endsWith('.json'))
    .sort();

  describe('CI-01 every JSON file parses with its zod schema', () => {
    it('tour.json parses with TourSchema', () => {
      const result = TourSchema.safeParse(readJson(join(set.dir, 'tour.json')));
      expect(describeIssues(result.error)).toBe('');
      expect(result.success).toBe(true);
    });

    it('stations.json is an array of the expected size, each item parses with StationSchema', () => {
      const stations = readJson(join(set.dir, 'stations.json'));
      expect(Array.isArray(stations)).toBe(true);
      const items = stations as unknown[];
      expect(items).toHaveLength(set.stations);
      items.forEach((item, index) => {
        const result = StationSchema.safeParse(item);
        expect(describeIssues(result.error), `stations[${index}]`).toBe('');
        expect(result.success).toBe(true);
      });
    });

    it('has the expected number of person files', () => {
      expect(personFiles).toHaveLength(set.people);
    });

    it.each(personFiles)(
      'people/%s parses with PersonSchema and its id matches the file name',
      (file) => {
        const result = PersonSchema.safeParse(readJson(join(peopleDir, file)));
        expect(describeIssues(result.error)).toBe('');
        expect(result.data?.id).toBe(file.replace(/\.json$/, ''));
      },
    );
  });

  describe('CI-02 validateContent passes (all cross-references)', () => {
    it('validates without problems', () => {
      const content = validateContent(set.raw);
      expect(content.stations).toHaveLength(set.stations);
      expect(content.people).toHaveLength(set.people);
    });
  });
});

describe('fixture set matches docs/04_TESTING_STRATEGY.md §3 and is fictional', () => {
  const content = validateContent(fixtureRaw);
  const station = (id: string) => content.stations.find((s) => s.id === id);
  const person = (id: string) => content.people.find((p) => p.id === id);

  it('stations test-a, test-b, test-c with the documented locations, radii and people', () => {
    expect(content.stations.map((s) => [s.id, s.order, s.kind, s.radiusM])).toEqual([
      ['test-a', 1, 'stop', 300],
      ['test-b', 2, 'stop', 300],
      ['test-c', 3, 'drive', 300],
    ]);
    expect(station('test-a')?.location).toEqual({
      lat: 31.4,
      lng: 34.5,
      verified: true,
      verifiedBy: 'fixture',
      verifiedAt: '2026-01-01',
    });
    expect(station('test-b')?.location).toEqual({
      lat: 31.45,
      lng: 34.55,
      verified: true,
      verifiedBy: 'fixture',
      verifiedAt: '2026-01-01',
    });
    expect(station('test-c')?.location).toBeNull();
    expect(station('test-c')?.driverWarning).toBe(true);
    expect(station('test-a')?.personIds).toEqual(['test-person-1']);
    expect(station('test-b')?.personIds).toEqual(['test-person-2']);
    expect(station('test-b')?.companionPersonIds).toEqual(['test-person-3']);
    expect(station('test-b')?.silenceMoment?.seconds).toBe(5);
    expect(station('test-c')?.personIds).toEqual([]);
    expect(station('test-c')?.companionPersonIds).toEqual([]);
  });

  it('people test-person-1..3 with the documented variants', () => {
    expect(person('test-person-1')).toMatchObject({ pronoun: 'he', oct7Sensitivity: 'standard' });
    expect(person('test-person-1')?.after).toBeDefined();
    expect(person('test-person-2')).toMatchObject({ pronoun: 'she', oct7Sensitivity: 'graphic' });
    expect(person('test-person-2')?.after).toBeUndefined();
    expect(person('test-person-3')?.guideNote).toBeDefined();
  });

  it('uses only fictional placeholder names and titles (Conventions §1.11)', () => {
    content.people.forEach((p, index) => {
      expect(p.name).toBe(`דמות בדיקה ${index + 1}`);
      expect(p.sourceFile).toBe(`content-source/people/00_test-person-${index + 1}.md`);
    });
    expect(content.stations.map((s) => s.title)).toEqual([
      'תחנת בדיקה א',
      'תחנת בדיקה ב',
      'תחנת בדיקה ג',
    ]);
    expect(content.stations.map((s) => s.sourceFile)).toEqual([
      'content-source/stations/00_test-a.md',
      'content-source/stations/00_test-b.md',
      'content-source/stations/00_test-c.md',
    ]);
  });
});
