# D-09 — Design QA of the built app (2026-10-12)

**Verdict: APPROVED WITH FIXES**

**Baselines approved: no** — all 8 Chromium baselines were captured before the header brand mark landed;
regenerate them once F-20 is merged (details in "Visual baselines" below).

Severity: **HIGH** = blocker (a principle or red flag is broken, or must be fixed before launch) ·
**MEDIUM** = major (visible deviation from the approved design that affects reading or safety) ·
**LOW** = minor (polish, mockup fidelity). Findings: **0 HIGH · 4 MEDIUM · 10 LOW**.

## How this was checked

- Built with `npm run build` (real content) and `npm run build:e2e` (fixtures, for the "איפה אני" at/near
  states), served with `vite preview` on port 4192 only.
- Chromium 1194 (`/opt/pw-browsers`), Playwright scripts kept outside the repo. **WebKit is not available:
  Safari (iPhone) and iPad were not inspected.**
- Widths 360×740, 390×844, 820×1180, 1024×768, 1440×900 for: home, tour, a stop station (`nova`), a drive
  station (`route-232`), a standard person (`roni-eshel`) at 30 שניות / 2 דקות / 5 דקות, a graphic person
  (`aner-shapira`) with the gate closed and open, about, sources, 404, read-aloud mode (drive station and
  person), and the offline banner (`setOffline` after `navigator.serviceWorker.ready`). States: silence
  idle/running/ended, gate skipped, home with progress, all stations visited, last station, "איפה אני"
  denied / none / at / near.
- Automated checks on every page × width: horizontal overflow, tap targets < 44×44 (outside
  `[data-inline-text]`), WCAG contrast of every visible text node against its painted background, `<p>` body
  text size in `<main>`, every element painted in memorial red (`#9E1B1B`), elements larger than the `h1`,
  `h1` count, header mark.
- Compared with `design/mockups/shots/*` and the specs in `design/components/`, the principles and red flags
  in `design/01-principles.md`, and the G2 decisions in `design/mockups/README.md`.

## What passes (no action)

| Check | Result |
|---|---|
| Horizontal scroll 360–1440 | none on any route (scrollWidth = viewport) |
| Tap targets | no control under 44×44 on any route/width; offline "לסגור" is 79×46 |
| Contrast of small text | no visible text below 4.5:1 anywhere; muted captions 6.6:1 on bg |
| Body text size | body `<p>` 18 px (19 px md+), 22 px in read-aloud; 14–17 px only on labels/captions |
| Memorial red | only the header anemone, the `DriveBanner` start-border + car icon, and the `ContentWarningGate` start-border + label + icon. No red fill, no red buttons, links, numbers or errors. Offline/nearby failure states use ink only |
| Person name first | on person pages the `h1` (name + honorific) is the largest text (34 px / 44 px); nothing in `main` is larger than the `h1` on any page; station pages put the background before people cards, numbers stay in body text |
| No celebration | all 7 visited: plain "ביקרתם כאן" + check, last station shows "סוף המסלול" and the closing text; no %, counts, badges, `!` or congratulatory copy (text scan) |
| Silence moment | starts only on tap; while running the panel keeps the same 320 px height, the text does not change over time, 0 running animations, no digits; end is a soft text change with focus moved to it |
| Driver warning | first thing after the title block on both drive segments, above the fold at 360×740 (also in read-aloud) |
| Graphic people | gate closed by default at all three depths for all five graphic people; quotes are **not** in the DOM until "להציג את הקטע" (G2 decision 1 implemented); show/skip buttons equal (stacked at base, one row md+); skip moves focus to the sentinel |
| Photo strip | small quiet strip with "תמונה תתווסף רק באישור המשפחה" (G2 decision 2), no silhouette or image |
| RTL | logical layout correct; prev chevron points right, next points left; depth tabs order 30 שניות → 5 דקות from the start side; external-link icons mirrored; route map labels not flipped |
| Header brand mark | anemone `img` (`alt=""`, `aria-hidden`) beside the app name at every width, single red, not repeated |
| Motion | only `transition-colors` 150 ms; reduced-motion kills all transitions/animations |
| Focus | keyboard focus ring 3 px + 2 px offset; after a tap navigation focus moves to `main` with no visible ring |
| Read-aloud | body 22 px / 1.75, read-aloud box enlarged, header unchanged, toggle stays reachable |

## Findings

