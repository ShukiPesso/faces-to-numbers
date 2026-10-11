# Components — reading

Status: v1 (D-03). Implemented by F-08 (DepthTabs, ReadAloudToggle) and F-09 (ContentWarningGate,
SilenceMoment) in `src/components/reading/`. The shared rules in `primitives.md` §0 apply. Sketches are RTL:
**right edge = start side**.

---

## 1. DepthTabs

**Purpose.** Lets visitors choose how much of a person's story to carry: 30 seconds, 2 minutes or 5 minutes
(ADR-007, P3). All three are equal choices; the default is `m2`.

**Anatomy.**

```
 (visible label)                                               [t:depth.label]
┌──────────────────┬──────────────────┬──────────────────┐
│     [t:depth.m5] │ ▓▓▓ [t:depth.m2] │    [t:depth.s30] │   tablist: end ← start
└──────────────────┴──────────────────┴──────────────────┘
                     ▔▔▔▔▔▔▔▔▔▔▔ selected: filled + bar
 (only when s30 is selected; rendered in the panel by F-16)   [t:depth.s30.hint]
```

Order start → end (right → left): 30 שניות, 2 דקות, 5 דקות.

**Props** (F-08): `value: Depth`; `onChange: (depth: Depth) => void`.

**States (per tab).**

| State              | Rendering                                                                                                                                                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| unselected         | bg `--color-surface`; text `--color-primary`, `--font-weight-regular`; `aria-selected="false"`; `tabindex="-1"`                                                                                                                         |
| selected           | bg `--color-primary`; text `--color-primary-ink`, `--font-weight-semibold`; plus an inner bar at the block-end edge, accent width **[R-2]**, `--color-primary-ink` (shape cue, not color alone); `aria-selected="true"`; `tabindex="0"` |
| hover (unselected) | label underlined                                                                                                                                                                                                                        |
| focus-visible      | §0 ring around the tab (offset kept; it sits on the bg gap, never directly on navy)                                                                                                                                                     |
| change             | panel content swaps instantly; optional opacity fade-in of the panel `--duration-fast`, none under reduced motion                                                                                                                       |

**Keyboard** (CT-DEPTH-01, RTL): `ArrowLeft` → next tab (toward end), `ArrowRight` → previous, `Home` →
first (s30), `End` → last (m5); focus follows selection and calls `onChange` (persisted via `setDepth`).
Arrows do not wrap.

**Tokens.**

| Part    | Token                                                                                                                                                                               |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| label   | `--font-body`, `--font-weight-semibold`, `--text-sm`, `--leading-sm`, `--color-ink`; margin-block-end `--space-2`                                                                   |
| tablist | `display: grid; grid-template-columns: repeat(3, 1fr)`; outer hairline **[R-2]** `--color-primary`; radius `--radius-md`; gap 0; tabs separated by hairline `--color-primary`       |
| tab     | min block size `--tap-min`; padding inline `--space-3`; `--font-body`, `--text-base`, `--leading-sm`; text centred; first tab `rounded-s` / last tab `rounded-e` with `--radius-md` |
| spacing | margin-block `--space-5` around the component                                                                                                                                       |

**Sizes.**

|            | base                           | md                          | lg         |
| ---------- | ------------------------------ | --------------------------- | ---------- |
| width      | full column                    | max inline size `--measure` | same as md |
| read-aloud | tab min block size `--space-9` | same                        | same       |

**Icons.** None (the labels already say the duration).

**Strings.** `t('depth.label')`, `t('depth.s30')`, `t('depth.m2')`, `t('depth.m5')`. `t('depth.s30.hint')` is
rendered by the page inside the panel (F-16).

**Accessibility.** Visible label `<p id="depth-label">`; `<div role="tablist" aria-label={t('depth.label')}>`
(F-08) with three `<button role="tab" id="depth-tab-<key>" aria-selected aria-controls="depth-panel">`. The
page (F-16) wraps the depth content in `<div role="tabpanel" id="depth-panel"
aria-labelledby="depth-tab-<selected key>" tabindex="0">`. Roving tabindex: one tab stop for the whole
tablist.

