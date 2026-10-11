# 02 — Architecture

This document is the technical source of truth. If a task file and this document disagree, **stop and report** — do not choose silently.

---

## 1. Architecture decisions (ADRs)

### ADR-001 — Build as a static PWA in git; host on Base44 via `deploy-dist`
**Decision.** The app is a static Vite + React + TypeScript site in a normal git repository. CI builds it, runs all tests, packs `dist/` as a `.tar.gz`, and publishes it with Base44's `POST /api/apps/{app_id}/deploy-dist` ("Deploy a prebuilt site"). Base44 is the host (published URL, custom domain); it is **not** the code editor.

**Why not build inside the Base44 builder?**
1. *Parallel agents.* Base44's builder edits one shared file tree and allows **one turn at a time**; direct edits are forbidden while a turn is processing. A dozen agents in parallel would overwrite each other. Git branches + file ownership solve this.
2. *Offline.* The app must work with no signal. That needs full control of the service worker and of precaching. A Base44 builder app loads its data from the Base44 API at runtime, which breaks offline.
3. *Testing.* We need deterministic unit tests (Vitest) and E2E tests (Playwright) that mock geolocation and go offline. Those run in CI against our own build.
4. *Content integrity.* Facts about real people live as versioned files, reviewed in diffs, guarded by tests.
5. *Portability.* `deploy-dist` is a **beta** API. Because the build is a plain static folder, it can be moved to any static host in minutes if needed (see Risks R-01).

**Known `deploy-dist` limits:** archive ≤ 50 MB (packed and unpacked), ≤ 1,000 files, `index.html` at archive root, 5 requests/minute per workspace, beta. Each upload replaces the whole published site.

### ADR-002 — Hash routing
Use React Router's `createHashRouter`. URLs look like `https://<app>.base44.app/#/station/nova`. Reason: works on any static host with no server rewrite rules, and offline navigation never hits the network. Deep links still work and are shareable.

### ADR-003 — Content is GENERATED from Markdown by a script, never hand-copied
Canonical facts live in `content-source/` as strictly formatted Markdown (YAML front matter + sections whose headings end with ` · <fieldKey>`; format in `content-source/README.md`). A deterministic converter (`npm run content:build` → `scripts/content/build-content.ts`) turns them into `src/content/data/**/*.json`, which are committed and imported at build time (so they are precached automatically).

**Why:** language models — especially weaker ones — subtly alter long Hebrew text when they copy it. No agent ever types content into JSON. Agents write and test the *converter*; the converter copies the text. CI re-runs the converter and fails on any drift, and an independent test re-extracts every section with different code and compares (CI-03…CI-05).

Shapes are defined once in `src/content/schema.ts` (copied verbatim from `contracts/content.schema.ts`). The converter validates its output with zod and exits non-zero on any error; the app loader validates again in dev/test.

### ADR-004 — No backend, no analytics, no cookies in MVP
The site is read-only. Location is processed only on the device. Nothing is sent anywhere.

