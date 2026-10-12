# T-11 — Test audit: coverage, gaps, flakiness (2026-10-12)

**Verdict: NOT READY.** 3 HIGH, 3 MEDIUM, 7 LOW findings.

The suite is stable and almost every catalog test exists. Nothing failed in 3 full Chromium runs (0 flaky), and
the core memorial rules (gate, verbatim content, hash links, location on press) are each protected by at least
one test. But three mutations that touch the brief's non-negotiables **were not caught by any test**:

- The driver-safety sentence can be changed to its opposite and everything stays green (§1.9).
- The site can read the location on load through `watchPosition` and E2E-GEO-05 stays green (§1.10).
- The offline message can go back into the page flow (an 88 px layout shift on every first visit) and nothing fails.

By the task rule, each of these is a HIGH finding. On top of that, the WebKit projects (iPhone/iPad) have **never run**.

Environment: Chromium 1194 only (`/opt/pw-browsers`), worktree `task/T-11` at `df6549a`. WebKit is not installed,
so `mobile-safari` and `tablet` were not run. Smoke tests skip without `LIVE_URL`. I did not re-run Lighthouse
(T-09 ran it twice; see LH-01).

---

## 1. Catalog → implementation

Method: `grep -rlE "\b<ID>\b" tests lighthouserc.json .github` for every ID in `docs/04_TESTING_STRATEGY.md` §4,
then I read the test to check it asserts what the catalog says.

**Totals: 79 catalog IDs (LH-02 is retired and not counted). 79 implemented, 0 missing.** LH-01 lives in
`lighthouserc.json` and `.github/workflows/lighthouse.yml`, which carry no ID string (LOW-5). 3 IDs are
implemented only partly or with a weak oracle: CT-NAVL-01, E2E-SAFE-02 and E2E-SAFE-05 (see findings).

### Unit (`tests/unit/`)
| ID | File › test | Status |
|---|---|---|
| UT-GEO-01..09 | `geo.test.ts` (one `it` per ID) | implemented |
| UT-LINK-01 | `links.test.ts` › "UT-LINK-01 wazeUrl exact string with 6 decimals" | implemented, hand-written expected strings |
| UT-LINK-02 | `links.test.ts` › "UT-LINK-02 googleMapsUrl exact string" | implemented |
| UT-LINK-03 | `links.test.ts` › "UT-LINK-03 stationPath and personPath" | implemented |
| UT-FMT-01..03 | `format.test.ts` | implemented |
| UT-STO-01..06 | `storage.test.ts` | implemented |
| UT-I18N-01 | `i18n.test.ts` | implemented |
| UT-PARSE-01..05 | `parse.test.ts` | implemented |
| UT-PARSE-06, 07 | `to-json.test.ts` | implemented |

### Component (`tests/component/`)
| ID | File | Status |
|---|---|---|
| CT-MD-01, CT-QUOTE-01, CT-PHOTO-01, CT-SRC-01 | `primitives.test.tsx` | implemented |
| CT-DEPTH-01 | `DepthTabs.test.tsx` | implemented |
| CT-GATE-01 | `ContentWarningGate.test.tsx` | implemented |
| CT-SILENCE-01 | `SilenceMoment.test.tsx` | implemented |
| CT-NEARBY-01 | `NearbyBanner.test.tsx` | implemented |
| CT-CARD-01, CT-PCARD-01, CT-DRIVE-01, CT-STEP-01 | `tour-cards.test.tsx` | implemented (CT-DRIVE-01 compares with `t()`, see HIGH-1) |
| CT-NAVL-01 | `tour-cards.test.tsx` | **weak oracle**: expected hrefs come from `wazeUrl()`/`googleMapsUrl()` themselves (LOW-1) |
| CT-RA-01 | `ReadAloudToggle.test.tsx` | implemented |
| (extra) CT-PCARD-02 | `PersonCard-gentle.test.tsx` | gentleOpening on cards, including a real-content sweep |
| (extra) PersonPage gate / F-22 | `PersonPage.test.tsx` | every graphic person × m2/m5/s30, real content |