**data-testid.** `depth-tabs` (on the `role="tablist"` element).

**Don't.** Don't label any depth as "recommended" or "full"; don't make s30 look smaller or greyer; no
sliding indicator animation.

---

## 2. ContentWarningGate

**Purpose.** Puts a graphic passage behind a calm, optional choice. Opening and skipping are equal (P3).

**Anatomy — closed.**

```
┌─────────────────────────────────────────────────────┃
│                    [t:warning.title] (TriangleAlert) ┃  red label + red start-border
│                                      [t:warning.body] ┃
│                                                       ┃
│     ┌─────────────────────┐  ┌─────────────────────┐ ┃
│     │     [t:warning.skip] │  │     [t:warning.show] │ ┃  two equal buttons
│     └─────────────────────┘  └─────────────────────┘ ┃
└─────────────────────────────────────────────────────┃
```

**Anatomy — skipped.**

```
┌─────────────────────────────────────────────────────┃
│                                   [t:warning.skipped] ┃
│                               ┌─────────────────────┐ ┃
│                               │     [t:warning.show] │ ┃
│                               └─────────────────────┘ ┃
└─────────────────────────────────────────────────────┃
```

**Anatomy — opened.** The gate panel is gone; the children render in place, with no residual chrome.

**Props** (F-09): `personId: string`; `sensitivity: Sensitivity`; `children: ReactNode`.

**States.**

| State                                                             | Rendering                                                                                              | Focus                                                                                                      |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `sensitivity === 'standard'`                                      | children only, no wrapper styling                                                                      | —                                                                                                          |
| closed (`graphic`, gate not opened this session)                  | panel with title, body, show + skip; children **not in the DOM** (not hidden, not blurred)             | unchanged                                                                                                  |
| opened (`warning-show`, or `isGateOpened(personId)` already true) | children rendered; `openGate(personId)`; optional fade-in `--duration-base`, none under reduced motion | moves to the first element of the revealed content (a wrapper with `tabindex="-1"`)                        |
| skipped (`warning-skip`)                                          | compact panel with `t('warning.skipped')` and the show button; children still not in the DOM           | moves to the next element after the gate (a sentinel with `tabindex="-1"` placed directly after the panel) |
| button hover / focus / active                                     | Button rules                                                                                           | —                                                                                                          |

**Tokens.**

| Part                | Token                                                                                                                                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| panel               | bg `--color-warning-bg`; border-inline-start accent width **[R-2]** `--color-accent`; `rounded-e` `--radius-md`; padding block `--space-5`, inline `--space-5` (base) / `--space-6` (md, lg); margin-block `--space-6` |
| title               | `--font-body`, `--font-weight-semibold`, `--text-sm`, `--leading-sm`, `--color-accent` (allowed use 2: the gate label); icon `TriangleAlert` size `md` in `--color-accent`, gap `--space-2`                            |
| body / skipped text | `--text-base`, `--leading-base`, `--color-ink`; margin-block-start `--space-2`                                                                                                                                         |
| actions             | margin-block-start `--space-5`; gap `--space-3`; **both** Button `secondary`, same size, same font, same weight                                                                                                        |

**Sizes.**

|            | base                                                             | md                                                       | lg         |
| ---------- | ---------------------------------------------------------------- | -------------------------------------------------------- | ---------- |
| buttons    | stacked, both full width (show first, skip second)               | one row, equal widths (`grid-template-columns: 1fr 1fr`) | same as md |
| panel      | full column                                                      | max `--measure`                                          | same as md |
| read-aloud | text grows via `--text-base`; buttons min block size `--space-9` | same                                                     | same       |

**Icons.** `TriangleAlert` (label only; not on the buttons).

**Strings.** `t('warning.title')`, `t('warning.body')`, `t('warning.show')`, `t('warning.skip')`,
`t('warning.skipped')`.

