# 04 — Testing Strategy

## 1. Layers

| Layer | Tool | Location | IDs | Runs on |
|---|---|---|---|---|
| Unit (pure functions) | Vitest | `tests/unit/` | `UT-*` | every PR |
| Component | Vitest + Testing Library + jsdom | `tests/component/` | `CT-*` | every PR |
| Content integrity | Vitest (Node) | `tests/integrity/` | `CI-*` | every PR |
| End-to-end | Playwright + axe | `tests/e2e/` | `E2E-*` | every PR |
| Performance / PWA | Lighthouse CI | CI job | `LH-*` | every PR to main |
| Post-deploy smoke | Playwright against live URL | `tests/e2e/smoke.spec.ts` | `E2E-SMOKE-*` | after each deploy |

Coverage thresholds (Vitest, enforced): `src/lib/**` 100% lines & branches; `src/components/**` ≥ 80% lines.

## 2. Playwright projects

Two web servers are started by `playwright.config.ts`:
- **real** build on `http://localhost:4173` (`npm run build && npm run preview`)
- **fixture** build on `http://localhost:4174` (`npm run build:e2e && npm run preview:e2e`) — fictional content with verified test coordinates

| Project | Device preset | Engine | Server | Runs tests |
|---|---|---|---|---|
| `mobile-chrome` | Pixel 7 | Chromium | real | all except `@fixture` |
| `mobile-safari` | iPhone 13 | WebKit | real | all except `@fixture`, `@sw` |
| `tablet` | iPad Mini | WebKit | real | all except `@fixture`, `@sw` |
| `desktop` | Desktop Chrome 1440×900 | Chromium | real | all except `@fixture` |
| `fixture-chrome` | Pixel 7 | Chromium | fixture | only `@fixture` |
| `smoke` | Pixel 7 | Chromium | `process.env.LIVE_URL` | only `@smoke` |

Tags go in the test title: `test('E2E-GEO-01 … @fixture', …)`. `@sw` = needs a service worker (Chromium only in Playwright).

CI settings: `retries: 2`, `workers: 2`, `trace: 'on-first-retry'`, HTML report uploaded as artifact.

## 3. Test helpers (built in task P0-03, used by everyone)

| File | Exports |
|---|---|
| `tests/e2e/helpers/geo.ts` | `FIXTURE_POINTS` (constants below), `grantGeo(context, point)`, `denyGeo(context)`, `spyGeolocation(page)` → count of `getCurrentPosition` calls |
| `tests/e2e/helpers/offline.ts` | `waitForServiceWorker(page)`, `goOffline(context)`, `goOnline(context)` |
| `tests/e2e/helpers/layout.ts` | `expectNoHorizontalOverflow(page)`, `expectTapTargets(page, min = 44)` (ignores links inside `[data-inline-text]`) |
| `tests/e2e/helpers/a11y.ts` | `expectNoSeriousA11yViolations(page)` (axe; fails on `serious`/`critical`) |
| `tests/e2e/helpers/routes.ts` | `allRoutes()` → every route path built from the real content JSON |
| `tests/e2e/helpers/banned.ts` | `BANNED_UI_WORDS` (gamification list) and `expectNoBannedWords(page)` |

### Fixture content (fictional — Conventions §1.11)
| ID | Kind | Location | Radius | Notes |
|---|---|---|---|---|
| station `test-a` (order 1) | stop | 31.400000, 34.500000, verified | 300 m | primary: `test-person-1` |
| station `test-b` (order 2) | stop | 31.450000, 34.550000, verified | 300 m | primary: `test-person-2`, companion: `test-person-3`, silenceMoment 5 s |
| station `test-c` (order 3) | drive | `null` | 300 m | no people, driverWarning true |
| person `test-person-1` | — | — | — | pronoun he, `oct7Sensitivity: standard`, has `after` |
| person `test-person-2` | — | — | — | pronoun she, `oct7Sensitivity: graphic`, no `after` |
| person `test-person-3` | — | — | — | companion at `test-b`, has `guideNote` |