### ADR-005 — Offline with `vite-plugin-pwa` (Workbox), precache everything
`registerType: 'prompt'` (never reload under the user's feet). Precache all JS, CSS, HTML, fonts, icons, SVG and JSON. A small banner offers to refresh when a new version is ready.

### ADR-006 — Schematic SVG route map, not map tiles
Map tiles can't be legally/practically precached and need signal. MVP uses a designed, inline SVG schematic of the route (stations as numbered markers, linked). Real navigation is delegated to Waze / Google Maps deep links.

### ADR-007 — "Reading depth" instead of rendering guide scripts
The source pages contain guide-oriented scripts ("30 sec / 2 min / 5 min"). The self-guided UI uses a **depth selector** that controls how much of the person page is shown:

| Depth key | Label (he) | Renders |
|---|---|---|
| `s30` | 30 שניות | `guideLevels.s30` only, as a read-aloud block |
| `m2` *(default)* | 2 דקות | `opening` + `oct7` + `quote` |
| `m5` | 5 דקות | `opening` + `oct7` + `personality` + `past` + `after` + `quote` + `sources` |

`guideLevels.m2` / `guideLevels.m5` are stored in content but **not rendered** in MVP (reserved for a future "guide mode").

### ADR-008 — Tailwind CSS v3 with logical properties for RTL
Use Tailwind's logical utilities (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`). Never `ml-*`, `mr-*`, `pl-*`, `pr-*`, `left-*`, `right-*`, `text-left`, `text-right` (lint rule enforces this). Design tokens are CSS custom properties in `src/styles/tokens.css`, mapped into the Tailwind theme.

### ADR-009 — Self-hosted fonts via @fontsource
Hebrew fonts are bundled (not Google Fonts CDN) so they work offline. Max 2 families, max 4 weights in total, `woff2` Hebrew + Latin subsets only.

---

## 2. Stack (pin these major versions)

| Area | Package | Major |
|---|---|---|
| Runtime | Node.js | 20 LTS |
| Build | `vite` | 5 |
| UI | `react`, `react-dom` | 18 |
| Language | `typescript` (strict) | 5 |
| Routing | `react-router-dom` | 6 |
| Styling | `tailwindcss`, `postcss`, `autoprefixer` | 3 / 8 / 10 |
| Validation | `zod` | 3 |
| Markdown | `react-markdown` (no raw HTML) | 9 |
| Icons | `lucide-react` | 0 (latest) |
| Fonts | `@fontsource/<family>` | 5 |
| PWA | `vite-plugin-pwa` | 0 (latest) |
| Unit/Component tests | `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom` | 2 / 16 / 14 / 6 / 25 |
| E2E | `@playwright/test`, `@axe-core/playwright` | 1 / 4 |
| Lint/format | `eslint` (flat config), `typescript-eslint`, `eslint-plugin-react-hooks`, `prettier` | 9 / 8 / 5 / 3 |
| Content build (dev only) | `gray-matter` (front matter), `tsx` (run TS scripts) | 4 / 4 |

Do not add other runtime dependencies without an orchestrator-approved task. Every added dependency must be MIT/Apache/BSD/OFL licensed.

---

## 3. Repository layout (exact)

```
repo/
├── index.html                      # <html lang="he" dir="rtl">
├── package.json
├── vite.config.ts                  # PWA plugin, alias @content-data, test config
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json                   # strict: true, noUncheckedIndexedAccess: true
├── eslint.config.js
├── playwright.config.ts
├── public/
│   ├── icons/                      # app icons (design task D-08)
│   ├── photos/.gitkeep             # ONLY cleared photos ever go here
│   └── og-image.png
├── src/
│   ├── main.tsx
│   ├── app/
│   │   ├── router.tsx              # createHashRouter + route table
│   │   ├── AppLayout.tsx           # header, nav, <Outlet/>, footer, banners
│   │   ├── ErrorBoundary.tsx
│   │   └── PrefsProvider.tsx       # depth + readAloud context
│   ├── pages/                      # one file per route (see §4)
│   ├── components/
│   │   ├── layout/                 # Header, BottomNav, SideNav, Footer, OfflineIndicator, UpdatePrompt
│   │   ├── primitives/             # Markdown, QuoteBlock, PhotoFrame, SourceList, DurationBadge, SectionHeading, Button
│   │   ├── tour/                   # StationCard, PersonCard, ProgressStepper, RouteMap, NearbyBanner, NavLinks, DriveBanner
│   │   └── reading/                # DepthTabs, ContentWarningGate, SilenceMoment, ReadAloudToggle
│   ├── content/
│   │   ├── schema.ts               # = contracts/content.schema.ts (frozen)
│   │   ├── index.ts                # loader + typed getters (see §6)
│   │   ├── data.real.ts            # imports data/** (prod)
│   │   ├── data.fixture.ts         # imports fixtures/** (e2e mode only)
│   │   ├── data/
│   │   │   ├── tour.json
│   │   │   ├── stations.json
│   │   │   └── people/<person-id>.json
│   │   └── fixtures/               # FICTIONAL test content (never real names)
│   ├── lib/                        # pure functions only: geo, links, format, storage, i18n
│   ├── hooks/                      # useNearbyStation, useOnlineStatus
│   ├── i18n/he.ts                  # all UI strings (= contracts/strings.he.ts)
│   └── styles/
│       ├── tokens.css              # design tokens (D-02 → F-04)
│       └── index.css               # tailwind layers, font imports, print basics
├── tests/
│   ├── unit/                       # UT-*  (lib/*)
│   ├── component/                  # CT-*  (components)
│   ├── integrity/                  # CI-*  (content vs schema vs content-source)
│   ├── e2e/                        # E2E-* (Playwright)
│   │   └── helpers/                # geo.ts, offline.ts, layout.ts, a11y.ts
│   └── setup.ts
├── scripts/
│   ├── content/
│   │   ├── parse.ts                # parseFrontMatter, splitSections, parseBullets, parseQuote, parseSources
│   │   ├── to-json.ts              # personFromMd, stationFromMd, tourFromMd
│   │   └── build-content.ts        # CLI: content-source/** → src/content/data/**  (validates with zod)
│   ├── deploy-base44.sh
│   └── check-bundle-size.mjs
├── content-source/                 # canonical Markdown (read-only for agents)
│   ├── README.md                   # the exact file format
│   ├── tour.md
│   ├── stations/NN_<station-id>.md
│   └── people/NN_<person-id>.md
├── design/                         # design-agent deliverables
└── reports/                        # one report per completed task
```

`vite.config.ts` resolves the alias **`@content-data`** to `src/content/data.fixture.ts` when `mode === 'e2e'`, otherwise to `src/content/data.real.ts`. This keeps fictional fixtures out of the production bundle.

---

## 4. Routes

| Path (after `#`) | Page component | Notes |
|---|---|---|
| `/` | `HomePage` | intro, message, safety, start/resume |
| `/tour` | `TourPage` | stepper list + RouteMap + "Where am I?" |
| `/station/:slug` | `StationPage` | 404 page if slug unknown |
| `/person/:id` | `PersonPage` | 404 page if id unknown |
| `/about` | `AboutPage` | who made it, rights statement, corrections |
| `/sources` | `SourcesPage` | all sources grouped by person and station |
| `*` | `NotFoundPage` | |

Every page sets `document.title` to `"<page title> · פנים למספרים"`. Scroll to top on route change.

---

## 5. Data contracts
Defined in `contracts/content.schema.ts` (zod). Types are inferred from the schemas — never hand-write duplicate interfaces. Example files: `contracts/example-person.json`, `contracts/example-station.json`.

Key rules encoded in the schema:
- IDs and slugs: lowercase Latin kebab-case (`aner-shapira`, `nova`).
- `location` is `null` until Shuki verifies it; coordinates must fall inside the Gaza-envelope bounding box (lat 31.2–31.7, lng 34.3–34.8) — this catches swapped lat/lng.
- `photo.status` is `pending` or `cleared`; only `cleared` has `src` (local `/photos/...`), `credit` and `alt`. `referenceUrl` is metadata for Shuki and **must never be used as an image source**.
- `oct7Sensitivity: 'graphic'` → the `oct7` section is wrapped in `ContentWarningGate`.
- `pronoun: 'he' | 'she'` drives gendered headings ("מי הוא היה" / "מי היא הייתה").
- Whether a person is "primary" or a "companion" story is decided **by the station** (`personIds` vs `companionPersonIds`), not by the person. A person can be primary at one station and companion at another (Aviel Rahamim: primary at `tkuma`, companion at `reim-shelter`). `person.stationIds` must list every station that references the person, and vice versa.
- `guideNote` is a short visitor-facing note shown on the person page (e.g. Raz Peretz: "fell at Kissufim, not here").

---

## 6. Module contracts (implement exactly these signatures)

### `src/lib/geo.ts`
```ts
export type LatLng = { lat: number; lng: number };

/** Great-circle distance in metres. Earth radius = 6_371_008.8 m. Symmetric; 0 for identical points. */
export function haversineMeters(a: LatLng, b: LatLng): number;

export type NearbyResult =
  | { kind: 'at'; station: Station; distanceM: number }    // inside station.radiusM
  | { kind: 'near'; station: Station; distanceM: number }  // nearest, within maxDistanceM
  | { kind: 'none' };

/**
 * Considers ONLY stations whose location is non-null AND verified === true.
 * If the position is inside the radius of one or more stations → 'at' the closest of them.
 * Else the closest station within maxDistanceM → 'near'. Else 'none'.
 * Ties (equal distance) → lower `order` wins.
 */
export function findNearbyStation(pos: LatLng, stations: Station[], maxDistanceM?: number /* default 5000 */): NearbyResult;
```

### `src/lib/links.ts`
```ts
export function wazeUrl(p: LatLng): string;       // https://waze.com/ul?ll=31.123456,34.123456&navigate=yes
export function googleMapsUrl(p: LatLng): string; // https://www.google.com/maps/dir/?api=1&destination=31.123456,34.123456
export function stationPath(slug: string): string; // "/station/<slug>"
export function personPath(id: string): string;    // "/person/<id>"
// Coordinates are always formatted with toFixed(6).
```

### `src/lib/format.ts`
```ts
/** Hebrew duration. Throws RangeError for non-integers or values < 1. */
export function formatMinutes(min: number): string;
/**
 * Hebrew distance.
 * m < 995  → `${Math.max(10, Math.round(m / 10) * 10)} מטר`           e.g. 345 → "350 מטר", 4 → "10 מטר"
 * m >= 995 → `${Math.round(m / 100) / 10} ק״מ` (no trailing ".0")     e.g. 1234 → "1.2 ק״מ", 2950 → "3 ק״מ"
 * Full case table: docs/04_TESTING_STRATEGY.md UT-FMT-03.
 */
export function formatDistance(meters: number): string;
```
`formatMinutes` reference table (tests assert every row):

| in | out | in | out |
|---|---|---|---|
| 1 | דקה | 90 | שעה וחצי |
| 2 | 2 דקות | 120 | שעתיים |
| 15 | 15 דקות | 121 | שעתיים ודקה |
| 59 | 59 דקות | 150 | שעתיים וחצי |
| 60 | שעה | 180 | 3 שעות |
| 61 | שעה ודקה | 195 | 3 שעות ו-15 דקות |
| 75 | שעה ו-15 דקות | 210 | 3 שעות וחצי |

### `src/lib/storage.ts`
All functions **never throw** (storage may be unavailable: private mode, quota, disabled). Keys are namespaced and versioned.

| Function | Storage | Key | Default |
|---|---|---|---|
| `getVisited(): string[]` / `markVisited(id)` / `unmarkVisited(id)` / `resetProgress()` | localStorage | `ftn:v1:visited` | `[]` |
| `getDepth(): Depth` / `setDepth(d)` | localStorage | `ftn:v1:depth` | `'m2'` |
| `getReadAloud(): boolean` / `setReadAloud(b)` | localStorage | `ftn:v1:readAloud` | `false` |
| `isGateOpened(personId): boolean` / `openGate(personId)` | sessionStorage | `ftn:v1:gates` | `false` |

`type Depth = 's30' | 'm2' | 'm5'`. Corrupt JSON in storage → return the default and overwrite.

### `src/lib/i18n.ts`
```ts
import { he } from '../i18n/he';
export type StringKey = keyof typeof he;
/** Replaces {name} placeholders. Unknown placeholder → left as-is (+ console.warn in dev). */
export function t(key: StringKey, params?: Record<string, string | number>): string;
```
Components **never** hard-code Hebrew UI strings; they call `t()`. Content text comes from content JSON, not from `he.ts`.

### `src/content/index.ts`
```ts
export function getTour(): Tour;
export function getStations(): Station[];               // sorted by order
export function getStationBySlug(slug: string): Station | undefined;
export function getPeople(): Person[];                  // sorted by order
export function getPersonById(id: string): Person | undefined;
export function getPeopleForStation(stationId: string): { primary: Person[]; companions: Person[] };
export function getNextStation(stationId: string): Station | undefined;
export function getPrevStation(stationId: string): Station | undefined;
export function validateContent(raw: RawContentSet): ContentSet; // throws ContentError with all problems listed
```
`validateContent` runs zod parsing **and** cross-reference checks: unique ids/slugs/orders; orders contiguous from 1 (stations and people separately); every `personIds`/`companionPersonIds`/`stationIds` reference exists; **bidirectional**: station S lists person P (primary or companion) ⇔ P.stationIds contains S; no person is both primary and companion at the same station; `tour.stationIds` equals station ids sorted by order; every person appears in at least one station; every `cleared` photo `src` starts with `/photos/`. It throws one `ContentError` listing **all** problems found (not just the first).

### `src/hooks/useNearbyStation.ts`
```ts
type NearbyState =
  | { status: 'idle' }
  | { status: 'locating' }
  | { status: 'denied' }
  | { status: 'unavailable' }      // no API, timeout, or position error
  | { status: 'done'; result: NearbyResult };
export function useNearbyStation(): { state: NearbyState; locate: () => void; reset: () => void };
```
Uses `navigator.geolocation.getCurrentPosition` with `{ enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }`. Called **only** from a user click. No `watchPosition` in MVP. Position is never stored or sent.

---

## 7. Build modes and scripts (`package.json`)

| Script | Does |
|---|---|
| `dev` | `vite` |
| `build` | `tsc -b && vite build` → `dist/` (real content) |
| `build:e2e` | `vite build --mode e2e --outDir dist-e2e` (fixture content) |
| `preview` | `vite preview --port 4173 --strictPort` |
| `preview:e2e` | `vite preview --outDir dist-e2e --port 4174 --strictPort` |
| `test` | `vitest run` (unit + component + integrity) |
| `test:watch` | `vitest` |
| `test:e2e` | `playwright test` |
| `lint` | `eslint .` |
| `typecheck` | `tsc -b --noEmit` |
| `size` | `node scripts/check-bundle-size.mjs` |
| `content:build` | `tsx scripts/content/build-content.ts` → writes `src/content/data/**` |
| `content:check` | `tsx scripts/content/build-content.ts --check` → exits 1 if committed JSON differs from a fresh build |
| `check` | `npm run lint && npm run typecheck && npm run content:check && npm test && npm run build && npm run size` |

---

## 8. Deploy flow
```
push to main → CI: check + e2e → build → tar -czf site.tar.gz -C dist .
  → POST {BASE44_API_BASE}/api/apps/{BASE44_APP_ID}/deploy-dist  (secret API key)
  → response { deployed_at, app_url } → post-deploy smoke tests (E2E-SMOKE) against app_url
```
Exact host, auth header name and upload encoding are **unknown until task O-01** documents them in `docs/DEPLOY_BASE44.md`. Do not guess them.

---

## 9. Budgets (enforced by `npm run size` and Lighthouse CI)

| Budget | Limit |
|---|---|
| JS (all chunks, gzip) | ≤ 200 KB |
| CSS (gzip) | ≤ 30 KB |
| Fonts (all woff2) | ≤ 220 KB |
| Total precache | ≤ 2 MB |
| Files in `dist/` | ≤ 300 |
| Lighthouse mobile | Perf ≥ 90, A11y ≥ 95, Best Practices ≥ 95 (installability and offline are tested by E2E-PWA-01 / E2E-OFF-02 — Lighthouse 12 has no PWA category) |

---

## 10. Breakpoints (mobile-first)

| Name | Min width | Typical device | Layout |
|---|---|---|---|
| base | 0 | phone 360–430 px | single column, bottom navigation bar |
| `md` | 768 px | tablet portrait | single column, wider reading measure, bottom nav |
| `lg` | 1024 px | tablet landscape / desktop | two columns: side navigation (route) + content |
| `xl` | 1280 px | desktop | same as `lg`, content max-width 720 px, centered |

Reading measure: max 68 characters per line (`max-w-prose`-like, set via token).
