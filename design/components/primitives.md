# Components — primitives

Status: v1 (D-03). Implemented by F-07 in `src/components/primitives/`. Every value below is a token from
`design/tokens.json`, an icon from `design/icons.md`, a key from `src/i18n/he.ts` (same keys as
`contracts/strings.he.ts`) or a test id from `docs/04_TESTING_STRATEGY.md` §6. Where a needed token does not
exist yet the spec says **[R-n]**; the requests are listed at the end of this file and in `reports/D-03.md`.
Until a request is granted, developers use the Tailwind default named in the request (never a new raw value).

How to read the sketches: every sketch is drawn RTL. The **right edge is the start side**, the left edge is
the end side. `[t:key]` = a UI string via `t('key')`. `{field}` = a content field from the JSON. `(Icon)` = a
Lucide icon from `design/icons.md`, always `aria-hidden="true"`.

---

## §0 Shared rules (apply to every component in all four files)

| Topic             | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Directions        | Logical only: inline-start / inline-end, block-start / block-end (`ps- pe- ms- me- start- end- border-s border-e rounded-s rounded-e text-start`). Never left/right.                                                                                                                                                                                                                                                                        |
| Focus ring        | Every focusable element: `outline: var(--focus-ring-width) solid var(--color-focus); outline-offset: var(--focus-ring-offset)` on `:focus-visible`. **Never remove or reduce the offset** (D-02: the ring directly on navy fails 3:1). No ancestor of a focusable element may clip it (`overflow: hidden` is banned on bars, cards and panels that contain controls; use `overflow: clip` with `overflow-clip-margin` only if unavoidable). |
| Tap targets       | Every control: min block size and min inline size `--tap-min`; at least `--space-2` between neighbouring targets. Inline text links inside `[data-inline-text]` are exempt (E2E-LAYOUT-02 helper).                                                                                                                                                                                                                                          |
| Icons             | Size `sm` or `md` per `design/icons.md` **[R-1]**. Always `aria-hidden="true"` and `focusable="false"`; always paired with visible text. Mirrored glyphs (`ChevronRight`, `ChevronLeft`, `ExternalLink`) get `rtl:scale-x-[-1]` on the `<svg>`. Icon color = `currentColor`. Gap between icon and label `--space-2`.                                                                                                                        |
| Borders           | Decorative card edge: hairline **[R-2]** in `--color-border`. Any edge that identifies a control (inputs, secondary buttons, toggles): hairline in `--color-ink-muted` or `--color-primary`, never `--color-border` (1.2:1). Accent start-border (quotes, warnings): accent width **[R-2]**, never wider.                                                                                                                                   |
| Motion            | Only opacity fades, `--duration-fast` or `--duration-base`, `--ease-standard`. Under `prefers-reduced-motion: reduce`: no transition at all. Nothing animates on its own; no spinners, no shimmer.                                                                                                                                                                                                                                          |
| Color meaning     | Never by color alone: every state also changes text, weight, an icon or a shape (border, fill, indicator line). Memorial red (`--color-accent`) only for the three uses in `design/01-principles.md`; never for buttons, links, errors, names or numbers.                                                                                                                                                                                   |
| Text              | Body `--font-body`, `--text-base`, `--leading-base`, `--color-ink`, `--font-weight-regular`. `--text-xs` / `--text-sm` only for labels and captions, never body. No italics, no all-caps, no letter-spacing. Names, titles and quotes use `--font-display`.                                                                                                                                                                                 |
| Latin and numbers | Latin text, URLs and digits next to Hebrew are wrapped in `<bdi>` (URLs `<bdi dir="ltr">`).                                                                                                                                                                                                                                                                                                                                                 |
| Read-aloud        | `html[data-read-aloud='true']` swaps `--text-base` / `--leading-base` to `--text-read` / `--leading-read`. Components that use `--text-base` grow automatically; extra read-aloud rules are listed per component.                                                                                                                                                                                                                           |
| Breakpoints       | `base` (0), `md` (`$md-min-width`), `lg` (Architecture §10). Type tokens step up at `md` automatically via the `$md` set; the size tables below only list what changes beyond that.                                                                                                                                                                                                                                                         |
| Strings           | All UI text via `t()`. Content text from content JSON. No hard-coded Hebrew.                                                                                                                                                                                                                                                                                                                                                                |

