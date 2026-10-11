# Components — layout

Status: v1 (D-03). Implemented by F-06 (and F-12 for the PWA banners) in `src/components/layout/` and
`src/app/AppLayout.tsx`. The shared rules in `primitives.md` §0 (focus ring, tap targets, icons, borders,
motion, color meaning, read-aloud, sketch notation) apply to everything here. Sketches are RTL: **right edge
= start side**.

---

## 0. Page frame (AppLayout)

**Purpose.** Fixes where every layout component sits so banners and bars never cover reading.

**Anatomy — base and md (below lg).**

```
┌──────────────────────────────────────────┐
│ [skip link — hidden until focused]        │  1  first in tab order
├──────────────────────────────────────────┤
│ Header                                    │  2  in flow (not sticky)
├──────────────────────────────────────────┤
│ banner slot: OfflineIndicator, UpdatePrompt│  3  in flow, empty = zero height
├──────────────────────────────────────────┤
│ <main id="main">                          │  4
│   page content …                          │
│   … bottom padding = reserved space       │
├──────────────────────────────────────────┤
│ Footer                                    │  5  in flow, last before the reserved space
├──────────────────────────────────────────┤
│ sticky prev/next bar (station pages only) │  6  fixed, above BottomNav
├──────────────────────────────────────────┤
│ BottomNav                                 │  7  fixed to bottom, safe-area inset
└──────────────────────────────────────────┘
```

**Anatomy — lg and up.**

```
┌───────────────────────────────────────────────────────────────┐
│ [skip link]                                                     │
│ Header (full width)                                             │
├───────────────────────────────────────────────────────────────┤
│ banner slot (spans the main column only)                        │
├───────────────────────────────────┬───────────────────────────┤
│ <main id="main">                   │ SideNav                    │
│   reading column, max --content-max│   sticky, scrolls inside   │
│   prev/next inline at page end     │   (start side = right)     │
├───────────────────────────────────┴───────────────────────────┤
│ Footer                                                          │
└───────────────────────────────────────────────────────────────┘
```

SideNav is in the **start** column (right in RTL). DOM order: skip link, Header, SideNav, banner slot,
main, Footer, BottomNav (F-06 step 3). The grid places SideNav visually; DOM order keeps nav before main.

**Reserved bottom space (below lg).** `main` has `padding-block-end` equal to the BottomNav block size + (on
station pages) the sticky bar block size + `env(safe-area-inset-bottom)` + `--space-6`. Until **[R-4]** is
granted, F-06 measures both bars once with a `ResizeObserver` and writes them to two CSS custom properties on
`<html>` (names per R-4); no other code reads raw sizes.

**Stacking.** From back to front: page content < sticky prev/next bar < BottomNav < skip link (focused).
Values: **[R-3]**.

---

## 1. Skip link

**Purpose.** First focusable element; jumps to `#main`.

**Anatomy.**

```
┌─────────────────────────┐
│   [t:app.skipToContent] │  top start corner of the viewport, only while focused
└─────────────────────────┘
```

**Props.** None (rendered by AppLayout).

**States.** Unfocused: visually hidden (`sr-only` clip pattern, still in the tab order). Focused: visible,
positioned at the top start corner (`inset-block-start: var(--space-2)`, `inset-inline-start: var(--space-2)`),
above everything **[R-3]**. Activated: focus moves to `<main id="main" tabindex="-1">`.

**Tokens.** bg `--color-primary`; text `--color-primary-ink`, `--font-body`, `--font-weight-semibold`,
`--text-base`; min block size `--tap-min` (decision: ≥ the tap minimum when focused); padding inline
`--space-5`, padding block `--space-2`; radius `--radius-md`; §0 focus ring with offset.

**Sizes.** Same at base, md, lg.

**Strings.** `t('app.skipToContent')`.

**Accessibility.** `<a href="#main">`, first element in `<body>`'s tab order (E2E-A11Y-02). No transition.

**data-testid.** `skip-link`.

**Don't.** Don't show it permanently; don't use `display:none` (it must stay focusable).

---

## 2. Header

**Purpose.** Identifies the app and holds the read-aloud toggle. Quiet; it is not navigation.

**Anatomy.**

```
┌──────────────────────────────────────────────────────┐
│ [header-actions]                  [t:app.name] [mark]  │
│ end: ReadAloudToggle               start: home link   │
└──────────────────────────────────────────────────────┘
──────────────────────────────────────────────────────── hairline (decorative)
```

