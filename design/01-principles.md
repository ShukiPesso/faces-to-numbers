# 01 — Design principles and tone

Every design and UI task follows this page; `docs/03_CONVENTIONS.md` wins any conflict. Hebrew strings below
are illustrative — final wording belongs to D-07.

## Purpose

פנים למספרים is a memorial companion that people hold while standing where others were murdered, or while
reading aloud in a moving car. Its design must feel like a quiet, well-printed memorial booklet that happens to
live in a phone: it serves the people's names and the facts, and then gets out of the way.

## Emotional tone

| We ARE | We are NOT |
|---|---|
| quiet | dramatic |
| dignified | sentimental |
| plain | flashy |
| steady | urgent ("breaking news") |
| warm | playful |

## Principles

**P1 — The person is the headline.** A name (with rank and `הי״ד` exactly as in content) is the largest, first
thing on any screen about a person; numbers are secondary body text.
- Do (Person page): `h1` = full name + honorific in the display serif; the subtitle line beneath in body size.
- Don't (Station page, Nova): a large stat block with the death toll above or bigger than the person card.

**P2 — One message per screen, one action per moment.** Each screen has a single primary action; everything
else is secondary or quiet.
- Do (Home): one primary button ("להתחיל את המסלול" / "להמשיך מאיפה שעצרתם"); about and sources as quiet links.
- Don't (Home): a grid of six equal tiles competing for the first tap.

**P3 — The visitor chooses how much to carry.** Depth (30 שניות / 2 דקות / 5 דקות) and graphic passages are
always the visitor's choice, and "less" is a respected answer, never a lesser one.
- Do (Person page, a person with `oct7Sensitivity: graphic`): the `ContentWarningGate` shows a calm label and
  two equal buttons — open, or skip to the next section.
- Don't (Person page): a blurred teaser of the graphic text, or a skip link styled smaller/greyer than "open".

**P4 — Never ask the driver to look.** Drive segments are built for a passenger reading aloud; the driver gets
nothing to read or tap.
- Do (Drive segment): `DriveBanner` with the driver warning first, then large read-aloud text and big
  prev/next controls at the bottom.
- Don't (Drive segment): turn-by-turn prompts, countdowns, "you are approaching" pop-ups, or anything that
  changes on screen by itself.

**P5 — Silence is a designed state, not an empty one.** The moment of silence gets its own calm layout and is
started only by a tap.
- Do (Silence moment, Nova station): the station's prompt text, one "start" button, then a still screen with
  a static "שקט" label (no running digits) and an "end" button always available.
- Don't (Silence moment): a ticking digital countdown, a sound or vibration at the end, or a "well done" line
  afterwards.

**P6 — Finishing is quiet.** Progress is information, never reward.
- Do (Tour overview): visited stations marked with a plain check icon + the text "ביקרתם"; after the last
  station, a short closing text and a link to sources.
- Don't (Tour overview / last station): percentages, "7/7 completed", badges, confetti, or congratulatory copy
  (Conventions §1.4).

**P7 — Legible in the sun, by anyone.** Light theme, ≥ 18 px body (≥ 22 px read-aloud), ≥ 7:1 body contrast,
every icon paired with a text label, tap targets ≥ 44×44 within thumb reach.
- Do (Station page, mobile): sticky bottom bar with "הקודם" / "הבא" as labelled buttons.
- Don't (Station page): icon-only arrows in the top corner, or light-grey body text.

**P8 — Honest about what we don't know.** Unverified or missing information is stated plainly, not hidden or
faked.
- Do (Station page, unverified location): the line "המיקום בבדיקה" and no navigation buttons.
- Don't (Station page): a guessed map pin, or a disabled "Waze" button with no explanation; a stock photo
  standing in for a person (Person page shows the `PhotoFrame` placeholder).

## Pacing and silence

- Generous vertical space between sections; at most one card-width idea per screen height on mobile.
- After the most painful passage on a page, leave space before the next heading; do not follow it with a
  button or a bright element.