**Accessibility.** `<section aria-labelledby="<title id>">`; the title is a `<p id>` (a label, not a
heading — the surrounding story section already has its own heading). Buttons are `<button type="button">`. The skipped text is plain text
(not a live region; focus moving past it is the feedback). Never `aria-hidden` real content as a way of
"gating" — gated content is simply not rendered.

**data-testid.** `warning-gate` (panel, closed and skipped states), `warning-show`, `warning-skip`.

**Don't.** No blur, no teaser line of the graphic text, no "are you sure", no making skip smaller, greyer,
or a link while show is a button; no red buttons; no red fill.

---

## 3. SilenceMoment

**Purpose.** A deliberately started moment of silence at a station (P5). **Decision 2026-10-11 (Shuki): no
running countdown.** While it runs the screen does not change at all.

**Anatomy — idle.**

```
┌──────────────────────────────────────────────────┐
│                                                    │
│                [t:silence.title]                   │  serif, centred
│                                                    │
│            {silenceMoment.prompt}                  │
│                                                    │
│      ┌────────────────────────────────────┐        │
│      │ [t:silence.start {seconds}] (VolumeX) │      │  silence-start
│      └────────────────────────────────────┘        │
└──────────────────────────────────────────────────┘
```

**Anatomy — running.** Same panel, same position, same title and prompt; only the button changes:

```
┌──────────────────────────────────────────────────┐  silence-timer
│                [t:silence.title]                   │
│            {silenceMoment.prompt}                  │
│      ┌────────────────────────────────────┐        │
│      │          [t:silence.stop] (VolumeX) │        │
│      └────────────────────────────────────┘        │
└──────────────────────────────────────────────────┘
```

**Anatomy — ended.**

```
┌──────────────────────────────────────────────────┐
│                [t:silence.title]                   │
│            [t:silence.ended]                       │
└──────────────────────────────────────────────────┘
```

**Props** (F-09): `seconds: number`; `prompt: string` (= `Station.silenceMoment`).

**States.**

| State                                 | Rendering                                                                                                                                                                                                                                                       | Focus / announcement                                                                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| idle                                  | title, prompt, Button `primary` `t('silence.start', { seconds })` with `VolumeX`. Never starts by itself.                                                                                                                                                       | —                                                                                                                                           |
| running                               | panel `data-testid="silence-timer"`: title, prompt, Button `secondary` `t('silence.stop')` with `VolumeX`. **No digits, no progress bar, no ring, no pulsing, nothing changes until it ends** (one `setTimeout(seconds)`). `silence.remaining` is NOT rendered. | focus moves to the panel (`tabindex="-1"`) so an accidental second tap cannot hit "stop"; hidden status announces `t('silence.title')` once |
| ended (timer elapsed or stop pressed) | title + `t('silence.ended')` in place of prompt and button. No restart button, no thanks, no score.                                                                                                                                                             | focus moves to the ended text (`tabindex="-1"`); the status announces `t('silence.ended')` once                                             |
| transition idle → running → ended     | at most an opacity change of the button/text `--duration-base`; none under reduced motion                                                                                                                                                                       | —                                                                                                                                           |
| hover / focus / active (buttons)      | Button rules                                                                                                                                                                                                                                                    | —                                                                                                                                           |

No `<audio>`, no `navigator.vibrate`, no Wake Lock, no sound at the end (CT-SILENCE-01). The timeout is cleared
on unmount.

**Tokens.**

| Part                | Token                                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| panel               | `<section>`; bg `--color-bg`; hairline **[R-2]** `--color-border`; radius `--radius-lg`; padding block `--space-9`, inline `--space-5` (base) / `--space-7` (md, lg); margin-block `--space-10`; text centred |
| title (h2)          | `--font-display`, `--font-weight-display`, `--text-xl`, `--leading-xl`, `--color-primary`                                                                                                                     |
| prompt / ended text | `--font-display`, `--font-weight-display`, `--text-lg`, `--leading-lg`, `--color-ink`; margin-block-start `--space-4`; max `--measure`, centred                                                               |
| button              | margin-block-start `--space-7`; min block size `--space-9`                                                                                                                                                    |
| panel block size    | fixed to the idle height so running/ended never shift the page (min block size measured from idle; ended text centred within it)                                                                              |