Page gutters (used by layout.md and all page sections): inline padding `--space-4` at base, `--space-7` at md
and lg. Reading column: max inline size `--content-max`; running text inside it max `--measure`.

---

## 1. Button

**Purpose.** The one action element. Four variants express importance; P2 allows one `primary` per screen.

**Anatomy.**

```
 primary / secondary / quiet                            link (inline in text)
┌───────────────────────────────┐
│        [label]  (Icon)        │                      ... running text [label] running text ...
└───────────────────────────────┘                                        ‾‾‾‾‾‾‾ underline
```

Icon sits at the start side of the label (right in the sketch), except for directional "next" (end side, see layout.md §8).

**Props** (F-07): `variant: 'primary' | 'secondary' | 'quiet' | 'link'` (default `'secondary'`);
`href?: string` (renders `<a>`; otherwise `<button type="button">`); `external?: boolean` (adds
`target="_blank" rel="noopener noreferrer"` + visually hidden `t('common.externalLink')` + `ExternalLink`
icon at the end side); `icon?: LucideIcon` (one of `design/icons.md`); `iconPosition?: 'start' | 'end'`
(default `'start'`); `fullWidth?: boolean`; `busy?: boolean`; `pressed?: boolean` (toggle buttons only →
`aria-pressed`); `onClick?: () => void`; `children` (the label, a `t()` string); `data-testid?: string`.

**States and tokens.**