### Content integrity (`tests/integrity/`)
| ID | File | Status |
|---|---|---|
| CI-01, CI-02 | `schema.test.ts` | implemented |
| CI-03 | `drift.test.ts` | implemented (runs `npm run content:check`) |
| CI-04 | `source-fidelity.test.ts` | implemented, independent reader, includes `gentleOpening` |
| CI-05 | `sources.test.ts` (+ inventory in `source-fidelity.test.ts`) | implemented |
| CI-06..CI-10 | `repo-scans.test.ts` | implemented, each with a negative self-check |

### End-to-end (`tests/e2e/`)
| ID | File | Projects that actually run it here | Status |
|---|---|---|---|
| E2E-NAV-01..03 | `navigation.spec.ts` | mobile-chrome, desktop | implemented |
| E2E-GEO-01..05, E2E-LINK-01 | `geolocation.spec.ts` | fixture-chrome | implemented (GEO-05 is blind to `watchPosition`, HIGH-2) |
| E2E-OFF-01 | `offline.spec.ts` | mobile-chrome, desktop | implemented |
| E2E-OFF-02 | `offline.spec.ts` | mobile-chrome (approved `test.skip` elsewhere) | implemented |
| E2E-PWA-01 | `pwa.spec.ts` | mobile-chrome (approved `test.skip`) | implemented |
| E2E-SAFE-01, 03, 04 | `safety.spec.ts` | mobile-chrome, desktop | implemented |
| E2E-SAFE-02 | `safety.spec.ts` | fixture-chrome | **partial**: checks oct7 and quote only (MEDIUM-1) |
| E2E-SAFE-05 | `safety.spec.ts` | mobile-chrome, desktop | **partial**: checks visibility only, not the text (HIGH-1) |
| E2E-LAYOUT-01..03 | `layout.spec.ts` | mobile-chrome, desktop | implemented (20 routes each) |
| E2E-LAYOUT-04 | `layout.spec.ts` | mobile-chrome, desktop (approved, T-07); 4 pages + header | implemented |
| E2E-A11Y-01 | `a11y.spec.ts` | mobile-chrome, desktop | implemented; the `/tour` nested-interactive failure from T-08 is now fixed |
| E2E-A11Y-02 | `a11y.spec.ts` | desktop (approved `test.skip`, T-08) | implemented |
| E2E-READ-01 | `reading.spec.ts` | mobile-chrome, desktop | implemented |
| E2E-SHARE-01 | `reading.spec.ts` (2 tests) | mobile-chrome (approved `test.skip`) | implemented |
| E2E-SMOKE-01..03 | `smoke.spec.ts` | smoke (skips without `LIVE_URL`) | implemented; never run against the real deploy (LOW-6) |
| (extra) E2E-INFRA-01 | `infra.spec.ts` | all real projects | not in catalog, harmless |

### Lighthouse
| ID | Where | Status |
|---|---|---|
| LH-01 | `lighthouserc.json` + `.github/workflows/lighthouse.yml` (PRs to main) | implemented, no ID tag; the gate is close to noise (T-09 Q2) |
| LH-02 | — | retired (Lighthouse 12), covered by E2E-PWA-01 / E2E-OFF-02 |

### Never run on WebKit (mobile-safari, tablet)
WebKit has **never** run in this project (T-03..T-08, D-09 and this audit were all Chromium-only). The first run will be in CI
(`ci.yml` installs webkit). The `--list` output shows 81 tests per WebKit project. These 72 would execute and have never run on WebKit:

- E2E-INFRA-01
- E2E-NAV-01, 02, 03
- E2E-SAFE-01, 03, 04, 05
- E2E-LAYOUT-01 (20 routes), E2E-LAYOUT-02 (20 routes), E2E-LAYOUT-03 (tablet expects the bottom nav)
- E2E-A11Y-01 (20 routes + gate open + read-aloud)
- E2E-READ-01

These 9 skip on WebKit by approved decision: E2E-LAYOUT-04 ×5 (no WebKit baselines), E2E-A11Y-02 ×2 and E2E-SHARE-01 ×2.
E2E-OFF-01/02 and E2E-PWA-01 are excluded by `@sw`. The `@fixture` tests (GEO, LINK, SAFE-02) are Chromium-only by design.