`[mark]` = slot for the small anemone mark from D-08 (`design/brand/`); decorative, `alt=""`. Until D-08
delivers it the slot is empty (no placeholder glyph).

**Props.** None (F-06). Children: `<div data-slot="header-actions">` filled by F-08 with ReadAloudToggle.

**States.** Home link: default / hover (underline) / focus-visible (§0 ring). Current page is home →
`aria-current="page"` on the link, no visual change. Read-aloud on: header unchanged (it is already minimal).

**Tokens.**

| Part             | Token                                                                                                                |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| bar              | bg `--color-bg`; border-block-end hairline **[R-2]** `--color-border`; not sticky                                    |
| padding          | block `--space-3`; inline = page gutter (`--space-4` base, `--space-7` md, lg)                                       |
| app name         | `--font-display`, `--font-weight-display-bold`, `--text-lg`, `--leading-lg`, `--color-primary`; no underline at rest |
| mark             | block size = `--text-xl`; gap to name `--space-2`                                                                    |
| home link target | min block size `--tap-min`, inline-flex, align center                                                                |
| actions gap      | `--space-2`                                                                                                          |

**Sizes.**

|               | base                                   | md                     | lg                                      |
| ------------- | -------------------------------------- | ---------------------- | --------------------------------------- |
| layout        | one row, name at start, actions at end | same                   | same; content aligned to the full width |
| app name size | `--text-lg`                            | `--text-lg` (steps up) | `--text-xl`                             |

At 320–360 the name may wrap to two lines; the actions never shrink below `--tap-min`.

**Icons.** None (the mark is a brand image, not Lucide).

**Strings.** `t('app.name')`.

**Accessibility.** `<header>` (banner landmark, exactly one). Home link `<a href="#/">` with accessible name
`t('app.name')`. The app name is not an `h1` (each page owns its `h1`).

**data-testid.** None.

**Don't.** No tagline, no stats, no menu button, no icon-only actions, no sticky header (it would eat reading
space in the car).

---

## 3. BottomNav

**Purpose.** Primary navigation on phones and tablets, within thumb reach.

**Anatomy.** Four equal items, start → end (right → left):

```
┌──────────────────────────────────────────────────────────┐
│                                                ▔▔▔▔▔▔▔▔   │ (active indicator, block-start edge)
│  (Info)      (LocateFixed)      (Route)      (House)      │
│ [t:nav.about] [t:nav.whereAmI] [t:nav.tour] [t:nav.home]  │
│                                                           │
│ ░░░░░░░░░░░░░░ safe-area inset ░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└──────────────────────────────────────────────────────────┘
  end                                                  start
```

**Props.** None (F-06). Items: home `#/`, tour `#/tour`, where-am-i `#/tour?locate=1`, about `#/about`.

**States.**

| State                           | Rendering                                                                                                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| default                         | icon + label `--color-ink-muted`, `--font-weight-regular`                                                                                                                                                                                  |
| current (`aria-current="page"`) | icon + label `--color-primary`, label `--font-weight-semibold`, plus an indicator line at the item's block-start edge: accent width **[R-2]**, `--color-primary`, inline size 50% of the item, centred. (Weight + line = not color alone.) |
| hover                           | label underlined                                                                                                                                                                                                                           |
| focus-visible                   | §0 ring around the item (offset kept; the bar must not clip it)                                                                                                                                                                            |
| active (press)                  | no change beyond focus                                                                                                                                                                                                                     |
| on `/tour` or `/tour?locate=1`  | both are the same page: **המסלול** is current; "איפה אני" is never marked current (it is an entry point to an action, not a page)                                                                                                          |

Selecting "איפה אני" never calls geolocation; it opens `/tour?locate=1`, where the page focuses the
`where-am-i` button (F-14).

**Tokens.**

| Part           | Token                                                                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| bar            | `position: fixed; inset-inline: 0; inset-block-end: 0`; bg `--color-surface`; border-block-start hairline **[R-2]** `--color-border`; `--shadow-card` |
| bottom padding | `env(safe-area-inset-bottom)` added to `--space-1`                                                                                                    |
| layout         | 4 equal columns (`grid-template-columns: repeat(4, 1fr)`)                                                                                             |
| item           | flex column, centred; gap `--space-1`; padding block `--space-2`; min block size `--tap-min` (actual ≈ icon + label + padding, above the minimum)     |
| icon           | size `md` **[R-1]**                                                                                                                                   |
| label          | `--font-body`, `--text-xs`, `--leading-xs`; one line, may wrap to two at 320                                                                          |

**Sizes.**