**Sizes.**

|            | base                               | md          | lg             |
| ---------- | ---------------------------------- | ----------- | -------------- |
| panel      | full column                        | full column | reading column |
| button     | full width                         | intrinsic   | intrinsic      |
| read-aloud | prompt `--text-xl`, `--leading-xl` | same        | same           |

**Icons.** `VolumeX` (start and stop).

**Strings.** `t('silence.title')`, `t('silence.start', { seconds })`, `t('silence.stop')`, `t('silence.ended')`.
(`t('silence.remaining')` exists in `he.ts` but is intentionally not used.)

**Accessibility.** `<section aria-labelledby="<title id>">` with `<h2>` title. One visually hidden
`<p role="status" aria-live="polite">` that receives only the start and end messages. Buttons are `<button
type="button">`. Seconds in the start label are wrapped in `<bdi>`.

**data-testid.** `silence-start` (idle button), `silence-timer` (running panel).

**Don't.** No countdown or elapsed digits, no progress ring or bar, no breathing animation, no sound or
vibration, no "well done"/"thank you" after it ends, no auto-start, no dark full-screen takeover.

---

## 4. ReadAloudToggle

**Purpose.** Turns read-aloud mode on and off: larger text and more line space for a passenger reading
aloud in the car. It never changes wording.

**Anatomy.** In the Header's `header-actions` slot (end side):

```
 off                                    on
┌──────────────────────────┐          ┌──────────────────────────┐
│ [t:readAloud.label] (Volume2) │      │▓[t:readAloud.label] (Volume2)▓│  filled
└──────────────────────────┘          └──────────────────────────┘
```

**Props** (F-08): none (reads and writes `readAloud` through `PrefsProvider`).

**States.**

| State                        | Rendering                                                                                                                                                        |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| off (`aria-pressed="false"`) | Button `secondary`: bg `--color-surface`, hairline **[R-2]** `--color-primary`, text `--color-primary`, `--font-weight-regular`                                  |
| on (`aria-pressed="true"`)   | bg `--color-primary`, text `--color-primary-ink`, `--font-weight-semibold`. Non-color cues: fill vs outline, weight, and the whole page's text visibly enlarges. |
| hover                        | label underlined                                                                                                                                                 |
| focus-visible                | §0 ring (offset kept)                                                                                                                                            |
| toggling                     | `html[data-read-aloud]` set/removed (F-06/F-08); no animation of font sizes                                                                                      |

**Tokens.** Button tokens; label `--text-sm` (header space is tight at 320–360), min block size and min
inline size `--tap-min`; padding inline `--space-3`; icon `Volume2` size `md`, gap `--space-2`.

**Sizes.**

|               | base                                                                  | md   | lg   |
| ------------- | --------------------------------------------------------------------- | ---- | ---- |
| layout        | icon + label (label may wrap to two short lines at 320; never hidden) | same | same |
| read-aloud on | the toggle itself keeps `--text-sm` so the header does not grow       | same | same |

**Icons.** `Volume2` (both states; not swapped to `VolumeX`, which is reserved for the silence moment).

**Strings.** `t('readAloud.label')` (visible label, constant in both states). `t('readAloud.on')` /
`t('readAloud.off')` are announced once after each toggle in a visually hidden `role="status"` element next to
the button.

**Accessibility.** `<button type="button" aria-pressed>`; accessible name = `t('readAloud.label')` in both
states (the name never changes with the state, per ARIA toggle-button practice).

**data-testid.** `read-aloud-toggle`.

**Don't.** Don't change the label text between states, don't use a switch graphic without text, don't hide it
in read-aloud mode (it must stay reachable to turn the mode off).

---

## Missing strings

None.