---

## 2. Coverage — `npx vitest run --coverage`

32 files, **532 tests passed**, 0 failed.

| Scope | Threshold | Lines | Branches | Result |
|---|---|---|---|---|
| `src/lib/**` (format, geo, i18n, links, storage) | 100 % lines & branches | **100 %** | **100 %** | pass |
| `src/components/layout` | ≥ 80 % lines | 100 % | 100 % | pass |
| `src/components/primitives` | ≥ 80 % lines | 100 % | 98.91 % | pass |
| `src/components/reading` | ≥ 80 % lines | 100 % | 96.92 % | pass |
| `src/components/tour` | ≥ 80 % lines | 99.76 % | 96.11 % | pass |
| (info) `src/pages` | — | 97.78 % | 93.38 % | — |
| (info) `src/hooks` | — | 95.52 % | 95.45 % | — |
| (info) `src/content` | — | 97.09 % | 92 % | — |
| (info) all files | — | 97.82 % | 96.11 % | — |

Notes:
- The thresholds are **not enforced in CI**. `npm run check` runs `npm test` = `vitest run`, without `--coverage` (MEDIUM-2).
- `scripts/content/**` (the converter) is outside the coverage `include`. It is tested by UT-PARSE-* and to-json, but its coverage is not measured (LOW-4).
- Coverage does not equal protection. `OfflineIndicator.tsx`, `DriveBanner.tsx`, `AppLayout.tsx` and `he.ts` are all at
  100 % lines, yet mutations 9, 10 and 11 in those files escaped every test (§4).

---

## 3. Flakiness — 3 full Playwright runs

Command (each run separate, Chromium only):
`flock /tmp/pw-e2e.lock npx playwright test --project=mobile-chrome --project=desktop --project=fixture-chrome`

| Run | Passed | Skipped | Failed | Time |
|---|---|---|---|---|
| 1 | 169 | 6 | 0 | 2.9 min |
| 2 | 169 | 6 | 0 | 3.1 min |
| 3 | 169 | 6 | 0 | 3.0 min |

Projects: mobile-chrome 84, desktop 84, fixture-chrome 7. The 6 skips are all approved:
E2E-SHARE-01 ×2, E2E-OFF-02 and E2E-PWA-01 on desktop, and E2E-A11Y-02 ×2 on mobile-chrome.

**Flaky: none.** Locally `retries: 0`, so any flake would have shown as a failure.

`test.skip` / `.only` / `waitForTimeout` hits (task step 5):

| Hit | Reason | Approved? |
|---|---|---|
| `reading.spec.ts:45` | SHARE-01 mobile-chrome only | yes (task scope) |
| `offline.spec.ts:146` | OFF-02 mobile-chrome only | yes (task scope) |
| `pwa.spec.ts:20` | PWA-01 mobile-chrome only | yes (task scope) |
| `layout.spec.ts:89`, `:106` | LAYOUT-04 pages and header, Chromium only | yes (T-07) |
| `a11y.spec.ts:90` | A11Y-02 desktop only | yes (T-08) |
| `smoke.spec.ts:5` | skips without `LIVE_URL` | yes |

No `.only`, no `test.fixme`, no `it.skip`/`todo`, and no `waitForTimeout` anywhere in `tests/`.

---

## 4. Mutation spot-check

Each mutation was applied in the worktree, the most relevant tests were run, and the file was reverted with
`git checkout -- <file>`. Nothing was committed, and `git status` was clean after each one.