|                          | base                                  | md                                   | lg                                                        |
| ------------------------ | ------------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| shown                    | yes                                   | yes                                  | **no** (`display: none` at lg and up; SideNav takes over) |
| max inline size of items | full width                            | items centred within `--content-max` | —                                                         |
| label size               | `--text-xs`                           | `--text-xs` (steps up)               | —                                                         |
| read-aloud               | unchanged (navigation is not reading) | unchanged                            | —                                                         |

**Icons.** `House`, `Route`, `LocateFixed`, `Info` (size `md`, no mirroring).

**Strings.** `t('nav.label')` (landmark name), `t('nav.home')`, `t('nav.tour')`, `t('nav.whereAmI')`,
`t('nav.about')`.

**Accessibility.** `<nav aria-label={t('nav.label')}>` > `<ul>` > `<li>` > `<a>`. Accessible name of each link
= its visible label. In the DOM after Footer (so reading order is content first) — tab order follows DOM.
Hidden at lg with `display:none` (removed from the accessibility tree, so the shared label with SideNav is
never duplicated).

**data-testid.** `bottom-nav` (on the `<nav>`).

**Don't.** No badges or counters on items, no icon-only items, no hide-on-scroll motion, no fifth item.

---

## 4. SideNav

**Purpose.** On desktop / landscape tablet: the route as an ordered station list plus the same four links,
always visible beside the reading column.

**Anatomy.**

```
┌──────────────────────────────┐
│          [t:nav.home] (House) │  the same 4 links as BottomNav
│          [t:nav.tour] (Route) │
│ [t:nav.whereAmI] (LocateFixed)│
│          [t:nav.about] (Info) │
│ ──────────────────────────── │  hairline (decorative)
│         [t:tour.title] (Route)│  h2, visually small
│ ProgressStepper variant=compact│  see tour.md §3
└──────────────────────────────┘
```

**Props.** None (F-06 reads `getStations()` and `getVisited()`; current station from the route param).

**States.** Link states as BottomNav (current = `--color-primary` + semibold + indicator line at the
**inline-start** edge, accent width **[R-2]**, full item block size). Station items: see ProgressStepper
(tour.md §3) — default / visited / current.

**Tokens.**

| Part         | Token                                                                                                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| column       | inline size **[R-4]**; bg `--color-bg`; border-inline-end hairline **[R-2]** `--color-border` (the edge facing the content)                                                                                |
| position     | `position: sticky; inset-block-start: 0; max-block-size: 100dvh; overflow-y: auto` (focus ring must stay visible: padding inline `--space-4` so rings are not clipped)                                     |
| padding      | block `--space-6`, inline `--space-4`                                                                                                                                                                      |
| link item    | flex row, gap `--space-2`, min block size `--tap-min`, padding inline `--space-3`, radius `--radius-md`; text `--text-sm`, `--color-ink` (default), `--color-primary` + `--font-weight-semibold` (current) |
| hover        | bg `--color-surface`, label underlined                                                                                                                                                                     |
| section gap  | `--space-6` between the links and the station list                                                                                                                                                         |
| list heading | `--font-body`, `--font-weight-semibold`, `--text-sm`, `--color-ink-muted`; margin-block-end `--space-2`                                                                                                    |

**Sizes.** base and md: not rendered visible (`display: none` below lg). lg and xl: shown as above.

**Icons.** `House`, `Route`, `LocateFixed`, `Info` (size `md`); `Route` beside the list heading (size `sm`).

**Strings.** `t('nav.label')`, `t('nav.home')`, `t('nav.tour')`, `t('nav.whereAmI')`, `t('nav.about')`,
`t('tour.title')`; station items per ProgressStepper.

**Accessibility.** `<nav aria-label={t('nav.label')}>` containing a `<ul>` of links and an `<h2>` + `<ol>`
station list. Current page link `aria-current="page"`; current station item `aria-current="page"` (here it
is a page link; ProgressStepper on the tour page uses `"step"`). DOM order: before `<main>`.

**data-testid.** `side-nav` (on the `<nav>`).

**Don't.** No collapse/expand animation, no percentages, no "n of 7 done" summary.

---

## 5. Footer

**Purpose.** Quiet end of every page: sources, about, last review date.

**Anatomy.**

```
┌──────────────────────────────────────────┐
│   [t:nav.about]   [t:nav.sources] (BookOpen) │  two quiet links
│                [t:about.lastReview {date}] │  caption
└──────────────────────────────────────────┘
```

**Props.** None (F-06; `date` = `getTour().lastContentReview`).