- Nothing interrupts reading: `NearbyBanner` and `UpdatePrompt` appear only in their reserved slot, never
  slide over text and never steal focus.
- The silence moment uses the station's own seconds and prompt; the screen stays still until the visitor ends
  it or time runs out, and the end is marked only by a soft text change.

## Typography attitude

Typography carries the hierarchy, not color or decoration. Two families only: a dignified Hebrew serif (Frank
Ruhl Libre) for names, page titles and quotes; a clean Hebrew sans (Assistant) for body and UI. Few sizes, few
weights, no thin weights for body text, no all-caps or letter-spaced Hebrew, no italics for emphasis (use
weight). Quotes keep their Hebrew quotation marks exactly as in content and are set in the serif with a gold
start-border. Read-aloud mode enlarges text and line-height and removes chrome; it never changes wording.

## Color attitude

Paper and ink do almost all the work; navy marks headings and the primary action; gold frames quotes and
personal-story blocks (borders and labels only).

**Memorial red is allowed only for:**
1. the anemone mark;
2. the label and start-border of the driver warning (`DriveBanner`) and of the `ContentWarningGate`;
3. small section labels (eyebrow text above a section heading).

Always as text or thin lines (≤ 4 px), never as a fill larger than the mark, never for buttons, links, names,
numbers or error states, and never as the only carrier of meaning. No dark theme in MVP; no black backgrounds
for "serious" screens.

## Motion rules

- Only fades and very small position shifts; every transition ≤ 200 ms (`--duration-base`), ease-standard.
- Motion only confirms what the visitor did (tab change, gate opened); nothing moves on its own.
- No bounce, spring, parallax, pulsing, shimmer skeletons, or animated counters.
- `prefers-reduced-motion: reduce` → no transitions at all; state changes are instant.
- No vibration, ever. No sound unless a future audio feature is explicitly tapped.

## Imagery rules

- No photographs of people until `photo.status === 'cleared'` (family-provided, written consent, credit).
  Until then: the calm `PhotoFrame` placeholder — no silhouettes, no initials-avatars that look like profiles.
- Never press photos, never `photo.referenceUrl` as a source (Conventions §1.3).
- No illustrations of the events: no weapons, fire, smoke, blood, vehicles, fences, captivity or map
  "explosions" (Conventions §1.6). The route map is schematic: line, dots, labels.
- The anemone mark: one small abstract mark, single color, in the logo/header, the app icon, and at most as a
  small divider at the end of a person's story. Never repeated as a pattern, never as a background, never next
  to numbers, never animated.

## Words

All UI wording follows Conventions §1.8 (calm plain Hebrew, plural `אתם`, no exclamation marks, no emoji) and
§1.4 (no congratulatory copy). Names and honorifics exactly as content (§1.7). Content is never rewritten by
design (§1.1).

## Red flags — reject the screen if any is true

- [ ] 1. A number (toll, count, percentage) is visually larger or earlier than the person's name.
- [ ] 2. Anything resembles a reward: score, badge, streak, "completed" celebration, confetti, congratulatory
  text, or a celebratory sound/animation.
- [ ] 3. Memorial red is used outside the three allowed uses, or as a large fill / alarm-style banner.
- [ ] 4. Dark dramatic theme, "breaking news" styling, or red-alert aesthetics.
- [ ] 5. Any photo of a person that is not cleared, any press photo, or any image/illustration of violence,
  weapons, fire or captivity.
- [ ] 6. A drive segment without the driver warning, or with anything that changes or asks for attention by
  itself.
- [ ] 7. Something moves, plays, vibrates or pops up without a tap; any transition > 200 ms; motion not
  disabled under reduced-motion.
- [ ] 8. A graphic passage visible without passing the `ContentWarningGate`, or "skip" made weaker than "open".
- [ ] 9. Body text < 18 px (< 22 px in read-aloud), body contrast < 7:1, an icon-only action, or a tap
  target < 44×44.
- [ ] 10. Any wording, name, honorific, fact or quote differs from `content-source/`, or UI copy uses an
  exclamation mark, emoji, or singular/gendered address instead of `אתם`.
