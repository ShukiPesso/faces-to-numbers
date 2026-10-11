# Components — tour

Status: v1 (D-03). Implemented by F-10 (cards, stepper, NavLinks, DriveBanner), F-11 (RouteMap) and F-14
(NearbyBanner wiring) in `src/components/tour/`. The shared rules in `primitives.md` §0 apply. Sketches are
RTL: **right edge = start side**. Sketch text uses fictional placeholders (Conventions §1.11).

---

## 1. StationCard

**Purpose.** One station in the tour list: order, title, subtitle, duration, kind, visited — one tap opens it.

**Anatomy.**

```
┌─────────────────────────────────────────────────────┐
│                                                ┌──┐ │
│                               {station.title}  │ 3│ │  order marker at start
│                            {station.subtitle}  └──┘ │
│     {duration} (Clock) · [t:tour.kind.stop|drive]      │
│                     [t:tour.visited] (Check)         │  only when visited
└─────────────────────────────────────────────────────┘
```

**Props** (F-10): `station: Station`; `visited: boolean`; `current?: boolean`. `total` for
`tour.stationOf` = `getTour().stationIds.length`.

**States.**

| State                                                | Rendering                                                                                                                                                                                                                   |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| default                                              | surface card, hairline border                                                                                                                                                                                               |
| visited                                              | extra line `Check` + `t('tour.visited')` in `--color-ink-muted`; marker unchanged (text + icon carry the state)                                                                                                             |
| current (the next station to visit, or the open one) | border hairline **[R-2]** `--color-primary` instead of `--color-border`, and the marker filled `--color-primary` with `--color-primary-ink` number (fill + border, never color alone: the stepper/page text also states it) |
| drive kind                                           | kind label `t('tour.kind.drive')`; no other visual difference (no vehicle glyph in the card)                                                                                                                                |
| hover                                                | title underlined; card bg stays                                                                                                                                                                                             |
| focus-visible                                        | §0 ring around the whole card link                                                                                                                                                                                          |
| active                                               | no change                                                                                                                                                                                                                   |

**Tokens.**

| Part                  | Token                                                                                                                                                                               |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| card                  | `<a>` block; bg `--color-surface`; hairline **[R-2]** `--color-border`; radius `--radius-lg`; `--shadow-card`; padding `--space-4` (base) / `--space-5` (md, lg)                    |
| layout                | grid: marker column (start) + text column; column gap `--space-4`                                                                                                                   |
| order marker          | square of `--space-8`; radius `--radius-md`; hairline **[R-2]** `--color-ink-muted`; number `--font-display`, `--font-weight-display-bold`, `--text-lg`, `--color-primary`, centred |
| title                 | `--font-display`, `--font-weight-display-bold`, `--text-lg`, `--leading-lg`, `--color-primary`                                                                                      |
| subtitle              | `--text-sm`, `--leading-sm`, `--color-ink`                                                                                                                                          |
| meta row              | margin-block-start `--space-2`; gap `--space-3`; `--text-sm`, `--color-ink-muted`; DurationBadge                                                                                    |
| visited row           | margin-block-start `--space-1`; `--text-sm`, `--color-ink-muted`; `Check` size `sm`                                                                                                 |
| list spacing (caller) | gap `--space-3` between cards                                                                                                                                                       |

**Sizes.**

|            | base                                 | md                     | lg                                        |
| ---------- | ------------------------------------ | ---------------------- | ----------------------------------------- |
| width      | full column                          | full column            | full reading column (max `--content-max`) |
| title      | `--text-lg`                          | `--text-lg` (steps up) | same as md                                |
| read-aloud | unchanged (lists are not read aloud) | same                   | same                                      |

**Icons.** `Clock` (via DurationBadge), `Check` (visited).

