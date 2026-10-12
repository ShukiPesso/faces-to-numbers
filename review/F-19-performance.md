# F-19 — Performance review against the budgets (Architecture §9)

Measured on 2026-10-12, branch `task/F-19` (base `5469b4a`). No production code changed in F-19:
the bundle was already within every size budget, and the one change the task allows
(`router.tsx` route `lazy`) was tried, measured, and gives no benefit (see §3).

## 1. Size budgets — `npm run build && npm run size`

| Budget | Before | After | Limit | Result |
|---|---|---|---|---|
| JS (all chunks, gzip) | 163.8 KB | 163.8 KB | 200 KB | OK |
| CSS (gzip) | 5.1 KB | 5.1 KB | 30 KB | OK |
| Fonts (all woff2) | 75.3 KB | 75.3 KB | 220 KB | OK |
| Total precache | 667.4 KB (21 entries) | 667.4 KB | 2048 KB | OK |
| Files in `dist/` | 31 | 31 | 300 | OK |

Vite output: one app chunk `index-*.js` 498.6 KB min / 159.0 KB gzip, `workbox-window` 2.3 KB gzip,
one CSS file 5.2 KB gzip.

### What is in the 498.6 KB app chunk (minified bytes, attributed via a throw-away sourcemap build)

| Part | Minified |
|---|---|
| `react-dom` + `react` + `scheduler` | ~138 KB |
| Markdown stack (`react-markdown`, `micromark*`, `mdast-*`, `hast-*`, `property-information`, `unified`, `vfile`, `@ungap/structured-clone`) | ~100 KB |
| `zod` (runtime content validation) | 54 KB |
| `@remix-run/router` + `react-router(-dom)` | ~63 KB |
| `lucide-react` (tree-shaken icons) | 12 KB |
| App code (`src/`) incl. i18n and content | ~50 KB |

## 2. Lighthouse 12.8.2, mobile (default form factor, simulated throttling)

Run against `vite preview --port 4191` (not 4173: that port is reserved for the E2E suite in this
environment) with `--only-categories=performance,accessibility,best-practices`, headless Chromium
1194. Three runs per URL; this container's CPU makes TBT noisy (160–480 ms), so the median is the
fair number.

| URL | Perf (runs) | Perf median | A11y | Best Practices | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|
| `/` | 83 / 88 / 88 | **88** | 100 | 100 | 2.1–2.4 s | 160–330 ms | 0.154 |
| `/#/station/sderot` | 89 / 91 / 79 | **89** | 100 | 100 | 2.0–2.5 s | 190–480 ms | 0.120–0.125 |
| `/#/person/aner-shapira` | 89 / 86 / 86 | **86** | 100 | 100 | 2.0–2.5 s | 170 ms | 0.166 |

Accessibility (≥ 95) and Best Practices (≥ 95) pass everywhere. **Performance is 1–4 points under
90.** The reason is the same on all three URLs: CLS ≥ 0.12 (score weight 25 %), plus TBT jitter.

### Where the CLS comes from (Lighthouse `layout-shifts` + a Playwright `PerformanceObserver` probe at 412×823, 4× CPU, slow 4G)

| Shift | Value | Cause |
|---|---|---|
| `<main>` moves down 96 px (top 69 → 165) | **0.107** on every URL | The "saved for offline" message (`OfflineIndicator`, `offlineReady`) is inserted in the banner slot above `<main>` when the service worker finishes installing, ~2.2 s after load. With the service worker blocked, this shift does not happen (verified with the probe). Every first visit gets it — exactly what Lighthouse measures. |
| Body text re-flows | 0.047 (`/`), 0.057 (person), 0.007 (station) | Web-font swap: the Hebrew `assistant-hebrew-400/600` and `frank-ruhl-libre-hebrew-700` woff2 files are discovered only after the CSS is parsed and the fallback font has different metrics. |