| # | Mutation (file) | Caught by | Verdict |
|---|---|---|---|
| 1 | `wazeUrl` swaps lat/lng (`src/lib/links.ts`, waze only) | UT-LINK-01; E2E-LINK-01 (`Received: …ll=34.500000,31.400000`) | **caught**. CT-NAVL-01 stayed green (tautological, LOW-1) |
| 2 | Remove the `ContentWarningGate` around opening+oct7+quotes (`PersonPage.tsx`) | 10 tests in `PersonPage.test.tsx` (gate, G2, F-22); E2E-SAFE-02; E2E-LAYOUT-04 person | **caught** |
| 3 | `!` at the end of `offline.ready` (`src/i18n/he.ts`) | CI-07 | **caught** |
| 4 | One word in `roni-eshel.json` `oct7` (שנה → שנתיים) | CI-03, CI-04 (`people/04_roni-eshel.md · oct7`) | **caught** |
| 5 | `getCurrentPosition` on mount (`useNearbyStation.ts`) | 5 `useNearbyStation` unit tests; 3 TourPage tests; E2E-GEO-05 | **caught** |
| 6 | Graphic person shows `opening` outside the gate instead of `gentleOpening` (`PersonPage.tsx`) | 5 tests in `PersonPage.test.tsx` (F-22 sweep + gate) | **caught, component level only**: E2E-SAFE-02 and E2E-LAYOUT-04 person both **passed** (MEDIUM-1, LOW-2) |
| 7 | `PersonCard` href without `#` (`PersonCard.tsx`) | CT-PCARD-01; E2E-NAV-01 | **caught** |
| 8 | One word in `nitzan-libstein.json` `gentleOpening` (19 → 20) | CI-03, CI-04 (`· gentleOpening`) | **caught** |
| 9 | `OfflineIndicator` back in the flow: dock classes replaced with `px-4 py-2` | **none**: 172 component tests, LAYOUT-04 ×10, OFF-01/02, LAYOUT-02 `/` and `/tour` all green. A probe on the mutated build showed `<main>` top moving 69 → 157 px when "saved" appears | **NOT CAUGHT, HIGH-3** |
| 10 (extra) | `drive.warning` changed to "מי שנוהג משתמש באפליקציה בזמן הנסיעה." (`he.ts`) | **none**: all 532 Vitest tests and E2E-SAFE-05 green | **NOT CAUGHT, HIGH-1** |
| 11 (extra) | `navigator.geolocation.watchPosition` on mount in `AppLayout.tsx` | **none**: 296 unit+component tests and E2E-GEO-05 green | **NOT CAUGHT, HIGH-2** |
| 12 (extra) | `aner-shapira.json` `oct7Sensitivity` graphic → standard | CI-03; schema refine (`gentleOpening is allowed only when … graphic`) fails CI-01/02, content-loader and PersonPage at load | **caught** |

Already covered without a mutation:
- **Route-map markers are image-only.** `RouteMap.test.tsx` asserts 0 links and 0 `[tabindex]` in the SVG, and E2E-A11Y-01 runs axe on `/tour`.
- **Hash routes.** CT-CARD-01, CT-PCARD-01, NearbyBanner and E2E-NAV-01.

---

## 5. Findings

### HIGH
| # | Finding | Evidence | Owner |
|---|---|---|---|
| HIGH-1 | **The driver-safety text is not pinned by any test.** E2E-SAFE-05 checks only that `driver-warning` is visible. CT-DRIVE-01 compares with `t('drive.warning')`, so it follows any change. CI-07 checks only `!`, emoji and banned words. The warning can say the opposite (§1.9) and every suite stays green. The same applies to other safety and ethics strings: the gate title and buttons, and the location privacy line. | Mutation 10 | **T-06**: E2E-SAFE-05 asserts the exact text from `contracts/strings.he.ts`. **T-02**: add a CI scan that safety-critical keys in `he.ts` equal the contract (or a reviewed allow-list, since D-07 may change values) |
| HIGH-2 | **Location reads other than `getCurrentPosition` are invisible.** `spyGeolocation` (helpers/geo.ts) wraps only `getCurrentPosition`. E2E-GEO-05 runs only on the 7 fixture routes. Unit tests check `watchPosition` only inside `useNearbyStation`. A `watchPosition` call on mount anywhere else passes everything (§1.10, "location read only on press"). | Mutation 11 | **P0-03**: the spy should also count `watchPosition` and `permissions.query({name:'geolocation'})`. **T-04**: GEO-05 asserts all three are 0, and preferably also on the real build's routes |
| HIGH-3 | **No regression test for the offline-message layout shift (F-19/F-20).** `pwa-ui.test.tsx` does not assert the panel is out of flow. LAYOUT-04 hides the indicator and captures before "saved" appears. OFF-01 checks only visibility. Putting the panel back in flow (CLS ≈ 0.107, which drops Lighthouse Performance below 90 per F-19) is not caught. | Mutation 9 + probe (main 69 → 157 px) | **T-07**: an E2E that waits for the "saved" panel and asserts `<main>`'s top did not move (or the panel's computed `position` is `fixed`). **F-20**: a component assertion on the dock class |