**Strings.** `t('tour.stationOf', { n: order, total })` (visually hidden, first in the link's name),
`t('tour.kind.stop')` / `t('tour.kind.drive')`, `t('tour.visited')`.

**Accessibility.** The whole card is one `<a href="#/station/<slug>">` (no nested interactive elements).
Accessible name order: "תחנה n מתוך total", title, subtitle, kind, duration, visited. The visible order
number is `aria-hidden="true"` (the hidden `stationOf` text replaces it). Inside a list `<ol>` owned by the
page.

**data-testid.** `station-card-<id>` (on the `<a>`; `<id>` = `station.id`).

**Don't.** No progress percentage, no "completed" ribbon, no photo, no numbers larger than the title.

---

## 2. PersonCard

**Purpose.** A person at a station: the name leads; one tap opens the story.

**Anatomy — primary.**

```
┌──────────────────────────────────────────────────────┐
│                       {person.name} {person.honorific} │  serif, largest
│                                      {person.subtitle} │
│                                                        │
│        (Markdown)                     {person.opening} │
│                                                        │
│  (secondary button link)   [t:person.toStory {name}]   │
└──────────────────────────────────────────────────────┘
```

**Anatomy — companion.** Same, with a small label first and a quieter frame:

```
┌──────────────────────────────────────────────────────┐
│                                   [t:person.companion] │  gold label
│                       {person.name} {person.honorific} │
│                                                      … │
└──────────────────────────────────────────────────────┘
```

**Props** (F-10): `person: Person`; `variant: 'primary' | 'companion'`.

**States.**

| State                       | Rendering                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| primary                     | surface card, hairline `--color-border` border, gold start-border accent width **[R-2]** `--color-gold` (personal-story frame) |
| companion                   | bg `--color-bg`; hairline `--color-border`; no gold start-border; label `t('person.companion')`                                |
| link hover / focus / active | Button `secondary` rules                                                                                                       |
| `honorific` absent          | name only, no trailing space                                                                                                   |

**Tokens.**

| Part                  | Token                                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| card                  | `<article>`; radius `--radius-lg`; padding `--space-5` (base) / `--space-6` (md, lg); `--shadow-card` (primary only)                           |
| companion label       | `--font-body`, `--font-weight-semibold`, `--text-xs`, `--color-gold`; margin-block-end `--space-2`                                             |
| name (h3)             | `--font-display`, `--font-weight-display-bold`, `--text-xl`, `--leading-xl`, `--color-ink` (primary) / `--text-lg`, `--leading-lg` (companion) |
| honorific             | same element and style as the name, separated by one space                                                                                     |
| subtitle              | `--text-sm`, `--leading-sm`, `--color-ink-muted`; margin-block-start `--space-1`                                                               |
| opening               | Markdown `body`; margin-block-start `--space-4`                                                                                                |
| link                  | Button `secondary`; margin-block-start `--space-5`                                                                                             |
| list spacing (caller) | gap `--space-5` between cards                                                                                                                  |

**Sizes.**

|            | base                            | md                     | lg              |
| ---------- | ------------------------------- | ---------------------- | --------------- |
| link       | full width                      | intrinsic width        | intrinsic width |
| name       | `--text-xl`                     | `--text-xl` (steps up) | same as md      |
| read-aloud | opening grows via `--text-base` | same                   | same            |

**Icons.** None.

**Strings.** `t('person.toStory', { name })` (with `name` = `person.name`), `t('person.companion')`.

**Accessibility.** `<article aria-labelledby>` pointing at the name heading (`<h3>`, inside the page's
`t('station.people')` / `t('station.companions')` `<h2>` sections). Only one link per card (the story
link); the name is not a second link. Name and honorific exactly as content (Conventions §1.7).

**data-testid.** `person-card-<id>` (on the `<article>`; `<id>` = `person.id`).

**Don't.** No photo or placeholder in the card (the PhotoFrame lives on the person page). No ages, numbers or
dates styled larger than the name. Companion is not "lesser": same link size, same text size for the opening.

---

## 3. ProgressStepper

**Purpose.** The route as an ordered list with visited and current states. Information, not reward (P6).

**Anatomy — `full` (tour page).**

```
       [t:tour.kind.stop]          {title}  1  ──●
                        [t:tour.visited] (Check) │
      [t:tour.kind.drive]          {title}  2  ──●
                                                 │
 (current: filled + ring)          {title}  3  ──◉
                                                 │
                                   {title}  4  ──○
                          marker and line at start
```

**Anatomy — `compact` (inside SideNav).** One line per station: marker, order, title; visited shown as the
`Check` icon after the title with its text visually hidden.

**Props** (F-10): `stations: Station[]`; `visitedIds: string[]`; `currentId?: string`;
`variant?: 'full' | 'compact'` (default `'full'`); `currentIs?: 'step' | 'page'` (default `'step'`; SideNav
passes `'page'`).

**States (per item).**

| State         | Marker                                                                                                                               | Text                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| default       | circle of `--space-6`, hairline **[R-2]** `--color-ink-muted`, bg `--color-surface`, number `--color-ink`                            | title `--color-ink`                                                     |
| visited       | same circle with `Check` (size `sm`) instead of the number, `--color-ink-muted`                                                      | `Check` + `t('tour.visited')` (full: visible; compact: visually hidden) |
| current       | filled `--color-primary`, number `--color-primary-ink`, plus an outer ring hairline `--color-primary` at `--space-1` gap (shape cue) | title `--font-weight-semibold`, `--color-primary`; `aria-current`       |
| link hover    | —                                                                                                                                    | title underlined                                                        |
| focus-visible | —                                                                                                                                    | §0 ring around the row link                                             |

The connecting line between markers: hairline **[R-2]** `--color-border` (decorative; meaning is never in the
line).

**Tokens.**

| Part                   | Token                                                                                                                                 |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| list                   | `<ol>`, no default markers; row gap `--space-1` (compact) / `--space-3` (full)                                                        |
| row                    | `<a>` grid: marker column + text; column gap `--space-3`; min block size `--tap-min`; padding block `--space-2`; radius `--radius-md` |
| order + title          | full: `--text-base`; compact: `--text-sm`; `--font-body`; order number in `<bdi>`                                                     |
| kind label (full only) | `--text-xs`, `--color-ink-muted`                                                                                                      |
| hover bg               | `--color-surface` (compact, on `--color-bg`) / `--color-bg` (full, on surface)                                                        |

**Sizes.**

|            | base        | md          | lg                               |
| ---------- | ----------- | ----------- | -------------------------------- |
| `full`     | full column | full column | reading column                   |
| `compact`  | not used    | not used    | inside SideNav (width **[R-4]**) |
| read-aloud | unchanged   | unchanged   | unchanged                        |

**Icons.** `Check` (visited). `Route` may precede the caller's heading (size `md`).

**Strings.** `t('tour.stationOf', { n, total })` (visually hidden, start of each row's name),
`t('tour.visited')`, `t('tour.kind.stop')` / `t('tour.kind.drive')` (full only).

**Accessibility.** `<ol>` > `<li>` > `<a href="#/station/<slug>">`. Accessible name: "תחנה n מתוך total,
{title}" + ", ביקרתם כאן" when visited (CT-STEP-01). `aria-current="step"` (tour page) or `"page"`
(SideNav) on the current item's link. The connecting line and markers are `aria-hidden`.

**data-testid.** None in the registry (CT-STEP-01 queries by role).

**Don't.** No "3/7", no percentage, no progress bar fill, no celebration when all are visited.

---

## 4. RouteMap (container)

**Purpose.** Frames the schematic route SVG (ADR-006): a picture of the route with each station marker as a
shortcut for pointer users. The station list below it is the full text alternative.

**Anatomy.**

```
 (SectionHeading, h2)                        [t:tour.mapTitle] (Route)
┌──────────────────────────────────────────────┐
│                                                │
│   inline SVG from design/route-map.svg (F-11)  │
│   <g id="marker-<station-id>"> wrapped in Link │
│                                                │
└──────────────────────────────────────────────┘
 (visible caption)                                   [t:tour.mapAlt]
```

**Props** (F-11): `stations: Station[]`; `visitedIds: string[]`; `currentId?: string`.

**States.**

| State                     | Rendering                                                                                                                                                                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| default                   | the SVG as designed by the map task (geometry untouched)                                                                                                                                                                          |
| visited / current markers | only through the classes defined in `design/route-map.md` (map task); they must add a shape cue (e.g. ring or check mark), not color alone, and use only `--color-primary`, `--color-ink`, `--color-ink-muted`, `--color-surface` |
| marker link hover         | marker label underlined                                                                                                                                                                                                           |
| marker link focus         | not focusable (see Accessibility)                                                                                                                                                                                                 |
| SVG missing               | caption and the list below still carry everything                                                                                                                                                                                 |

No pan, zoom, animation or route-drawing effect.

**Tokens.** `<figure>`: bg `--color-surface`; hairline **[R-2]** `--color-border`; radius `--radius-lg`;
padding `--space-4` (base) / `--space-5` (md, lg). Caption `<figcaption>`: `--text-xs`, `--leading-xs`,
`--color-ink-muted`, margin-block-start `--space-2`. SVG: inline size 100%, block size from its `viewBox`.
Each marker link has an invisible hit area (transparent circle) of at least `--tap-min` across, and
neighbouring hit areas do not overlap.

**Sizes.**

|             | base        | md          | lg                                   |
| ----------- | ----------- | ----------- | ------------------------------------ |
| inline size | full column | full column | reading column (max `--content-max`) |

**Icons.** `Route` (heading, size `md`).

**Strings.** `t('tour.mapTitle')` (heading), `t('tour.mapAlt')` (`aria-label` of the SVG and the visible
caption).

**Accessibility.** `<figure aria-labelledby="<heading id>">` > `<svg role="img" aria-label={t('tour.mapAlt')}>`
(F-11). Because `role="img"` makes its children presentational, the marker links are a **pointer-only
shortcut**: each `<a>` gets `tabindex="-1"` and `aria-hidden="true"`; keyboard and screen-reader users reach
every station through the list that follows (the text alternative `tour.mapAlt` says so). The caption is
`aria-hidden="true"` because the same text is the SVG's label.

**data-testid.** `route-map` (on the `<svg>`, per F-11).

**Don't.** No map tiles, no attack arrows or explosions, no red markers, no animated route.

---

## 5. NearbyBanner

**Purpose.** "איפה אני": on a tap only, finds the nearest verified station on the device and offers to open
it. Honest about failure.

**Anatomy.**

```
┌──────────────────────────────────────────────────────┐
│                           ┌──────────────────────────┐ │
│          where-am-i  │ [t:nearby.button] (LocateFixed) │
│                           └──────────────────────────┘ │
│  (small, always visible)              [t:nearby.privacy] │
│   ┌──────────────────────────── status (aria-live) ┐   │  nearby-banner
│   │                                [state message] │   │
│   │ (link, only in at / near)       [t:nearby.open] │   │
│ └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────┘
```

**Props** (F-12; F-14 wires it): `state: NearbyState` (from `useNearbyStation`, Architecture §6); `onLocate: () =>
void`.

**States (all 7).**

| `state`                 | Status text (in `nearby-banner`)                                   | Button                                                  | Link                                                       |
| ----------------------- | ------------------------------------------------------------------ | ------------------------------------------------------- | ---------------------------------------------------------- |
| `idle`                  | empty (region present, nothing to announce)                        | enabled, label `t('nearby.button')`                     | —                                                          |
| `locating`              | `t('nearby.locating')`                                             | `busy` (`aria-busy="true"`, clicks ignored), same label | —                                                          |
| `denied`                | `t('nearby.denied')`                                               | enabled (retry)                                         | —                                                          |
| `unavailable`           | `t('nearby.unavailable')`                                          | enabled (retry)                                         | —                                                          |
| `done` + `kind: 'at'`   | `t('nearby.at', { title })`                                        | enabled                                                 | Button `primary` `t('nearby.open')` → `#/station/<slug>`   |
| `done` + `kind: 'near'` | `t('nearby.near', { title, distance: formatDistance(distanceM) })` | enabled                                                 | Button `secondary` `t('nearby.open')` → `#/station/<slug>` |
| `done` + `kind: 'none'` | `t('nearby.none')`                                                 | enabled                                                 | —                                                          |

The privacy line `t('nearby.privacy')` is visible in **every** state, directly under the button and before
the status region, so the promise is read before the first tap.

`title` = `station.title` (content), wrapped in `<bdi>` with `--font-weight-semibold`; `distance` in `<bdi>`.
Failure states use the same ink and panel as success — no red, no warning icon (errors are not alarms).

**Tokens.**

| Part         | Token                                                                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| panel        | bg `--color-surface`; hairline **[R-2]** `--color-border`; radius `--radius-lg`; padding `--space-5`; `--shadow-card`                                         |
| button       | Button `secondary` with `LocateFixed`; full width at base                                                                                                     |
| status       | margin-block-start `--space-3`; `--text-base`, `--leading-base`, `--color-ink`; min block size one line (reserved, so the panel does not jump between states) |
| link         | margin-block-start `--space-3`                                                                                                                                |
| privacy line | margin-block-start `--space-2`; `--text-xs`, `--leading-xs`, `--color-ink-muted`                                                                              |
| state change | status text fades in `--duration-fast`; instant under reduced motion                                                                                          |

**Sizes.**

|        | base        | md          | lg             |
| ------ | ----------- | ----------- | -------------- |
| button | full width  | intrinsic   | intrinsic      |
| panel  | full column | full column | reading column |

**Icons.** `LocateFixed` (size `md`).

**Strings.** `t('nearby.button')`, `t('nearby.privacy')`, `t('nearby.locating')`, `t('nearby.at')`,
`t('nearby.near')`, `t('nearby.none')`, `t('nearby.denied')`, `t('nearby.unavailable')`, `t('nearby.open')`.

**Accessibility.** The panel is a plain `<div>` inside the tour page (no landmark, no own heading). Button `<button type="button">` (`data-testid="where-am-i"`). Status container `<div
role="status" aria-live="polite">` (`data-testid="nearby-banner"`) — always in the DOM so changes are
announced. Focus stays on the button after locating; it is never moved to the result. When the page is
opened with `?locate=1`, F-14 focuses the button and scrolls it into view, **without** calling locate
(E2E-GEO-05).

**data-testid.** `where-am-i` (button), `nearby-banner` (status container).

**Don't.** Never locate on load, never watch position, never show coordinates, no map pin, no "you are
approaching" pop-ups, no red for denied.

---

## 6. NavLinks

**Purpose.** External navigation to a station — only when its location is verified; otherwise an honest
sentence (P8).

**Anatomy — verified.**

```
 (group label)                                          [t:station.navigate]
┌──────────────────────────────────────────────────────────┐ ┌──────────────────────────────────────────────────────┐
│ (ExternalLink↻) [t:station.navigateGoogle] (Navigation) │ │ (ExternalLink↻) [t:station.navigateWaze] (Navigation) │
└──────────────────────────────────────────────────────────┘ └──────────────────────────────────────────────────────┘
```

**Anatomy — unverified or `null`.**

```
 (one plain paragraph, no links)                  [t:station.locationUnverified]
```

**Props** (F-10): `location: GeoPoint | null`.

**States.**

| State                                       | Rendering                                                                                      |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `location?.verified === true`               | two Button `secondary` `external` links, hrefs `wazeUrl(location)` / `googleMapsUrl(location)` |
| `location === null` or `verified === false` | paragraph `t('station.locationUnverified')`; **no** links, no disabled buttons                 |
| hover / focus / active                      | Button rules                                                                                   |

**Tokens.** Group label: `--font-body`, `--font-weight-semibold`, `--text-sm`, `--color-ink`, margin-block-end
`--space-2`. Links row: gap `--space-3`. Unverified paragraph: `--text-base`, `--leading-base`, `--color-ink`
(important information — not muted), max `--measure`.

**Sizes.**

|       | base                | md                                        | lg      |
| ----- | ------------------- | ----------------------------------------- | ------- |
| links | stacked, full width | one row, intrinsic width (wrap if needed) | one row |

**Icons.** `Navigation` (size `md`, not mirrored) at the start of each link; `ExternalLink` from Button
`external`.

**Strings.** `t('station.navigate')`, `t('station.navigateWaze')`, `t('station.navigateGoogle')`,
`t('station.locationUnverified')`, `t('common.externalLink')`.

**Accessibility.** Verified: `<div role="group" aria-labelledby="<label id>">` with the label as a `<p id>`;
two `<a target="_blank" rel="noopener noreferrer">`. Unverified: `<p>`.

**data-testid.** `nav-waze`, `nav-google` (links), `location-unverified` (paragraph).

**Don't.** No brand logos or brand colors. No guessed coordinates. No disabled-looking buttons.

---

## 7. DriveBanner

**Purpose.** The driver warning at the top of every drive segment (P4, Conventions §1.9).

**Anatomy.**

```
┌─────────────────────────────────────────────────┃
│                         [t:drive.warning]  (Car) ┃  red start-border (start side)
│                                                   ┃
└─────────────────────────────────────────────────┃
```

**Props** (F-10): none.

**States.** One state. Not dismissible, not sticky, not animated; always the first element of a drive
station's content (F-15 step 3).

**Tokens.**

| Part   | Token                                                                                                                                                                                        |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| panel  | bg `--color-warning-bg`; border-inline-start accent width **[R-2]** `--color-accent`; radius `--radius-md` on the end side only (`rounded-e`); padding block `--space-4`, inline `--space-5` |
| icon   | `Car`, size `md`, `--color-accent` (part of the warning label, allowed use 2)                                                                                                                |
| text   | `--font-body`, `--font-weight-semibold`, `--text-lg`, `--leading-lg`, `--color-ink`                                                                                                          |
| gap    | icon–text `--space-3`                                                                                                                                                                        |
| margin | block-end `--space-6`                                                                                                                                                                        |

**Sizes.**

|            | base                             | md          | lg             |
| ---------- | -------------------------------- | ----------- | -------------- |
| width      | full column                      | full column | reading column |
| read-aloud | text `--text-xl`, `--leading-xl` | same        | same           |

**Icons.** `Car` (accepted as a UI glyph for drive segments; `TriangleAlert` is not added here so the
banner stays calm with one glyph).

**Strings.** `t('drive.warning')`.

**Accessibility.** `<div role="note">` (CT-DRIVE-01); not a live region, not an alert.

**data-testid.** `driver-warning`.

**Don't.** No red fill, no flashing, no countdown, no "approaching" messages, nothing that changes by itself.

---

## Missing strings

None.
