/**
 * FROZEN CONTRACT — copied verbatim to `src/content/schema.ts` by task P0-02.
 * Do not edit without an orchestrator-approved task. Types are inferred from the schemas;
 * never hand-write duplicate interfaces elsewhere.
 */
import { z } from 'zod';

/** Lowercase Latin kebab-case: "aner-shapira", "nova", "route-232". */
export const IdSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id must be lowercase kebab-case');

const IsoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD');

export const SensitivitySchema = z.enum(['standard', 'graphic']);
export const DepthSchema = z.enum(['s30', 'm2', 'm5']);
/** Station reading depth: existing background (2 min), history5, historyFull. */
export const StationDepthSchema = z.enum(['m2', 'm5', 'full']);
export const PronounSchema = z.enum(['he', 'she']);

export const SourceSchema = z
  .object({
    title: z.string().min(2),
    url: z
      .string()
      .url()
      .refine((u) => u.startsWith('https://'), 'source url must be https'),
  })
  .strict();

/**
 * `referenceUrl` is where Shuki can find a photo to request permission for.
 * It is METADATA ONLY and must NEVER be used as an <img src>. (Conventions §1.3)
 */
export const PhotoSchema = z.discriminatedUnion('status', [
  z
    .object({
      status: z.literal('pending'),
      referenceUrl: z.string().url().optional(),
    })
    .strict(),
  z
    .object({
      status: z.literal('cleared'),
      src: z.string().regex(/^\/photos\/[a-z0-9-]+\.(webp|jpg|jpeg|png)$/),
      alt: z.string().min(2),
      credit: z.string().min(2),
      referenceUrl: z.string().url().optional(),
    })
    .strict(),
]);

export const ConsentSchema = z
  .object({
    family: z.enum(['not_contacted', 'requested', 'granted', 'declined']),
    note: z.string().optional(),
  })
  .strict();

export const QuoteSchema = z.object({ text: z.string().min(2), by: z.string().min(2) }).strict();

/** Guide-oriented scripts from the printed booklet. Only `s30` is rendered in MVP (ADR-007). */
export const GuideLevelsSchema = z
  .object({ s30: z.string().min(10), m2: z.string().min(10), m5: z.string().min(10) })
  .strict();

export const PersonSchema = z
  .object({
    id: IdSchema,
    order: z.number().int().positive(),
    sourceFile: z.string().regex(/^content-source\/people\/\d{2}_[a-z0-9-]+\.md$/),
    name: z.string().min(2),
    honorific: z.string().min(1).optional(),
    pronoun: PronounSchema,
    subtitle: z.string().min(2),
    stationIds: z.array(IdSchema).min(1),
    opening: z.string().min(10),
    /** Gentle opening without the hard detail (F-22). Only for `graphic` people; see refine below. */
    gentleOpening: z.string().min(10).optional(),
    oct7: z.string().min(10),
    oct7Sensitivity: SensitivitySchema,
    personality: z.string().min(10),
    past: z.string().min(10),
    after: z.string().min(10).optional(),
    quote: QuoteSchema,
    altQuote: QuoteSchema.optional(),
    guideLevels: GuideLevelsSchema,
    guideNote: z.string().min(10).optional(),
    photo: PhotoSchema,
    consent: ConsentSchema,
    sources: z.array(SourceSchema).min(1),
  })
  .strict()
  .refine((p) => p.gentleOpening === undefined || p.oct7Sensitivity === 'graphic', {
    message: "gentleOpening is allowed only when oct7Sensitivity is 'graphic'",
    path: ['gentleOpening'],
  });

/** Gaza-envelope bounding box — catches swapped lat/lng and typos. */
export const GeoPointSchema = z
  .object({
    lat: z.number().gte(31.2).lte(31.7),
    lng: z.number().gte(34.3).lte(34.8),
    verified: z.boolean(),
    verifiedBy: z.string().min(2).optional(),
    verifiedAt: IsoDateSchema.optional(),
    note: z.string().optional(),
  })
  .strict()
  .refine((p) => !p.verified || (Boolean(p.verifiedBy) && Boolean(p.verifiedAt)), {
    message: 'verified points need verifiedBy and verifiedAt',
  });

export const SilenceMomentSchema = z
  .object({ seconds: z.number().int().min(5).max(600), prompt: z.string().min(5) })
  .strict();

export const StationSchema = z
  .object({
    id: IdSchema,
    order: z.number().int().positive(),
    sourceFile: z.string().regex(/^content-source\/stations\/\d{2}_[a-z0-9-]+\.md$/),
    slug: IdSchema,
    title: z.string().min(2),
    subtitle: z.string().min(2),
    kind: z.enum(['stop', 'drive']),
    durationMin: z.number().int().positive(),
    location: GeoPointSchema.nullable(),
    radiusM: z.number().int().min(100).max(2000),
    background: z.string().min(10),
    /** 5-minute read-aloud history of the place (Shuki, 2026-10-16). */
    history5: z.string().min(10).optional(),
    /** Full, unlimited reading about what happened at the place. */
    historyFull: z.string().min(10).optional(),
    talkingPoints: z.array(z.string().min(5)).min(1),
    personIds: z.array(IdSchema),
    companionPersonIds: z.array(IdSchema),
    sensitivity: SensitivitySchema,
    silenceMoment: SilenceMomentSchema.nullable(),
    accessNotes: z.string().min(5).optional(),
    driverWarning: z.boolean(),
    lastVerified: IsoDateSchema.optional(),
    sources: z.array(SourceSchema),
  })
  .strict()
  .refine((s) => s.kind !== 'drive' || s.driverWarning, {
    message: 'drive stations must have driverWarning: true',
  });

export const TourSchema = z
  .object({
    id: IdSchema,
    sourceFile: z.literal('content-source/tour.md'),
    title: z.string().min(2),
    subtitle: z.string().min(2),
    totalDurationMin: z.number().int().positive(),
    intro: z.string().min(10),
    message: z.string().min(10),
    safety: z.array(z.string().min(5)).min(1),
    howTo: z.array(z.string().min(5)).min(1),
    closing: z.string().min(10),
    about: z.string().min(10),
    rights: z.string().min(10),
    stationIds: z.array(IdSchema).min(1),
    lastContentReview: IsoDateSchema,
    contactEmail: z.string().email().optional(),
  })
  .strict();

export type Sensitivity = z.infer<typeof SensitivitySchema>;
export type Depth = z.infer<typeof DepthSchema>;
export type StationDepth = z.infer<typeof StationDepthSchema>;
export type Pronoun = z.infer<typeof PronounSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Photo = z.infer<typeof PhotoSchema>;
export type Consent = z.infer<typeof ConsentSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type GeoPoint = z.infer<typeof GeoPointSchema>;
export type SilenceMoment = z.infer<typeof SilenceMomentSchema>;
export type Station = z.infer<typeof StationSchema>;
export type Tour = z.infer<typeof TourSchema>;

export type ContentSet = { tour: Tour; stations: Station[]; people: Person[] };
export type RawContentSet = { tour: unknown; stations: unknown[]; people: unknown[] };