**States.** Links: Button `quiet` (default / hover underline / focus ring).

**Tokens.** bg `--color-bg`; border-block-start hairline **[R-2]** `--color-border`; padding block
`--space-7`; padding inline = page gutter; links row gap `--space-4`, wraps; caption `--text-xs`,
`--leading-xs`, `--color-ink-muted`, margin-block-start `--space-3`. The date is wrapped in `<bdi>`.

**Sizes.**

|            | base                                              | md   | lg                                                                         |
| ---------- | ------------------------------------------------- | ---- | -------------------------------------------------------------------------- |
| layout     | links in one row (wrap allowed), caption below    | same | spans full width under both columns; content aligned to the reading column |
| read-aloud | kept and unchanged (it is below the reading flow) | same | same                                                                       |

Below lg the Footer sits above the reserved bottom space, so it is never covered by the bars.

**Icons.** `BookOpen` (size `sm`) on the sources link.

**Strings.** `t('nav.sources')`, `t('nav.about')`, `t('about.lastReview', { date })`.

**Accessibility.** `<footer>` (contentinfo, exactly one). Links are `<a>` with visible names.

**data-testid.** None.

**Don't.** No social links, no copyright clutter, no anemone mark here.

---

## 6. OfflineIndicator

**Purpose.** States plainly whether the tour is saved on the device and whether there is a connection.

**Anatomy.** In the banner slot (page frame item 3):

```
┌──────────────────────────────────────────────┐
│                     [t:offline.now] (WifiOff) │   offline state
└──────────────────────────────────────────────┘
┌──────────────────────────────────────────────┐
│ [t:common.close]           [t:offline.ready] │   ready state (once)
└──────────────────────────────────────────────┘
```

**Props.** None (F-12; reads `useOnlineStatus()` and the PWA `offlineReady` event).

**States.**

| State                                     | Rendering                                                                                                                           |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| online, not yet ready                     | nothing rendered; the live region element still exists (empty)                                                                      |
| ready (first time the precache completes) | `t('offline.ready')` + quiet close button `t('common.close')`. Stays until closed or the next route change. Shown once per session. |
| offline                                   | `WifiOff` + `t('offline.now')`. Stays while offline; no close button. Replaces "ready" if both apply.                               |
| back online                               | the offline line disappears (fade out `--duration-base`, instant under reduced motion); nothing else is announced                   |

**Tokens.** Panel: bg `--color-surface`; hairline **[R-2]** `--color-border`; radius `--radius-md`; padding
block `--space-3`, inline `--space-4`; margin block `--space-3` inside the page gutter; text `--text-sm`,
`--leading-sm`, `--color-ink`; icon `sm` **[R-1]** `--color-ink-muted`; gap `--space-2`. Close button: Button
`quiet`.

**Sizes.** base: full width of the gutter; md: same; lg: aligned to the reading column (max `--content-max`).

**Icons.** `WifiOff`.

**Strings.** `t('offline.now')`, `t('offline.ready')`, `t('common.close')`.

**Accessibility.** Container `role="status"` (implicit `aria-live="polite"`); never moves focus. The close
button is a real `<button>`.

**data-testid.** `offline-indicator` (on the status container; present and visible whenever offline —
E2E-OFF-01).

**Don't.** No red, no alarm icon, no overlay, never covers content, never steals focus.

---

## 7. UpdatePrompt

**Purpose.** Offers to load a new version without ever reloading under the visitor (ADR-005).

**Anatomy.** In the banner slot, below OfflineIndicator:

```
┌────────────────────────────────────────────────────────┐
│                                     [t:update.available] │
│           [t:common.close]  ┌───────────────────────────┐ │
│                             │ [t:update.reload] (RefreshCw) │
│                             └───────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

**Props.** None (F-12; `needRefresh` and `updateServiceWorker` from `vite-plugin-pwa`).

**States.** Hidden (nothing rendered) / shown / dismissed (hidden until the next app start). Pressing
`update.reload` calls `updateServiceWorker(true)`; while it runs the button is `busy` with the same label (no
spinner).

**Tokens.** Panel as OfflineIndicator, plus: text `--text-base`; actions row margin-block-start `--space-3`,
gap `--space-4`; reload = Button `secondary` with `RefreshCw`; dismiss = Button `quiet`.

**Sizes.** base: actions stack if they do not fit at 320; md and lg: one row; lg aligned to the reading column.

**Icons.** `RefreshCw` (size `md`, never mirrored).

**Strings.** `t('update.available')`, `t('update.reload')`, `t('common.close')`.

**Accessibility.** Text in `role="status"`; buttons follow it in DOM. Never moves focus, never a dialog.

**data-testid.** `update-prompt` (on the panel).

**Don't.** No modal, no auto-reload, no countdown to reload.

---

## 8. Sticky prev/next bar (station pages)

**Purpose.** Large, labelled previous/next controls in thumb reach on phones and tablets, essential for the
passenger reading aloud in the car (P4, P7).

**Anatomy.** Fixed directly above the BottomNav:

```
┌──────────────────────────────────────────────────────────┐
│ ┌───────────────────────────┐ ┌──────────────────────────┐│
│ │ (ChevronRight↻) [t:station.next] │ │ [t:station.prev] (ChevronLeft↻) ││
│ │              {next.title} │ │             {prev.title} ││
│ └───────────────────────────┘ └──────────────────────────┘│
└──────────────────────────────────────────────────────────┘
  end = next                                  start = previous