| State                           | primary                                                                                                                                                                                                                                                       | secondary                                                                                                         | quiet                    | link                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------ | --------------------------- |
| default bg                      | `--color-primary`                                                                                                                                                                                                                                             | `--color-surface`                                                                                                 | transparent              | transparent                 |
| default text                    | `--color-primary-ink`                                                                                                                                                                                                                                         | `--color-primary`                                                                                                 | `--color-primary`        | `--color-primary`           |
| default border                  | none                                                                                                                                                                                                                                                          | hairline **[R-2]** `--color-primary`                                                                              | none                     | none                        |
| default decoration              | none                                                                                                                                                                                                                                                          | none                                                                                                              | none                     | underline always            |
| hover (pointer)                 | label underlined                                                                                                                                                                                                                                              | label underlined; bg `--color-bg`                                                                                 | label underlined         | underline stays (no change) |
| focus-visible                   | §0 ring (offset kept)                                                                                                                                                                                                                                         | §0 ring                                                                                                           | §0 ring                  | §0 ring                     |
| active                          | label underlined (same as hover; no scale, no shadow)                                                                                                                                                                                                         | same                                                                                                              | same                     | same                        |
| pressed (`aria-pressed="true"`) | —                                                                                                                                                                                                                                                             | bg `--color-primary`, text `--color-primary-ink` (fill change + the caller's icon/text change; never color alone) | —                        | —                           |
| busy                            | label replaced by the caller's `…` string (e.g. `t('nearby.locating')`), `aria-busy="true"`, clicks ignored, look unchanged — no spinner                                                                                                                      | same                                                                                                              | same                     | n/a                         |
| disabled                        | **Avoid.** Hide the action or explain why it is unavailable. If unavoidable: `aria-disabled="true"` (stays focusable), bg transparent, hairline **[R-2]** `--color-ink-muted`, text `--color-ink-muted`, no hover underline, plus a visible reason next to it | same                                                                                                              | text `--color-ink-muted` | not allowed                 |

All variants: font `--font-body`, `--font-weight-semibold`, `--text-base`, `--leading-sm`; radius
`--radius-md` (link: none); transition of background/opacity only, `--duration-fast`.

**Sizes.**

|                | base                                  | md          | lg          | read-aloud  |
| -------------- | ------------------------------------- | ----------- | ----------- | ----------- |
| min block size | `--tap-min`                           | `--tap-min` | `--tap-min` | `--space-9` |
| padding block  | `--space-2`                           | `--space-2` | `--space-2` | `--space-3` |
| padding inline | `--space-5`                           | `--space-6` | `--space-6` | `--space-6` |
| width          | intrinsic; `fullWidth` → 100%         | intrinsic   | intrinsic   | as base     |
| link variant   | inline, inherits font size; padding 0 | same        | same        | same        |

Labels wrap onto a second line rather than truncate; never ellipsis.

**Icons.** Any from `design/icons.md`, size `md` (`sm` for `ExternalLink`).

**Strings.** Label is passed in. Shows `t('common.externalLink')` (visually hidden) when `external`.

**Accessibility.** `<button type="button">` or `<a href>` only. Accessible name = visible label (plus the
hidden external note). Toggle buttons use `aria-pressed` and keep the same label in both states. Never
`tabindex` > 0.

**data-testid.** Passed through by the caller. Page-level buttons that use this primitive (owned by D-04 /
F-13 / F-15): `start-tour` and `resume-tour` → `primary`; `reset-progress` → `quiet`; `mark-visited` →
`secondary` with `pressed` and the `Check` icon (label switches `t('station.markVisited')` /
`t('station.unmarkVisited')`, which is a different action, not a pressed label).

**Don't.**

- Don't make an icon-only button.
- Don't use `--color-accent` for any button.
- Don't put two `primary` buttons on one screen.
- Don't animate size, position or shadow on press.

---

## 2. SectionHeading

**Purpose.** Section titles inside a page (`h2`/`h3`), optionally with a small eyebrow label above.

**Anatomy.**

```
 (optional, small, memorial red)                                  [eyebrow]
 (h2 / h3)                                           [heading text] (Icon)
 (no rule under it; whitespace only)
```

**Props** (F-07): `level: 2 | 3`; `id?: string` (for `aria-labelledby` of the section); `eyebrow?: string`
(a `t()` string); `icon?: LucideIcon` (only `Route` or `BookOpen`, per `design/icons.md`); `children`.

**States.** Static. No hover. If it contains a link (not recommended) the link uses Button `link`.

**Tokens.**

| Part                  | Token                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- |
| heading font          | `--font-display`, `--font-weight-display-bold`                                         |
| h2 size / leading     | `--text-xl` / `--leading-xl`                                                           |
| h3 size / leading     | `--text-lg` / `--leading-lg`                                                           |
| heading color         | `--color-primary`                                                                      |
| eyebrow               | `--font-body`, `--font-weight-semibold`, `--text-xs`, `--leading-xs`, `--color-accent` |
| eyebrow → heading gap | `--space-1`                                                                            |
| space above (h2)      | `--space-9` base, `--space-10` md and lg                                               |
| space above (h3)      | `--space-7`                                                                            |
| space below           | `--space-4`                                                                            |
| icon size / gap       | `md` **[R-1]** / `--space-2`, color `--color-primary`                                  |

**Sizes.** Type tokens step up at md automatically. lg same as md. Read-aloud: unchanged (headings are already
large).

**Strings.** Callers pass e.g. `t('station.background')`, `t('station.talkingPoints')`, `t('station.people')`,
`t('station.companions')`, `t('station.access')`, `t('station.sources')`, `t('person.oct7')`,
`t('person.personality.he' | 'person.personality.she')`, `t('person.past')`, `t('person.after')`,
`t('person.sources')`, `t('home.messageTitle')`, `t('home.safetyTitle')`, `t('home.howToTitle')`.

**Accessibility.** Real `<h2>` / `<h3>`; the eyebrow is a `<p>` before the heading inside the same `<header>`
of the section (not part of the heading's name). Heading levels never skip.

**data-testid.** None.

**Don't.**

- Don't use eyebrow red on more than small labels; never on the heading itself.
- Don't add dividers, ornaments or the anemone mark here (the mark is for the end of a story only, D-04).

---

## 3. DurationBadge

**Purpose.** Shows how long a station takes, quietly.

**Anatomy.**

```
                                     [formatMinutes(minutes)] (Clock)
```

**Props** (F-07): `minutes: number` (= `Station.durationMin`).

**States.** Static only.

**Tokens.** Inline-flex, gap `--space-1`; text `--font-body`, `--font-weight-regular`, `--text-sm`,
`--leading-sm`, `--color-ink-muted`; no background, no border, no pill (it is text, not a chip). Icon `Clock`
size `sm` **[R-1]**, `currentColor`.

**Sizes.** Same at base, md, lg (text-sm steps up at md automatically). Read-aloud: unchanged.

**Strings.** None from `he.ts`; the text is `formatMinutes(minutes)` (`src/lib/format.ts`), wrapped in `<bdi>`.

**Accessibility.** `<span>`; the icon is hidden; the text reads as e.g. "15 דקות". Not focusable.

**data-testid.** None.

**Don't.** Don't style it as a coloured pill or badge (looks like a score). Don't show it larger than the
station title.

---

## 4. QuoteBlock

**Purpose.** A person's quote, set in the serif with a gold start-border.

**Anatomy.**

```
 (eyebrow, gold)                                   [t:person.quote]  ┃
                                                                     ┃
 (serif, larger)                                    „{quote.text}”   ┃
 (caption)                                            — {quote.by}   ┃
                                       gold start-border (start side) ┃
```

**Props** (F-07): `quote: Quote` (`{ text, by }`); `showLabel?: boolean` (default `true`).

**States.** Static.

**Tokens.**

| Part       | Token                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| wrapper    | `<figure>`, margin block `--space-7`, padding inline-start `--space-5`, border-inline-start accent width **[R-2]** `--color-gold`, no background |
| label      | `--font-body`, `--font-weight-semibold`, `--text-xs`, `--color-gold`; margin-block-end `--space-2`                                               |
| quote text | `--font-display`, `--font-weight-display`, `--text-lg`, `--leading-lg`, `--color-ink`                                                            |
| caption    | `--font-body`, `--font-weight-regular`, `--text-sm`, `--leading-sm`, `--color-ink-muted`; margin-block-start `--space-3`                         |

**Sizes.** base/md/lg: same tokens (md steps up). Max inline size `--measure`. Read-aloud: quote text uses
`--text-xl` / `--leading-xl`.

**Strings.** `t('person.quote')` (label). Quote marks `„ ”` and `— ` are the markup from F-07; quote text and
`by` verbatim from content.

**Accessibility.** `<figure>` > `<blockquote>` + `<figcaption>` (CT-QUOTE-01). The label is a `<p>`
inside the figure, before the blockquote, `aria-hidden="true"` is NOT used (it is real text).

**data-testid.** None.

**Don't.** Don't use italics. Don't put the gold on the quote text (5.5:1 < 7:1). Don't use a giant decorative
quote glyph.

---

## 5. PhotoFrame

**Purpose.** The person's photo slot: a calm placeholder until the family clears a photo.

**Anatomy.**

```
 pending                                       cleared
┌─────────────────────────────┐               ┌─────────────────────────────┐
│                             │               │                             │
│   [t:photo.pending]         │ (centred)     │          <img>              │
│                             │               │                             │
└─────────────────────────────┘               └─────────────────────────────┘
                                                     [t:photo.credit {credit}]
```

**Props** (F-07): `photo: Photo`; `name: string` (`Person.name`; not shown, kept for the cleared `<figure>`
`aria-label` fallback if `alt` were ever empty — schema requires `alt`, so in practice unused).

**States.**

| State                          | Rendering                                                                                                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pending`                      | `<div data-testid="photo-placeholder">` with the text only. **No `<img>`, no silhouette, no initials, no icon.**                                                                               |
| `cleared`                      | `<figure>`: `<img src={photo.src} alt={photo.alt} loading="lazy" decoding="async">` + `<figcaption>` credit. Explicit `width`/`height` attributes from the aspect ratio to avoid layout shift. |
| `cleared`, image fails to load | Same box as pending but the text is the `alt`. No retry loop.                                                                                                                                  |

`photo.referenceUrl` is never read (Conventions §1.3).

**Tokens.**

| Part                | Token                                                                                         |
| ------------------- | --------------------------------------------------------------------------------------------- |
| box (both states)   | aspect ratio 4 / 3; radius `--radius-lg`                                                      |
| pending bg / border | `--color-bg`; hairline **[R-2]** `--color-border` (decorative)                                |
| pending text        | `--font-body`, `--text-sm`, `--leading-sm`, `--color-ink-muted`, centred, padding `--space-5` |
| image               | `object-fit: cover`; no filter, no overlay, no shadow                                         |
| credit              | `--text-xs`, `--leading-xs`, `--color-ink-muted`; margin-block-start `--space-2`              |

**Sizes.**

|              | base               | md                                                    | lg          |
| ------------ | ------------------ | ----------------------------------------------------- | ----------- |
| inline size  | 100% of the column | max `calc(var(--content-max) / 2)`, at the start side | same as md  |
| margin block | `--space-6`        | `--space-7`                                           | `--space-7` |

**Strings.** `t('photo.pending')`, `t('photo.credit', { credit })`.

**Accessibility.** Pending: plain text, not `role="img"` (nothing to describe). Cleared: meaningful `alt` from
content. Not focusable.

**data-testid.** `photo-placeholder` (pending only).

**Don't.** No grey person silhouette, no initials avatar, no blur, no stock image, no anemone mark inside it.

---

## 6. SourceList

**Purpose.** The list of sources for a person or station: honest, readable, external.

**Anatomy.**

```
 (caller-owned SectionHeading)  [t:person.sources | t:station.sources] (BookOpen)
 ┌──────────────────────────────────────────────────┐
 │                     (ExternalLink) {source.title} │  one link = one tap target
 │                          www.example-host.co.il   │  host name, <bdi dir="ltr">
 └──────────────────────────────────────────────────┘
                                 next item (gap --space-2) …
```

(`example-host` is a sketch placeholder, not content.)

**Props** (F-07): `sources: Source[]`.

**States.** Link default / hover (underline already on; hover adds bg `--color-bg`) / focus-visible (§0 ring)
/ visited (same color — no purple). Empty array → render nothing (caller omits the heading).

**Tokens.**

| Part      | Token                                                                                                          |
| --------- | -------------------------------------------------------------------------------------------------------------- |
| list      | `<ul>`, no bullets, gap `--space-2`                                                                            |
| item link | block, min block size `--tap-min`, padding block `--space-2`, padding inline `--space-2`, radius `--radius-sm` |
| title     | `--font-body`, `--font-weight-semibold`, `--text-base`, `--leading-base`, `--color-primary`, underline         |
| host      | `--text-xs`, `--leading-xs`, `--color-ink-muted`, `overflow-wrap: anywhere`                                    |
| icon      | `ExternalLink`, size `sm` **[R-1]**, mirrored, end side of the title                                           |

**Sizes.** Same at all breakpoints; max inline size `--measure`.

**Strings.** `t('common.externalLink')` visually hidden inside each link. The heading key is the caller's.

**Accessibility.** Each item is one `<a href target="_blank" rel="noopener noreferrer">` wrapping the title and
the host line; accessible name = title + host + external note. URL host text in `<bdi dir="ltr">`
(CT-SRC-01). The "publisher" of CT-SRC-01 is part of `source.title` in content (e.g. "(ynet)"); there is no
separate field.

**data-testid.** None.

**Don't.** Don't shorten or rewrite titles. Don't show favicons or brand logos.

---

## 7. Markdown (typography)

**Purpose.** Renders content Markdown (body, background, opening, oct7, …) with the booklet's typography.

**Anatomy.**

```
 <div data-inline-text>
            ………………………………………………………… paragraph
      paragraph with **bold** and an inline [link](…)
                                          list item •
                                          list item •
 </div>
```

**Props** (F-07): `children: string` (Markdown source); `variant?: 'body' | 'read'` (default `'body'`; `'read'`
is used for the `s30` read-aloud block and drive segments).

**States.** Static; links per Button `link`.

**Tokens.**

| Element          | Token                                                                                                                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| wrapper          | max inline size `--measure`; `--color-ink`                                                                                                                                                                                                     |
| `p`              | `--font-body`, `--font-weight-regular`, `--text-base`, `--leading-base`; margin-block-end `--space-4` (last child 0)                                                                                                                           |
| `strong`         | `--font-weight-semibold` (no color change)                                                                                                                                                                                                     |
| `ul` / `ol`      | padding-inline-start `--space-6`; margin-block-end `--space-4`; `li` margin-block-end `--space-2`; `ul` markers `disc` in `--color-ink-muted`, `ol` markers decimal                                                                            |
| `a`              | Button `link` variant (inline, `--color-primary`, underline); external → `target="_blank" rel="noopener noreferrer"` + visually hidden `t('common.externalLink')`                                                                              |
| `variant="read"` | `p`: `--text-read`, `--leading-read`, `--font-weight-regular`; paragraph gap `--space-5`. Optional wrapper: bg `--color-surface`, hairline **[R-2]** `--color-border`, radius `--radius-lg`, padding `--space-5` (base) / `--space-6` (md, lg) |

Elements not in this table (`h1`–`h6`, `img`, `table`, raw HTML) are not rendered as such: headings are
rendered as `p` with `--font-weight-semibold`; images and raw HTML are dropped (CT-MD-01).

**Sizes.** base/md/lg via tokens; lg same as md. Read-aloud mode enlarges automatically through `--text-base`.

**Strings.** `t('common.externalLink')`.

**Accessibility.** Plain semantic `p`, `ul`, `ol`, `li`, `strong`, `a`. The wrapper carries `data-inline-text`
so inline links are exempt from the tap-target check; they still get the focus ring.

**data-testid.** None.

**Don't.** No italics for `em` (render `em` as `--font-weight-semibold`). No drop caps. Never change content
text, quote marks or line breaks.

---

## 8. ShareButton

**Purpose.** Lets a visitor share the current page; secondary, never prominent.

**Anatomy.**

```
                                     ┌───────────────────────────┐
                                     │ [t:share.button] (Share2) │
                                     └───────────────────────────┘
 (status line, aria-live)        [t:share.copied | t:share.failed]
```

**Props** (F-07): none (uses `document.title` and `location.href`).

**States.**

| State        | Rendering                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| idle         | Button `secondary` with `Share2`; status line empty (but present in the DOM)                                                    |
| native share | `navigator.share({ title, url })`; no status text (the OS sheet is the feedback); user-cancel → back to idle silently           |
| copied       | status `t('share.copied')` for 3 seconds (F-07), then empty; the text fades out `--duration-base`, instant under reduced motion |
| failed       | status `t('share.failed')`, stays until the next press                                                                          |

**Tokens.** Button `secondary` tokens. Status line: `--text-sm`, `--leading-sm`, `--color-ink-muted`,
margin-block-start `--space-2`, min block size of one line (reserved, so nothing shifts).

**Sizes.** base: Button not full width; md, lg same.

**Icons.** `Share2`, size `md`.

**Strings.** `t('share.button')`, `t('share.copied')`, `t('share.failed')`.

**Accessibility.** `<button type="button">`; status line `<p role="status" aria-live="polite">`. Focus stays on
the button.

**data-testid.** `share-button` (on the button).

**Don't.** No share counts, no social-network logos, no toast pop-up.

---

## Token requests (also in `reports/D-03.md`)

| ID  | Needed for             | Proposal for D-02 (values for the token owner to decide)                                                                                                                         | Interim                          |
| --- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| R-1 | Icon sizes `sm` / `md` | `--icon-sm`, `--icon-md` (already proposed by `design/icons.md`, not in `tokens.json`)                                                                                           | Tailwind `size-5` / `size-6`     |
| R-2 | Border widths          | `--border-width-hairline` (cards, controls) and `--border-width-accent` (gold/red start-borders, active-nav indicator; at most the thin-line limit in `design/01-principles.md`) | Tailwind `border` / `border-s-4` |

(Layout-level requests R-3 and R-4 are in `layout.md`.)

## Missing strings

None for this file.
