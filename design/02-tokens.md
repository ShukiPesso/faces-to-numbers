# 02 — Design tokens

Source of truth: `design/tokens.json` (flat map of CSS variable name to value) and `design/tokens.css`
(same names and values). Light theme only. Starting palette from `docs/05_DESIGN_BRIEF.md` §4; **no
palette value had to change**. Four new tokens beyond the required list were added (`--font-weight-*`,
`--focus-ring-*`); the JSON also carries `$md-min-width`, `$md` and `$readAloud` (override sets that the CSS
expresses as a media query and an `html[data-read-aloud='true']` block).

## Fonts and weights (4 weights in total)

| Family | Role | Weights | Token |
|---|---|---|---|
| Assistant (`@fontsource/assistant`) | body, UI | 400, 600 | `--font-weight-regular`, `--font-weight-semibold` |
| Frank Ruhl Libre (`@fontsource/frank-ruhl-libre`) | names, titles, quotes | 500, 700 | `--font-weight-display`, `--font-weight-display-bold` |

No thin weights. Emphasis is by weight, never italics. All four weights exist as `hebrew` subset woff2 files in
the installed packages. Fallback stacks: `--font-body` (Assistant, Heebo, Arial Hebrew, Arial, Noto Sans
Hebrew, system-ui) and `--font-display` (Frank Ruhl Libre, David Libre, Times New Roman, Noto Serif Hebrew,
Georgia); only the first family of each is bundled, the others are system fallbacks.

## Type scale (rem, 16px root)

| Step | Base (360+) | Leading | md+ (768+) | Leading md+ |
|---|---|---|---|---|
| xs | 0.875rem (14) | 1.4 | 0.9375rem (15) | 1.4 |
| sm | 1rem (16) | 1.5 | 1.0625rem (17) | 1.5 |
| **base (body)** | **1.125rem (18)** | 1.65 | 1.1875rem (19) | 1.7 |
| lg | 1.25rem (20) | 1.5 | 1.375rem (22) | 1.5 |
| xl | 1.5rem (24) | 1.35 | 1.75rem (28) | 1.3 |
| 2xl | 1.75rem (28) | 1.3 | 2.125rem (34) | 1.25 |
| 3xl | 2.125rem (34) | 1.2 | 2.75rem (44) | 1.15 |

xs and sm are for labels and captions only, never body. Read-aloud: `--text-read` 1.375rem (22px),
`--leading-read` 1.75; `html[data-read-aloud='true']` sets `--text-base`/`--leading-base` to them and
`body` to the same size and leading.

## Other tokens

Space 4px base: `--space-1` 0.25rem (4) ... `--space-12` 6rem (96), steps 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96.
Radius 4 / 8 / 12px. `--shadow-card` `0 1px 2px rgba(27,27,31,.06)`. Motion 150ms / 200ms,
`--ease-standard` `cubic-bezier(.2,0,0,1)`. Layout `--measure` 68ch, `--content-max` 720px, `--tap-min` 44px.
Focus ring: `outline: var(--focus-ring-width) solid var(--color-focus); outline-offset: var(--focus-ring-offset)`
(3px, offset 2px).
`--focus-ring` is a shorthand for the first two parts, `3px solid var(--color-focus)`: use
`outline: var(--focus-ring); outline-offset: var(--focus-ring-offset)`. The offset stays separate and must
never be dropped (Conventions §5 `--focus-ring` maps to this).

### Added for D-03 (R-1 to R-4)

| Token | Value | Use |
|---|---|---|
| `--icon-sm` / `--icon-md` | 20px / 24px | Lucide icon sizes (stroke 1.75 to 2) |
| `--border-width-hairline` | 1px | card and control borders |
| `--border-width-accent` | 4px | gold/red start-borders, active nav/tab indicator (the thin-line limit in `01-principles.md`) |
| `--z-sticky` / `--z-nav` / `--z-skip` | 10 / 20 / 30 | sticky prev/next bar / BottomNav / focused skip link |
| `--sidenav-width` | 18rem (288px) | SideNav column at lg and up |
| `--bottomnav-size`, `--stickybar-size` | 4rem, 4.5rem (fallbacks) | reserved bottom space; **set at runtime by layout code** (F-06, from the measured height of the bars) on the root element, which overrides these fallbacks |