### MEDIUM
| # | Finding | Evidence | Owner |
|---|---|---|---|
| MEDIUM-1 | **E2E-SAFE-02 lags behind the F-22/G2 rules.** It checks that oct7 and the quote are hidden. It does not check that `opening`, `altQuote` (m5) and `guideLevels.s30` (s30) are hidden, or that `gentleOpening` is shown before "show". So the rule is protected only in jsdom. In a real browser, an `opening` leaking outside the gate passed E2E. | Mutation 6 | **T-06** |
| MEDIUM-2 | **Coverage thresholds are not enforced in CI.** `npm run check` → `vitest run`, without `--coverage`. A drop below 100 % in `src/lib` would not fail a PR. | `package.json` `check`, `ci.yml` | **O-02** (add a `npx vitest run --coverage` step to `ci.yml`). `package.json` is frozen (P0-01) |
| MEDIUM-3 | **WebKit has never run.** 72 tests per WebKit project (mobile-safari, tablet) have never executed. Their first run will be in CI. D-09 also did not inspect Safari/iPad (safe-area insets, `100dvh`). | §1 list | **O-02 / L-01**: a green CI run with all projects is a launch gate. **T-07**: decide whether WebKit gets LAYOUT-04 baselines |

### LOW
| # | Finding | Owner |
|---|---|---|
| LOW-1 | CT-NAVL-01 builds its expected hrefs with `wazeUrl()`/`googleMapsUrl()`, so it cannot catch a link bug (mutation 1 left it green). Use literal strings. | F-10 (`tour-cards.test.tsx`) |
| LOW-2 | LAYOUT-04 `person` (aner-shapira, `maxDiffPixelRatio: 0.01`) did not catch the gentleOpening → opening swap (mutation 6). Whole-paragraph text changes on a full-page capture fit inside 1 %. Do not rely on baselines for content rules. | T-07 (document it) |
| LOW-3 | The approved gentle openings (C-07) are verified only against `content-source/`. An edit to both the Markdown and the JSON passes every test. Consider a hash of the five approved texts in CI-04, or a review gate on `content-source/` diffs. | T-01 / orchestrator |
| LOW-4 | Coverage `include` is `src/**`. The converter in `scripts/content/` is not measured. | P0-03 (`vitest.config.ts`) |
| LOW-5 | LH-01 has no ID in `lighthouserc.json`/`lighthouse.yml`. It runs only on PRs to main, and `median-run` sits close to the 0.9 floor (T-09 Q2). | T-09 |
| LOW-6 | E2E-SMOKE-01..03 have only run against a local preview on port 4180, never against the deployed URL. | T-10 / O-03 (run after the first deploy) |
| LOW-7 | Project scoping uses `test.skip` at 5 sites (approved). In CI, `retries: 2` will hide flakes as passes. Add a per-project grep/tag in the config, and report "flaky" from the HTML report. | P0-03 (`playwright.config.ts`), O-02 |
| (info) | CI-04 does not independently check inline-YAML text (`silenceMoment.prompt`, `location.note`). CI-03 covers it (T-01 Q2). | T-01 |

---

## 6. What is solid
- **Graphic-person gating.** It is enforced for every real graphic person at s30, m2 and m5: no opening, oct7, quote, altQuote or s30 before "show", and gentleOpening shown.
- **The same rule on cards.** PersonCard follows it on real content, and the schema refuses `gentleOpening` on a non-graphic person.
- **Verbatim content is double-locked.** CI-03 and CI-04 each caught both content mutations, including the approved `gentleOpening`.
- **Navigation is hash-route safe** (mutation 7 was caught at both the component and E2E level).
- **Stable suite.** 3 × 169 green, no `waitForTimeout`, no `.only`.