Estimated Performance with the CLS sources removed (recomputed from each run's own audit scores with
Lighthouse's log-normal curve for CLS, p10 0.1 / median 0.25; other metrics unchanged):

| URL | Measured median | Without banner shift | Without banner + font shift |
|---|---|---|---|
| `/` | 88 | ~93 | ~94 |
| `/#/station/sderot` | 89 | ~93 | ~93 |
| `/#/person/aner-shapira` | 86 | ~93 | ~93 |

These are estimates, not measurements; re-measure after the fixes below.

## 3. Route code-splitting (the only lever inside `router.tsx`) — tried, not adopted

Task step 2 applies only if JS exceeds 200 KB gzip; it does not (163.8 KB). I still tried
`lazy` for `/about` and `/sources` in a scratch build to see whether it helps Lighthouse:

| | Main chunk gzip | All JS gzip | Precache |
|---|---|---|---|
| Eager (current) | 159.02 KB | 163.8 KB | 21 entries, 667.4 KB |
| `lazy` About + Sources | 158.91 KB (−0.11) | 164.5 KB (+0.7) | 23 entries, 668.0 KB (both chunks were precached) |

`AboutPage` is 0.48 KB gzip and `SourcesPage` 0.41 KB gzip — their heavy dependencies (Markdown,
content, router) are shared with the home page and stay in the main chunk. The split saves nothing,
adds a request waterfall on a direct visit to those pages, and adds offline risk for zero gain, so
`router.tsx` is unchanged. Lazy-loading Station/Person/Tour would not help either: the measured home
page itself renders Markdown (`tour.intro`, `tour.message`), so the Markdown stack cannot leave the
first chunk.

## 4. Remaining issues outside `router.tsx` — for the orchestrator

Ordered by expected effect on the Lighthouse gap.

1. **Offline-ready message shifts the page (CLS 0.107 on every first visit).** Owner: F-18
   (`src/components/layout/OfflineIndicator.tsx`, with design `design/components/layout.md` §6).
   Fix proposal: show the "saved on the device" message without moving content — e.g. as a fixed
   panel just above the BottomNav / sticky bar (`position: fixed`, `inset-x-0`, z-index token), or
   render it in a slot whose height is already reserved. Keep the same `role="status"` live region so
   the announcement and E2E tests are unaffected. Expected: Perf ≈ 93 on all three URLs.
2. **Web-font swap shift (CLS 0.007–0.057).** Owner: whoever owns `src/styles/fonts.css` /
   `index.html` / `vite.config.ts`. Fix proposal (either):
   a) preload the three above-the-fold Hebrew woff2 files (`assistant-hebrew-400`,
   `assistant-hebrew-600`, `frank-ruhl-libre-hebrew-700`) with `<link rel="preload" as="font"
   type="font/woff2" crossorigin>` — the hashed file names need a small Vite `transformIndexHtml`
   hook or `?url` imports; or
   b) add metric-matched fallback faces (`size-adjust`, `ascent-override`, `descent-override`) in
   `fonts.css` so the swap does not re-flow.
3. **Runtime content validation with `zod` (54 KB min, ≈13 KB gzip, plus parse work on every
   start-up).** Owner: content layer (`src/content/index.ts`; `schema.ts` stays unchanged per
   Conventions §2.5). Content is already validated at build time (`npm run content:check`). Proposal:
   in production builds skip the `safeParse` pass and cast the pre-validated data, keeping full
   validation in dev, tests and `content:check`. Lowers TBT and the JS budget. Needs an architecture
   decision (Architecture §6) — not done here. Its share of TBT was not measured separately.
4. **Markdown stack (~100 KB min) parses Markdown on the phone at every render.** Owner: the
   `Markdown` primitive. Content is static, so the Markdown could be converted to a serialisable
   tree at build time (the content build already exists) and rendered with a tiny renderer. Larger
   change; only worth it if 1–3 do not reach 90.
5. **Render-blocking CSS (~150 ms estimated by Lighthouse).** 5.2 KB gzip; inlining critical CSS
   is possible but low value. Optional.
6. **Measurement noise.** In this container one run of the same build scored 79 and another 91 on
   the station page (TBT 480 vs 190 ms). T-09 / T-11 (Lighthouse CI) should assert on the median of
   ≥ 3 runs per URL, otherwise the gate will flap.
7. (From F-18, confirmed) Vite emits 8 unused `.woff` fallbacks (~98 KB) into `dist/`. They are not
   precached and count only toward the file-count budget (31/300). Harmless.