## Contrast table

Method: WCAG 2.x. Channel `c/255` linearized as `c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4`;
`L = 0.2126 R + 0.7152 G + 0.0722 B`; ratio `(Lhi + 0.05) / (Llo + 0.05)`. Script: the throwaway
`contrast.js` used for this table (not committed; the formula above reproduces it). Minimum: 7 for body text
and headings, 4.5 for other text, 3 for focus ring and non-text lines.

| Pair (foreground on background) | FG | BG | Ratio | Min | Result |
|---|---|---|---|---|---|
| ink on bg (body) | #1B1B1F | #FAF8F4 | 16.19 | 7 | pass |
| ink on surface (body) | #1B1B1F | #FFFFFF | 17.17 | 7 | pass |
| ink on warning-bg (body) | #1B1B1F | #FBEFEA | 15.24 | 7 | pass |
| ink on accent-soft (body) | #1B1B1F | #F7E6E3 | 14.21 | 7 | pass |
| ink on gold-soft (body) | #1B1B1F | #F6EDD3 | 14.69 | 7 | pass |
| primary on bg (headings, links) | #1F3864 | #FAF8F4 | 10.95 | 7 | pass |
| primary on surface | #1F3864 | #FFFFFF | 11.62 | 7 | pass |
| primary-ink on primary (button label) | #FFFFFF | #1F3864 | 11.62 | 7 | pass |
| ink-muted on bg (secondary) | #595959 | #FAF8F4 | 6.60 | 4.5 | pass |
| ink-muted on surface | #595959 | #FFFFFF | 7.00 | 4.5 | pass |
| ink-muted on warning-bg | #595959 | #FBEFEA | 6.22 | 4.5 | pass |
| ink-muted on gold-soft | #595959 | #F6EDD3 | 6.00 | 4.5 | pass |
| accent (red) on bg (labels, small text) | #9E1B1B | #FAF8F4 | 7.54 | 4.5 | pass |
| accent on surface | #9E1B1B | #FFFFFF | 8.00 | 4.5 | pass |
| accent on warning-bg | #9E1B1B | #FBEFEA | 7.10 | 4.5 | pass |
| accent on accent-soft | #9E1B1B | #F7E6E3 | 6.62 | 4.5 | pass |
| gold on bg (labels) | #7F6000 | #FAF8F4 | 5.54 | 4.5 | pass |
| gold on surface | #7F6000 | #FFFFFF | 5.87 | 4.5 | pass |
| gold on gold-soft | #7F6000 | #F6EDD3 | 5.03 | 4.5 | pass |
| focus vs bg | #1A5FB4 | #FAF8F4 | 5.93 | 3 | pass |
| focus vs surface | #1A5FB4 | #FFFFFF | 6.29 | 3 | pass |
| focus vs warning-bg | #1A5FB4 | #FBEFEA | 5.58 | 3 | pass |
| focus vs gold-soft | #1A5FB4 | #F6EDD3 | 5.38 | 3 | pass |
| focus vs accent-soft | #1A5FB4 | #F7E6E3 | 5.20 | 3 | pass |
| accent thin line (start-border) vs bg | #9E1B1B | #FAF8F4 | 7.54 | 3 | pass |
| gold thin line (quote border) vs bg | #7F6000 | #FAF8F4 | 5.54 | 3 | pass |

Rules that follow from the table:
- `ink-muted` reaches only 6.6:1 on bg, so it is for secondary text (captions, metadata) and never body text.
- Red and gold are for labels and thin lines; red passes 4.5:1 on every background above, including small
  eyebrow labels, but stays within the three uses in `design/01-principles.md`.
- Gold is not used for body text (it is 5.5:1, below 7).
- Focus ring: the ring itself is blue and must sit on the page background (offset 2px). Directly against a
  navy primary button it would be 1.85:1 (fail), so **never remove the offset**; the gap shows bg/surface, and
  the ring contrasts with that gap at 5.9:1 or better.
- `--color-border` (#E7E2D8) is 1.22:1 on bg and 1.29:1 on surface. It is a decorative card edge only and is
  not a UI-component boundary. Form inputs and any control whose edge identifies it must use `--color-ink-muted`
  (6.6:1) as border color, not `--color-border`.
