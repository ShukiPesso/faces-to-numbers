# 05 — Design Brief (for design agents)

## 1. What you are designing
A memorial companion, not a tourism app. People will hold it while standing where friends and children were murdered, or while sitting in a car reading aloud to their family. It must feel like a **quiet, well-printed memorial booklet that happens to live in a phone** — calm, dignified, legible, never flashy.

Read at least two files in `content-source/people/` before you design anything. Design for that material.

## 2. Context of use → design consequences

| Context | Consequence |
|---|---|
| Outdoors in strong Israeli sun | Light theme first; body text contrast ≥ 7:1; no thin weights for body; no low-contrast greys for important text |
| Weak / no signal | No reliance on remote images or web fonts; everything self-contained |
| In a moving car, passenger reads aloud | "Read-aloud mode": body ≥ 22 px, line-height ≥ 1.7, minimal chrome; large previous/next controls |
| Emotional moments | Generous whitespace, slow pacing, no motion that demands attention; explicit "moment of silence" pattern |
| Older visitors | Base text 18 px; clear labels next to icons; no icon-only critical actions |
| One-handed phone use | Primary actions reachable at the bottom on mobile (bottom nav, sticky next/prev) |
| Planning at home on desktop | Two-column layout: route on the side, content in a comfortable reading column |

## 3. Tone and principles
1. **Dignity over drama.** No red-alert aesthetics, no dramatic darkness, no "breaking news" styling.
2. **Faces before numbers.** People's names and stories are the visual heroes; statistics are secondary text.
3. **Quiet hierarchy.** Few sizes, few weights, one accent. Let typography do the work.
4. **Restraint with symbols.** The red anemone (כלנית) is the Nova memorial's symbol; you may use a small abstract anemone mark sparingly (logo, dividers). Never as decoration wallpaper.
5. **Nothing celebratory.** No confetti, badges, progress "wins", bouncy motion, playful illustrations (Conventions §1.4, §1.6).
6. **Calm feedback.** States change softly (fades ≤ 200 ms, disabled under reduced motion).

## 4. Visual language — starting point (refine in D-02, keep the spirit)
Continuity with the printed booklet Shuki already used:

| Role | Starting value | Notes |
|---|---|---|
| Paper (background) | `#FAF8F4` | warm off-white |
| Ink (body text) | `#1B1B1F` | must reach ≥ 7:1 on paper |
| Navy (headings, primary actions) | `#1F3864` | |
| Memorial red (accent, sparing) | `#9E1B1B` | warnings, section labels; never large fills |
| Gold (quotes, personal-story frames) | `#7F6000` | borders and labels, not body text on paper unless contrast passes |
| Muted text | `#595959` | secondary only; check ≥ 4.5:1 |
| Surface (cards) | `#FFFFFF` with 1 px `#E7E2D8` border | flat, no heavy shadows |

Typography (must support Hebrew, open license, available on `@fontsource`):
- UI & body: a clean Hebrew sans — candidates **Assistant** or **Heebo**.
- Headings & quotes: a dignified Hebrew serif — candidate **Frank Ruhl Libre**.
- Max 2 families, max 4 weights total. Test long Hebrew names and niqqud-free quotation marks (״ „ ”).

Iconography: **Lucide** (MIT) only, stroke 1.75–2 px, always paired with a text label for actions. Directional icons must mirror for RTL.

## 5. Breakpoints & layout (from Architecture §10)
- **base 360–767:** single column; sticky **bottom navigation** (בית · המסלול · איפה אני · אודות); sticky prev/next bar on station pages.
- **md 768–1023 (tablet):** single column, wider margins, larger type scale step; bottom nav remains.
- **lg ≥ 1024 (desktop/tablet landscape):** side navigation with the route stepper (start side = right in RTL) + reading column (max 720 px).
- No horizontal scroll at ≥ 320 px. Tap targets ≥ 44×44.

## 6. Components you will specify (D-03)
Layout: `Header`, `BottomNav`, `SideNav`, `Footer`, `OfflineIndicator`, `UpdatePrompt`.
Primitives: `Button` (primary / secondary / quiet / link), `SectionHeading`, `DurationBadge`, `QuoteBlock`, `PhotoFrame` (placeholder & cleared), `SourceList`, `Markdown` typography.
Tour: `StationCard`, `PersonCard` (primary / companion), `ProgressStepper`, `RouteMap`, `NearbyBanner` (7 states), `NavLinks` (verified / unverified), `DriveBanner`.
Reading: `DepthTabs` (30 שניות / 2 דקות / 5 דקות), `ContentWarningGate` (closed / opened / skipped), `SilenceMoment` (idle / running / ended), `ReadAloudToggle`.

For each: anatomy, all states (default, hover, focus, active, disabled, loading/empty if relevant), sizes per breakpoint, token references, RTL notes, accessibility notes (role, labels, focus order), and `data-testid` from Testing Strategy §6.

## 7. Pages you will lay out (D-04)
`Home`, `Tour overview`, `Station` (stop), `Station` (drive), `Person` (each depth), `About`, `Sources`, `NotFound`, plus states: offline banner, update prompt, nearby banner states, warning gate closed, silence running, read-aloud mode.

## 8. Deliverable formats (so developers can use them directly)
All design output goes under `design/` — never into `src/` (except D-07, which edits `src/i18n/he.ts` values only).

| Deliverable | Format | Path |
|---|---|---|
| Principles & tone | Markdown | `design/01-principles.md` |
| Tokens | JSON + CSS custom properties | `design/tokens.json`, `design/tokens.css` |
| Component specs | Markdown, one file per component group | `design/components/*.md` |
| Page mockups | Self-contained HTML using `design/tokens.css` (no external requests), responsive | `design/mockups/<page>.html` |
| Mockup screenshots | PNG at 390×844, 820×1180, 1440×900 | `design/mockups/shots/<page>-<width>.png` |
| Route map | Optimized SVG with ids `marker-<station-id>` | `design/route-map.svg` |
| Icons list | Markdown table (Lucide names + usage) | `design/icons.md` |
| Microcopy | Markdown (key → Hebrew text → rationale) | `design/microcopy.md` |
| App icons / OG image | PNG/SVG | `design/brand/` |
| Design QA report | Markdown with screenshots | `design/qa/<date>.md` |

Screenshots: run `npx playwright screenshot --viewport-size=390,844 file://$PWD/design/mockups/home.html design/mockups/shots/home-390.png` (and the other two widths).

## 9. Design review checklist (used by D-09 and by the orchestrator)
- [ ] Feels calm and dignified; nothing playful, alarming or celebratory.
- [ ] Body text ≥ 18 px (≥ 22 px in read-aloud), contrast ≥ 7:1; all other text ≥ 4.5:1.
- [ ] Every action has a visible label; icons mirror correctly in RTL.
- [ ] Tap targets ≥ 44×44; primary actions reachable by thumb on mobile.
- [ ] Works at 360, 390, 820, 1024, 1440 px with no horizontal scroll.
- [ ] Focus states visible and consistent.
- [ ] Reduced-motion respected; no motion longer than 200 ms.
- [ ] Photos only as calm placeholders until cleared.
- [ ] People's names are visually prominent; numbers are secondary.
