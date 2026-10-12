/**
 * F-02 — maps a parsed Markdown source file to the JSON shape of
 * `src/content/schema.ts`, exactly as `content-source/README.md` specifies.
 *
 * Values are copied through untouched. Shape-level validation (types, enums,
 * required fields) is left to the zod schemas in `build-content.ts`; this module
 * only rejects what the README calls a format error (unknown / duplicate keys,
 * malformed sections).
 */
import {
  parseBullets,
  parseFrontMatter,
  parseGuideLevels,
  parseQuote,
  parseSources,
  splitSections,
} from './parse.ts';

type Json = Record<string, unknown>;

/** Section keys allowed per file type (README "Sections:" lines). */
const PERSON_SECTIONS = new Set([
  'opening',
  'gentleOpening',
  'oct7',
  'personality',
  'past',
  'after',
  'quote',
  'altQuote',
  'guideLevels',
  'guideNote',
  'sources',
]);
const STATION_SECTIONS = new Set(['background', 'talkingPoints', 'accessNotes', 'sources']);
const TOUR_SECTIONS = new Set([
  'intro',
  'message',
  'safety',
  'howTo',
  'closing',
  'about',
  'rights',
]);

/** Front matter keys allowed per file type (README tables). */
const PERSON_FRONT = new Set([
  'id',
  'order',
  'name',
  'honorific',
  'pronoun',
  'subtitle',
  'stationIds',
  'oct7Sensitivity',
  'photoReferenceUrl',
  'consent',
  'photo',
]);
const STATION_FRONT = new Set([
  'id',
  'slug',
  'order',
  'title',
  'subtitle',
  'kind',
  'durationMin',
  'radiusM',
  'location',
  'personIds',
  'companionPersonIds',
  'sensitivity',
  'driverWarning',
  'silenceMoment',
  'lastVerified',
]);
const TOUR_FRONT = new Set([
  'id',
  'title',
  'subtitle',
  'totalDurationMin',
  'stationIds',
  'lastContentReview',
  'contactEmail',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertKnownKeys(
  keys: Iterable<string>,
  allowed: Set<string>,
  what: string,
  file: string,
): void {
  for (const key of keys) {
    if (!allowed.has(key)) {
      throw new Error(`${file}: unknown ${what} key "${key}"`);
    }
  }
}

function toSourceFile(relPath: string): string {
  return relPath.replace(/\\/g, '/');
}

/** YAML may parse `2026-10-11` into a Date; always emit `YYYY-MM-DD`. */
function isoDate(value: unknown): unknown {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value;
}

/** Copies only the keys that are present (`undefined` values are dropped). */
function compact(obj: Json): Json {
  const out: Json = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function load(relPath: string, text: string, frontKeys: Set<string>, sectionKeys: Set<string>) {
  const file = toSourceFile(relPath);
  const { data, body } = parseFrontMatter(text, file);
  assertKnownKeys(Object.keys(data), frontKeys, 'front matter', file);
  const sections = splitSections(body, file);
  assertKnownKeys(Object.keys(sections), sectionKeys, 'section', file);
  return { file, data, sections };
}

function buildPhoto(data: Record<string, unknown>): Json {
  const referenceUrl = data.photoReferenceUrl;
  const photo = data.photo;
  if (isRecord(photo) && data.consent === 'granted') {
    return compact({
      status: 'cleared',
      src: photo.src,
      alt: photo.alt,
      credit: photo.credit,
      referenceUrl,
    });
  }
  return compact({ status: 'pending', referenceUrl });
}

export function personFromMd(relPath: string, text: string): Json {
  const { file, data, sections } = load(relPath, text, PERSON_FRONT, PERSON_SECTIONS);
  const section = (key: string): string | undefined => sections[key];

  const quote = section('quote');
  const altQuote = section('altQuote');
  const guideLevels = section('guideLevels');
  const sources = section('sources');

  return compact({
    id: data.id,
    order: data.order,
    sourceFile: file,
    name: data.name,
    honorific: data.honorific,
    pronoun: data.pronoun,
    subtitle: data.subtitle,
    stationIds: data.stationIds,
    opening: section('opening'),
    gentleOpening: section('gentleOpening'),
    oct7: section('oct7'),
    oct7Sensitivity: data.oct7Sensitivity,
    personality: section('personality'),
    past: section('past'),
    after: section('after'),
    quote: quote === undefined ? undefined : parseQuote(quote, file),
    altQuote: altQuote === undefined ? undefined : parseQuote(altQuote, file),
    guideLevels: guideLevels === undefined ? undefined : parseGuideLevels(guideLevels, file),
    guideNote: section('guideNote'),
    photo: buildPhoto(data),
    consent: { family: data.consent ?? 'not_contacted' },
    sources: sources === undefined ? undefined : parseSources(sources, file),
  });
}

function buildLocation(value: unknown): unknown {
  if (!isRecord(value)) return value; // null (or an invalid value zod will reject)
  return compact({
    lat: value.lat,
    lng: value.lng,
    verified: value.verified,
    verifiedBy: value.verifiedBy,
    verifiedAt: isoDate(value.verifiedAt),
    note: value.note,
  });
}

function buildSilenceMoment(value: unknown): unknown {
  if (!isRecord(value)) return value;
  return compact({ seconds: value.seconds, prompt: value.prompt });
}

export function stationFromMd(relPath: string, text: string): Json {
  const { file, data, sections } = load(relPath, text, STATION_FRONT, STATION_SECTIONS);
  const talkingPoints = sections.talkingPoints;
  const sources = sections.sources;

  return compact({
    id: data.id,
    order: data.order,
    sourceFile: file,
    slug: data.slug,
    title: data.title,
    subtitle: data.subtitle,
    kind: data.kind,
    durationMin: data.durationMin,
    location: buildLocation(data.location),
    radiusM: data.radiusM,
    background: sections.background,
    talkingPoints: talkingPoints === undefined ? undefined : parseBullets(talkingPoints, file),
    personIds: data.personIds,
    companionPersonIds: data.companionPersonIds,
    sensitivity: data.sensitivity,
    silenceMoment: buildSilenceMoment(data.silenceMoment),
    accessNotes: sections.accessNotes,
    driverWarning: data.driverWarning,
    lastVerified: isoDate(data.lastVerified),
    sources: sources === undefined ? [] : parseSources(sources, file),
  });
}

export function tourFromMd(relPath: string, text: string): Json {
  const { file, data, sections } = load(relPath, text, TOUR_FRONT, TOUR_SECTIONS);
  const safety = sections.safety;
  const howTo = sections.howTo;

  return compact({
    id: data.id,
    sourceFile: file,
    title: data.title,
    subtitle: data.subtitle,
    totalDurationMin: data.totalDurationMin,
    intro: sections.intro,
    message: sections.message,
    safety: safety === undefined ? undefined : parseBullets(safety, file),
    howTo: howTo === undefined ? undefined : parseBullets(howTo, file),
    closing: sections.closing,
    about: sections.about,
    rights: sections.rights,
    stationIds: data.stationIds,
    lastContentReview: isoDate(data.lastContentReview),
    contactEmail: data.contactEmail,
  });
}