| # | Sev | Route | Viewport | Screenshot | What is wrong (vs spec / mockup) | Owner (task · file) |
|---|---|---|---|---|---|---|
| 1 | MEDIUM | `/tour` | 820, 1024, 1440 | `shots/F-map-oversized-tour-1440-full.png`, `shots/F-map-oversized-tour-820-full.png` | The route map SVG scales to the full reading column: 678×1205 px at 820 and 1440 (630×1120 at 1024). Labels render at roughly twice the body size and the first station card starts at y≈1800, two screens below the fold. The approved mockup (`mockups/shots/tour-1440.png`) keeps the map at about 360 px wide, centred. The station list, which is the text alternative and the main way to choose a station, should not be pushed this far down. Cap the map's inline size (e.g. `max-inline-size` ≈ 360–400 px, centred) at md and up. | F-11 · `src/components/tour/RouteMap.tsx` |
| 2 | MEDIUM | `/station/route-232`, `/station/closing-drive` (read-aloud on) | 360, 390, 820 | `shots/readaloud-drive-390.png`, `shots/readaloud-drive-360.png` | In read-aloud mode (the mode used in the car) the driver warning text stays at `text-lg` = 20 px while body text grows to 22 px, so on phones the warning is **smaller than the text it protects**. Spec tour.md §7: read-aloud text `--text-xl` / `--leading-xl`. (At 1440 it happens to be 22 px.) | F-10 · `src/components/tour/DriveBanner.tsx` |
| 3 | MEDIUM | `/person/aner-shapira` (and the station card on `/station/reim-shelter`) | all | `shots/person-graphic-closed-390.png`, `shots/person-graphic-closed-1440.png` | Decision needed, not a dev fix. After G2 moved graphic people's quotes behind the gate, the same hard detail the gate hides is still visible without passing the gate in two places on this page: the short opening paragraph directly under the depth tabs (2 דקות / 5 דקות, and the same opening on the station's person card), and one title in the page's sources list. This touches red flag 8 in spirit. Placement only; content must stay verbatim. Ask Shuki whether openings and source titles of `graphic` people should also sit behind the gate, and review all five graphic people for the same pattern. | Shuki / H-06 (ADR-007 placement); then F-16 · `src/pages/PersonPage.tsx`, F-10 · `src/components/tour/PersonCard.tsx` |
| 4 | MEDIUM | `/`, `/tour`, `/station/sderot`, `/person/aner-shapira` | mobile-chrome (412), desktop (1440) | `shots/F-baselines-header-without-mark.png` | The 8 committed baselines show the header **without** the anemone mark (they were captured before commit `8298bc6` added it). The current build differs from them by only 0.05–0.23 % of pixels, so `maxDiffPixelRatio: 0.01` lets the brand mark disappear without failing. Also, the mobile full-page captures paint the fixed sticky bar and BottomNav over the middle of the page (e.g. over the gate text on the person baseline), so that area is not protected. Regenerate after F-20 merges (its font fallback changes will move text anyway); consider masking or hiding the fixed bars for full-page captures and a tighter threshold for the header. | T-07 · `tests/e2e/layout.spec.ts`, `tests/e2e/layout.spec.ts-snapshots/` |
| 5 | LOW | `/tour` | 390 (all) | `shots/F-map-heading-gap-tour-390-full.png` | The "מפת המסלול" heading sits inside the map card and keeps its section top margin (`--space-9`), leaving an empty band of ≈ 60 px at the top of the card. In the mockup the heading is above the card. | F-11 · `src/components/tour/RouteMap.tsx` |
| 6 | LOW | `/tour` | 820, 1024, 1440 | `shots/F-map-oversized-tour-1440-full.png` | "איפה אני" button is full width at md and lg; spec tour.md §5 and the mockup: full width at base only, intrinsic at md and lg. The panel also keeps a tall empty status line in idle (reserved by design, fine). | F-12 · `src/components/tour/NearbyBanner.tsx` |
| 7 | LOW | every route with a duration (home, tour cards, station headers) | all | `shots/F-duration-icon-side-390.png` | `DurationBadge` puts the clock icon after the text (end side). Spec primitives.md §3 and the mockup: icon at the start side, before the minutes (the neighbouring "7 תחנות" meta on home already has its icon at the start). | F-07 · `src/components/primitives/DurationBadge.tsx` |
| 8 | LOW | `/`, `/tour`, `/about`, `/sources`, 404 | all | `shots/tour-390.png`, `shots/home-1440.png` | Page `h1` is `text-2xl` in ink (28 px / 34 px md+). Mockup `.h1`: `--text-3xl` in `--color-primary` (navy marks headings). Station and person `h1`s already match. | F-06 · `src/pages/PageTitle.tsx` |
| 9 | LOW | `/person/roni-eshel` at 5 דקות (and every person at 5 דקות) | all | `shots/F-no-end-mark-person-m5-390.png` | The approved mockup (`person-m5`) closes the story with the small anemone divider before the sources; the build has none. Principles allow it "at most" once, so this is fidelity, not a rule break. | F-16 · `src/pages/PersonPage.tsx` |
| 10 | LOW | any station page | 1024, 1440 | `shots/F-sidenav-current-1440-zoom.png` | SideNav current station: filled navy marker + semibold title, but no outer ring. Spec tour.md §3 (current = fill **plus** outer ring as shape cue) and the mockup show the ring. SideNav renders its own list instead of `ProgressStepper variant="compact"`, so the ring defined there is not used. | F-06 · `src/components/layout/SideNav.tsx` |
| 11 | LOW | person pages | all | `shots/F-depth-tab-selected-390-zoom.png` | Selected depth tab's shape cue is a 4 px light border on the outer bottom edge, so it reads as a notch in the frame rather than the inset bar in the mockup. Semibold weight still differs, so meaning is not color-only. | F-08 · `src/components/reading/DepthTabs.tsx` |
| 12 | LOW | station pages | 360 | `shots/drive-route232-360.png`, `shots/readaloud-drive-360.png` | In the sticky bar the label "לתחנה הקודמת" wraps word-by-word onto two lines at 360 px (and in read-aloud), so the two buttons have uneven content and the bar grows to ≈ 25 % of the viewport. Consider a smaller inline padding or `text-wrap: balance` at base. | F-15 · `src/pages/StationPage.tsx` |
| 13 | LOW | header (all) | 1024, 1440 | `shots/F-brand-mark-1440-zoom.png` | Mark is sized `1.25em` of the name, which gives 35 px at lg; spec layout.md §2: block size = `--text-xl` (28 px md+). At base it is 25 px vs 24 px, fine. | F-06 · `src/components/layout/Header.tsx` |
| 14 | LOW | offline banner (all routes) | 390, 1440 | `shots/state-offline-ready-390.png`, `shots/state-offline-now-1440.png` | For F-20 (in progress, not blocking): the "saved" and offline panels are in flow under the header and push the page down ≈ 104 px when "saved" appears; at lg they span the whole main column (1152 px) instead of the reading column (spec layout.md §6). Wording, icon and no-red are correct. Re-check after F-20. | F-20 · `src/components/layout/OfflineIndicator.tsx` |