```

`↻` = mirrored with `rtl:scale-x-[-1]`, so "previous" points right (toward start) and "next" points left.
The second line is the neighbouring station's `title` from content (`--text-xs`; it wraps to a second line
if needed and is never truncated).

**Props.** `prev?: Station`; `next?: Station` (from `getPrevStation` / `getNextStation`, F-15);
`placement: 'sticky' | 'inline'`.

**States.**

| State                   | Rendering                                                                                                                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| middle station          | two Button `secondary` links of equal width                                                                                                                  |
| first station (no prev) | prev slot empty; next keeps the end half (it does not stretch, so its position is predictable)                                                               |
| last station (no next)  | next slot shows the non-interactive text `t('station.end')` (`--text-sm`, `--color-ink-muted`, centred in the slot); F-15 renders `tour.closing` in the page |
| hover / focus / active  | Button rules; focus ring must be fully visible inside the bar (bar has padding block `--space-2`, no overflow clipping)                                      |
| read-aloud on           | buttons min block size `--space-10`; label `--text-lg`                                                                                                       |

**Tokens.**

| Part    | Token                                                                                                                                                                                                     |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bar     | `position: fixed; inset-inline: 0`; `inset-block-end` = BottomNav block size **[R-4]**; bg `--color-surface`; border-block-start hairline **[R-2]** `--color-border`; `--shadow-card`; stacking **[R-3]** |
| padding | block `--space-2`; inline = page gutter                                                                                                                                                                   |
| layout  | two equal columns, gap `--space-3`                                                                                                                                                                        |
| button  | Button `secondary`, full width of its column, min block size `--space-9`, label `--text-base` semibold, second line (station title) `--text-xs` `--color-ink-muted`                                       |

**Sizes.**

|           | base                             | md                                                   | lg                                                                                                                                 |
| --------- | -------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| placement | `sticky` (fixed above BottomNav) | `sticky`, inner content max `--content-max`, centred | `inline`: rendered in flow at the end of the station content, same two-column layout, margin-block-start `--space-9`; no fixed bar |

**Icons.** `ChevronLeft` (previous), `ChevronRight` (next), size `md`, mirrored.

**Strings.** `t('station.prev')`, `t('station.next')`, `t('station.end')`. Content: `Station.title`.

**Accessibility.** Two `<a>` elements (router links). Accessible name = label + station title (e.g. "לתחנה
הבאה, {title}"), both visible. No landmark (the BottomNav is the navigation landmark). The bar is after
`<main>` content in DOM, before BottomNav; the reserved space (page frame) guarantees it never covers the last
lines of content or the Footer.

**data-testid.** `prev-station`, `next-station` (on the two links).

**Don't.** No icon-only arrows, no swipe gestures, no auto-advance, no "n / 7" progress counter in the bar.

---

## Token requests (also in `reports/D-03.md`)

| ID  | Needed for                                       | Proposal for D-02                                                                                                                     | Interim                                                             |
| --- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| R-3 | Stacking of fixed bars and the focused skip link | `--z-sticky` (prev/next bar), `--z-nav` (BottomNav), `--z-skip` (skip link)                                                           | Tailwind `z-10` / `z-20` / `z-30`                                   |
| R-4 | Layout sizes                                     | `--sidenav-width` (lg column), and two runtime-set properties `--bottomnav-size` and `--stickybar-size` for the reserved bottom space | SideNav `w-72`; runtime properties set by F-06 via `ResizeObserver` |

## Missing strings

None. (The sticky bar is intentionally not a landmark, so it needs no `aria-label` key.)