Fixture JSON is written by hand (it is fictional, so no converter is needed) and lives in `src/content/fixtures/`. Fixture `sourceFile` values use the pattern `content-source/people/00_test-person-N.md` (the files don't exist; integrity tests run on real content only).

`FIXTURE_POINTS`: `atA` = 31.400500, 34.500300 (≈60 m from A) · `nearB` = 31.460000, 34.550000 (≈1.1 km from B) · `far` = 31.600000, 34.700000 (> 5 km from all).

## 4. Test catalog

### Unit — `src/lib`
| ID | Asserts |
|---|---|
| UT-GEO-01 | `haversineMeters` of identical points = 0 |
| UT-GEO-02 | symmetric: d(a,b) = d(b,a) |
| UT-GEO-03 | (31.5, 34.5)→(31.6, 34.5) = 11 119.5 m ± 1 m |
| UT-GEO-04 | `findNearbyStation` ignores `location: null` and `verified: false` |
| UT-GEO-05 | inside radius → `kind: 'at'` |
| UT-GEO-06 | outside radius, within max → `kind: 'near'` with distance |
| UT-GEO-07 | beyond max → `kind: 'none'`; custom `maxDistanceM` respected |
| UT-GEO-08 | equal distance → lower `order` wins |
| UT-GEO-09 | inside two radii → closest wins |
| UT-LINK-01 | `wazeUrl` exact string, 6 decimals (e.g. 31.5 → `31.500000`) |
| UT-LINK-02 | `googleMapsUrl` exact string |
| UT-LINK-03 | `stationPath`, `personPath` |
| UT-FMT-01 | every row of the `formatMinutes` table in Architecture §6 |
| UT-FMT-02 | `formatMinutes` throws `RangeError` for 0, -1, 1.5, NaN |
| UT-FMT-03 | `formatDistance`: 0→"10 מטר", 4→"10 מטר", 345→"350 מטר", 994→"990 מטר", 995→"1 ק״מ", 1000→"1 ק״מ", 1234→"1.2 ק״מ", 1250→"1.3 ק״מ", 2950→"3 ק״מ" (rule: m < 995 → `max(10, round to 10)` + " מטר"; else `Math.round(m/100)/10` + " ק״מ", no trailing ".0") |
| UT-STO-01 | visited: add, dedupe, remove, reset, persists across reads |
| UT-STO-02 | depth: default `m2`; set/get; invalid stored value → default |
| UT-STO-03 | readAloud: default false; set/get |
| UT-STO-04 | gates: sessionStorage only; per-person |
| UT-STO-05 | storage throwing (mock `getItem/setItem` to throw) → no exception, defaults returned |
| UT-STO-06 | corrupt JSON in storage → default returned and key overwritten |
| UT-I18N-01 | `t` replaces `{n}` params; unknown placeholder left intact |
| UT-PARSE-01 | `parseFrontMatter` returns data + body; missing front matter → throws with file name |
| UT-PARSE-02 | `splitSections` keys sections by the token after ` · ` in `## ` headings; text before first heading ignored; duplicate key → throws |
| UT-PARSE-03 | `parseBullets` returns bullet texts verbatim (keeps inner `**bold**`, quotes ״ ׳); strips a leading `**label:**` only when asked |
| UT-PARSE-04 | `parseQuote` extracts text between „ and ” and `by` after "— "; malformed → throws |
| UT-PARSE-05 | `parseSources` splits `- title — url` lines; URL with Hebrew chars or `%20` preserved exactly |
| UT-PARSE-06 | `personFromMd` on a small fixture Markdown produces the exact expected JSON object (snapshot written by hand in the test, not auto-generated) |
| UT-PARSE-07 | `stationFromMd` and `tourFromMd` likewise; `location: null` and `silenceMoment: null` supported |

### Component
| ID | Component | Asserts |
|---|---|---|
| CT-MD-01 | `Markdown` | renders bold/lists; raw `<script>`/HTML not rendered as elements; external links get `target="_blank" rel="noopener noreferrer"` |
| CT-QUOTE-01 | `QuoteBlock` | `<figure>` + `<blockquote>` + `<figcaption>` with `by` |
| CT-PHOTO-01 | `PhotoFrame` | pending → placeholder text, **no `<img>`**; cleared → `<img src="/photos/…">` with alt + credit; never uses `referenceUrl` |
| CT-SRC-01 | `SourceList` | renders title + publisher, links open externally, URL text in `<bdi dir="ltr">` |
| CT-DEPTH-01 | `DepthTabs` | `role="tablist"`, 3 tabs, `aria-selected`; ArrowLeft = next / ArrowRight = previous (RTL); Home/End; selection persisted via `setDepth` |
| CT-GATE-01 | `ContentWarningGate` | `standard` → children visible; `graphic` → children absent until "show"; "skip" keeps them hidden and moves focus past; opened state remembered in session |
| CT-SILENCE-01 | `SilenceMoment` | idle → start button with seconds; running → calm static panel (title + prompt + stop button), **no changing digits in the DOM** while running (fake timers: text identical at t=1s and t=seconds-1); after `seconds` → end message; stop → end message immediately; no `<audio>`, no vibration call; reduced motion → no animation class |
| CT-NEARBY-01 | `NearbyBanner` | renders each state (idle/locating/denied/unavailable/at/near/none) with correct text, `aria-live="polite"`, link to station when at/near |
| CT-CARD-01 | `StationCard` | order badge, title, subtitle, duration text, kind label, visited mark, link to `#/station/<slug>` |
| CT-PCARD-01 | `PersonCard` | name + honorific, subtitle, opening line, link to `#/person/<id>`; "סיפור נלווה" label only when rendered with `variant="companion"` |
| CT-NAVL-01 | `NavLinks` | verified → Waze + Google links (exact hrefs, external); unverified or null → "location being verified" text, **no links** |
| CT-DRIVE-01 | `DriveBanner` | visible warning text, `role="note"` |
| CT-STEP-01 | `ProgressStepper` | one item per station, visited/current states, accessible names |
| CT-RA-01 | `ReadAloudToggle` | toggles `aria-pressed`, persists, adds `data-read-aloud="true"` on `<html>` |

### Content integrity — the anti-hallucination net
| ID | Asserts |
|---|---|
| CI-01 | every JSON file parses with its zod schema |
| CI-02 | `validateContent` passes on real content (all cross-references) |
| CI-03 | **No drift:** `npm run content:check` exits 0 (a fresh build of `content-source/` equals the committed JSON byte-for-byte) |
| CI-04 | **Independent fidelity check:** for every Markdown file in `content-source/`, the test re-extracts each `## … · key` section with its **own** simple regex code (it must NOT import `scripts/content/*`) and asserts the whitespace-normalized text appears verbatim in the matching JSON field |
| CI-05 | every URL in each Markdown `sources` section appears in the JSON `sources`, and vice versa; every JSON person/station has exactly one source file |
| CI-06 | the string `referenceUrl` does not appear in `src/components/**` or `src/pages/**`; every `cleared` photo file exists in `public/photos/` |
| CI-07 | `src/i18n/he.ts` values contain no `!`, no emoji, none of `BANNED_UI_WORDS` |
| CI-08 | non-null locations lie inside lat 31.2–31.7 / lng 34.3–34.8 |
| CI-09 | every `t('…')` key used in `src/` exists in `he.ts` (static scan) |
| CI-10 | no physical-direction Tailwind classes in `src/` (regex scan, backup to lint) |

The Markdown format is specified in `content-source/README.md`. CI-04 is deliberately implemented by a different agent and with different code than the converter, so a bug in one is caught by the other.

### End-to-end
| ID | Projects | Scenario |
|---|---|---|
| E2E-NAV-01 | real ×4 | Home → start → tour → every station in order (via "next") → each primary person page → closing station. Each page has correct `h1` and `document.title`. |
| E2E-NAV-02 | real ×4 | Deep links `#/station/<slug>` and `#/person/<id>` load directly; unknown slug/id → NotFound with link home |
| E2E-NAV-03 | real ×4 | Mark station 3 visited → reload → Home shows resume to station 4; reset clears |
| E2E-GEO-01 | fixture | grant at `atA` → click "where am I" → banner says at station A, link opens it |
| E2E-GEO-02 | fixture | `nearB` → "near" B with distance text |
| E2E-GEO-03 | fixture | `far` → "none" message |
| E2E-GEO-04 | fixture | permission denied → denied message, page still usable |
| E2E-GEO-05 | fixture | on load of every route, `getCurrentPosition` was called **0** times |
| E2E-OFF-01 | mobile-chrome, desktop (`@sw`) | after SW ready → offline → every route renders content; offline indicator visible |
| E2E-OFF-02 | mobile-chrome (`@sw`) | offline → hard reload → app shell and content load from cache |
| E2E-SAFE-01 | real ×4 | no `<audio>`/`<video>` playing on any route; none has `autoplay` |
| E2E-SAFE-02 | fixture | graphic person: oct7 hidden until "show"; "skip" keeps hidden |
| E2E-SAFE-03 | real ×4 | every `<img>` `src` is same-origin or `data:` |
| E2E-SAFE-04 | real ×4 | `expectNoBannedWords` on every route |
| E2E-SAFE-05 | real ×4 | every `drive` station shows the driver warning |
| E2E-LAYOUT-01 | real ×4 | no horizontal overflow on every route |
| E2E-LAYOUT-02 | real ×4 | tap targets ≥ 44×44 on every route |
| E2E-LAYOUT-03 | real ×4 | `html[lang=he][dir=rtl]`; bottom nav on mobile/tablet, side nav on desktop |
| E2E-LAYOUT-04 | real ×4 | screenshots of `/`, `/tour`, first station, first person (`maxDiffPixelRatio: 0.01`) |
| E2E-A11Y-01 | real ×4 | axe on every route: zero serious/critical |
| E2E-A11Y-02 | desktop | keyboard: first Tab = skip link; depth tabs operable; focus always visible |
| E2E-LINK-01 | fixture | station A shows exact Waze/Google hrefs; station C shows "being verified", no nav links |
| E2E-READ-01 | real ×4 | read-aloud on → body text ≥ 22 px; persists after reload |
| E2E-SHARE-01 | mobile-chrome | `navigator.share` stub called with current URL; without it → link copied + "copied" message |
| E2E-PWA-01 | mobile-chrome (`@sw`) | manifest has name, `lang: he`, `dir: rtl`, icons 192/512 (+ maskable), `start_url`; SW registered |
| E2E-SMOKE-01..03 | smoke | live URL: home 200 with `h1`; a station page renders; SW registers; no console errors |

### Lighthouse
| ID | Asserts (mobile preset, on `/`, first station, first person) |
|---|---|
| LH-01 | Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95 |
| LH-02 | *Retired:* Lighthouse 12 removed the PWA category. Installability and offline start are covered by E2E-PWA-01 and E2E-OFF-02 (task T-05). |

## 5. Rules for test authors
- Tests assert **behaviour described in the contracts and tasks**, not implementation details.
- Web-first assertions (`await expect(locator).toBeVisible()`), never `waitForTimeout`.
- Real-content E2E iterate over routes from `helpers/routes.ts` — never hard-code a list of people.
- Visual baselines (E2E-LAYOUT-04) are created once by task T-07 and approved by design task D-09. Updating them later requires a PR labelled `visual-change`.
- Baselines are only valid on the machine that rendered them. Always (re)generate them on GitHub's runner with the manual workflow **Visual baselines** (`.github/workflows/visual-baselines.yml`); it pushes the images to a `visual-baselines/<run id>` branch, from which the `visual-change` PR is opened. Never commit baselines rendered in the cloud container (CI-01 finding).
- Never `test.skip`/`test.fixme` without an orchestrator-approved reason in the report.

## 6. `data-testid` registry (use exactly these)
`skip-link`, `bottom-nav`, `side-nav`, `offline-indicator`, `update-prompt`, `start-tour`, `resume-tour`, `reset-progress`, `station-card-<id>`, `person-card-<id>`, `depth-tabs`, `warning-gate`, `warning-show`, `warning-skip`, `silence-start`, `silence-timer`, `where-am-i`, `nearby-banner`, `nav-waze`, `nav-google`, `location-unverified`, `mark-visited`, `next-station`, `prev-station`, `driver-warning`, `read-aloud-toggle`, `share-button`, `route-map`, `photo-placeholder`.