## Visual baselines (`tests/e2e/layout.spec.ts-snapshots/`, Chromium only)

I re-rendered all 8 against the current build with the same device settings (Pixel 7 / Desktop Chrome
1440×900, full page, CSS scale). Pixel difference 0.05–0.23 %, mainly the header brand mark.

| Baseline | Content shown | Matches design apart from the header? | Approved |
|---|---|---|---|
| `home-mobile-chrome-linux.png` | home, first visit | yes | **no**: no brand mark; fixed BottomNav painted mid-page |
| `home-desktop-linux.png` | home, SideNav | yes | **no**: no brand mark |
| `tour-mobile-chrome-linux.png` | tour, idle "איפה אני", map, 7 cards | yes (map size fine at 412) | **no**: no brand mark; fixed BottomNav mid-page |
| `tour-desktop-linux.png` | tour | no: oversized map (finding 1) is baked in | **no**: no brand mark; regenerate after finding 1 is fixed |
| `station-mobile-chrome-linux.png` | `/station/sderot` | yes | **no**: no brand mark; sticky bar + BottomNav painted over the talking points |
| `station-desktop-linux.png` | `/station/sderot` | yes | **no**: no brand mark |
| `person-mobile-chrome-linux.png` | `/person/aner-shapira` at 2 דקות, gate closed (no graphic text, no quote: correct) | yes | **no**: no brand mark; BottomNav painted over the gate text |
| `person-desktop-linux.png` | same, desktop | yes | **no**: no brand mark |

Action (T-07): after F-20 (and ideally findings 1, 2 and 7) are merged, regenerate the 8 PNGs and send them
back to D-09 for a quick re-approval. Nothing else in them breaks a principle.

## Screenshot index (`design/qa/shots/`, 72 PNG, 256-color)

- Coverage, above the fold, at 390 / 820 / 1440: `home`, `tour`, `stop-nova`, `drive-route232`,
  `person-std-s30`, `person-std-m2`, `person-std-m5`, `person-graphic-closed`, `person-graphic-open`, `about`,
  `sources`, `notfound`, `readaloud-drive`, `readaloud-person` (`<page>-<width>.png`, 42 files).
- Extra widths: `home-360`, `drive-route232-360`, `readaloud-drive-360`, `stop-nova-1024`,
  `person-graphic-closed-1024`.
- States: `state-silence-idle-390`, `state-silence-running-390`, `state-silence-ended-390|1440`,
  `state-gate-skipped-390|1440`, `state-offline-ready-390|1440`, `state-offline-now-390|1440`,
  `state-nearby-denied-390`, `state-nearby-at-390`, `state-nearby-near-390` (fixture build),
  `state-home-progress-390`, `state-tour-allvisited-390`, `state-last-station-390`.
- Findings: `F-*.png` as referenced in the table.

## Not inspected

- Safari / iPhone and iPad (WebKit not installed here): safe-area insets, `100dvh` SideNav, font rendering.
- Real-device sunlight legibility and screen readers (out of scope for a visual pass).
