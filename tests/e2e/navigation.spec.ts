import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

interface StationData {
  id: string;
  slug: string;
  order: number;
  title: string;
  personIds: string[];
}

interface PersonData {
  id: string;
  name: string;
  honorific?: string | null;
}

const DATA_DIR = fileURLToPath(new URL('../../src/content/data', import.meta.url));

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(file, 'utf8')) as unknown;
}

const stations = (readJson(join(DATA_DIR, 'stations.json')) as StationData[])
  .slice()
  .sort((a, b) => a.order - b.order);

const people = new Map<string, PersonData>();
for (const name of readdirSync(join(DATA_DIR, 'people')).filter((n) => n.endsWith('.json'))) {
  const person = readJson(join(DATA_DIR, 'people', name)) as PersonData;
  people.set(person.id, person);
}

function stationAt(index: number): StationData {
  const station = stations[index];
  if (!station) throw new Error(`no station at index ${index}`);
  return station;
}

function fullName(person: PersonData): string {
  return person.honorific ? `${person.name} ${person.honorific}` : person.name;
}

function h1(page: Page) {
  return page.getByRole('heading', { level: 1 });
}

async function expectStationPage(page: Page, station: StationData): Promise<void> {
  await expect(h1(page)).toHaveText(station.title);
  await expect(page).toHaveTitle(new RegExp(escapeRegExp(station.title)));
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test.describe('navigation', () => {
  test('E2E-NAV-01 walk the whole tour in order', async ({ page }) => {
    expect(stations.length).toBeGreaterThan(2);
    const first = stationAt(0);

    await page.goto('/');
    await page.getByTestId('start-tour').click();
    // The start button goes straight to the first station (see report: spec said /tour).
    await expect(page).toHaveURL(new RegExp(`#/station/${escapeRegExp(first.slug)}$`));
    await expectStationPage(page, first);

    // The tour overview lists every station, and the first card opens the first station.
    await page.goto('/#/tour');
    await expect(page.getByTestId(`station-card-${first.id}`)).toBeVisible();
    for (const station of stations) {
      await expect(page.getByTestId(`station-card-${station.id}`)).toHaveCount(1);
    }
    await page.getByTestId(`station-card-${first.id}`).click();
    await expectStationPage(page, first);

    for (const [index, station] of stations.entries()) {
      await expectStationPage(page, station);

      for (const personId of station.personIds) {
        const person = people.get(personId);
        expect(person, `person ${personId} exists in content`).toBeDefined();
        if (!person) continue;
        const card = page.getByTestId(`person-card-${person.id}`);
        await card.getByRole('link').click();
        await expect(h1(page)).toHaveText(fullName(person));
        await expect(page).toHaveTitle(new RegExp(escapeRegExp(person.name)));
        await page.goBack();
        await expectStationPage(page, station);
      }

      const next = stations[index + 1];
      if (next) {
        await page.getByTestId('next-station').click();
        await expectStationPage(page, next);
      } else {
        await expect(page.getByTestId('next-station')).toHaveCount(0);
      }
    }

    await expectStationPage(page, stationAt(stations.length - 1));
  });

  test('E2E-NAV-02 every page opens directly by link', async ({ page }) => {
    for (const station of stations) {
      await page.goto(`/#/station/${station.slug}`);
      await expectStationPage(page, station);
    }
    for (const person of people.values()) {
      await page.goto(`/#/person/${person.id}`);
      await expect(h1(page)).toHaveText(fullName(person));
    }

    for (const bad of ['/#/station/nope', '/#/person/nope']) {
      await page.goto(bad);
      await expect(h1(page)).toBeVisible();
      await expect(page.getByTestId('next-station')).toHaveCount(0);
      const home = page.getByRole('main').getByRole('link').last();
      await home.click();
      await expect(page).toHaveURL(/#\/$|\/$/);
      await expect(page.getByTestId('start-tour')).toBeVisible();
    }
  });

  test('E2E-NAV-03 progress is remembered and can be reset', async ({ page }) => {
    expect(stations.length).toBeGreaterThan(3);
    const third = stationAt(2);
    const fourth = stationAt(3);

    await page.goto('/');
    await expect(page.getByTestId('resume-tour')).toHaveCount(0);

    await page.goto(`/#/station/${third.slug}`);
    await expectStationPage(page, third);
    const mark = page.getByTestId('mark-visited');
    await expect(mark).toHaveAttribute('aria-pressed', 'false');
    await mark.click();
    await expect(mark).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await expectStationPage(page, third);
    await expect(page.getByTestId('mark-visited')).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/#/');
    const resume = page.getByTestId('resume-tour');
    await expect(resume).toBeVisible();
    await resume.click();
    await expectStationPage(page, fourth);

    await page.goto('/#/');
    await page.getByTestId('reset-progress').click();
    await expect(page.getByTestId('resume-tour')).toHaveCount(0);
    await expect(page.getByTestId('start-tour')).toBeVisible();
  });
});
