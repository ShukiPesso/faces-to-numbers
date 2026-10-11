# 03 — Conventions (every agent reads this, every time)

These rules override anything else, including your own habits. They are numbered so reviewers can cite them ("violates §1.2").

---

## §1 Content & ethics — the non-negotiables

This site is about real people who were murdered, fell in battle or were kidnapped. Their families may read it.

**§1.1 No invented facts.** Every fact about a person, place, number or date must come **verbatim** from `content-source/`. Do not paraphrase, summarize, "improve", shorten, merge, translate or add detail. If you think something is missing or wrong, **do not fix it** — write it under *Questions* in your report.

**§1.2 No outside research.** Do not look things up on the internet to fill gaps. The research is done; `content-source/` is the single source of truth. (Only tasks that explicitly say "research" may browse, and their output is always marked `unverified` for Shuki.)

**§1.3 Photos.** Never use `photo.referenceUrl` as an image source. Never hotlink, download or embed press photos. Show `PhotoFrame` placeholder unless `photo.status === 'cleared'`.

**§1.4 No gamification or celebration.** Forbidden anywhere: points, scores, badges, streaks, trophies, confetti, progress "achievements", congratulatory copy ("כל הכבוד", "מעולה", "הצלחתם"), celebratory sounds/animations/vibration. Finishing the route is a quiet, respectful moment.

**§1.5 No autoplay, no surprise.** No audio, video or vibration starts without a deliberate tap. No pop-ups during reading.

**§1.6 No graphic imagery.** No illustrations, icons or images depicting violence, weapons, blood, fire or captivity. Abstract and calm only.

**§1.7 Names and honorifics.** Use names, ranks and honorifics (`הי״ד`) exactly as in content. Never nicknames.

**§1.8 UI tone.** Calm, plain Hebrew, plural address (`אתם`). No exclamation marks in UI strings. No emoji in UI.

**§1.9 Driver safety.** Drive segments always show the driver warning. Never design an interaction that invites the driver to look at the screen.

**§1.10 Privacy.** No analytics, trackers, cookies or third-party requests at runtime (except the user tapping an external link). Location is used on-device only and never stored.

**§1.11 Fixtures are fictional.** Test fixtures use clearly fictional placeholders ("דמות בדיקה 1", "תחנת בדיקה א") — never real names with fake facts.

---

## §2 Scope discipline

**§2.1** Edit **only** the files listed under *Owns files* in your task. You may create new files only inside the folders your task names.
**§2.2** Read-only inputs are read-only. Never edit `contracts/`, `content-source/`, `docs/`, `backlog/`, or another task's files.
**§2.3** Do not refactor, rename, reformat or "clean up" code outside your task, even if it looks wrong. Report it instead.
**§2.4** Do not add dependencies unless your task says so (by name).
**§2.5** Do not change `src/content/schema.ts`, `src/i18n/he.ts` keys, or any exported function signature from §6 of Architecture. (Task D-07 may change `he.ts` **values** only.)

---

## §3 Code conventions

- TypeScript `strict`; no `any` (use `unknown` + narrowing); no `// @ts-ignore` (use `@ts-expect-error` with a reason, only in tests).
- React function components + hooks. One component per file; file name = component name (`StationCard.tsx`).
- Named exports only (no default exports), except where a tool requires a default (configs).
- Pure logic goes in `src/lib/` and has **no** React or DOM imports.
- Props interfaces named `<Component>Props`, declared above the component.
- No inline styles except CSS custom properties; use Tailwind classes and tokens.
- No hard-coded colors, font sizes or spacing values in components — use the token-backed Tailwind theme.
- All UI strings via `t('key')`. All content via `src/content/index.ts` getters.
- Every interactive element is a real `<button>` or `<a>` — never a clickable `<div>`.
- Add `data-testid` only where tests need it, using the names given in `docs/04_TESTING_STRATEGY.md` §6.
- Formatting: Prettier defaults + `printWidth: 100`. Lint must pass with zero warnings.

---

## §4 RTL & Hebrew

- `<html lang="he" dir="rtl">` is set once in `index.html`. Do not set `dir` elsewhere except `dir="ltr"` on URLs/code.
- Use logical Tailwind utilities only: `ms- me- ps- pe- start- end- text-start text-end border-s border-e rounded-s rounded-e`. The physical ones (`ml mr pl pr left right text-left text-right`) are banned (lint).
- Icons that imply direction (arrows, chevrons, "next/back") must be mirrored correctly: in RTL, "next" points **left**. Use the `rtl:` variant or choose the correct icon.
- Wrap Latin text, numbers mixed with Hebrew, and URLs in `<bdi>` when adjacent to Hebrew.
- Hebrew quotation marks in content (`״ ׳ „ ”`) are preserved as-is.

---

## §5 Accessibility (WCAG 2.2 AA minimum)

- Tap targets ≥ 44×44 CSS px with ≥ 8 px spacing.
- Body text ≥ 18 px on mobile; contrast ≥ 7:1 for body text, ≥ 4.5:1 for everything else.
- Visible focus ring on every focusable element (token `--focus-ring`).
- Landmarks: one `<header>`, `<nav aria-label>`, one `<main id="main">`, `<footer>`. "Skip to content" link first in tab order.
- Headings in order (one `h1` per page).
- Respect `prefers-reduced-motion`: no non-essential motion.
- Images: meaningful `alt`; decorative → `alt=""`. The route map has a text alternative (the station list).
- State changes announced via `aria-live="polite"` (nearby result, offline status, copied link).
- Never convey information by color alone.

---

## §6 Responsive

- Design and build **mobile first** (360 px). Then verify `md` (768) and `lg` (1024+) as described in Architecture §10.
- No horizontal scrolling at any width ≥ 320 px.
- Test at least: 360×740, 390×844, 820×1180, 1024×768, 1440×900.

---

## §7 Tests

- Every function in `src/lib/` has unit tests covering the cases listed in its task.
- Every component in `components/reading/` and `components/tour/` has component tests.
- Use the test IDs from `docs/04_TESTING_STRATEGY.md`; name test files `<thing>.test.ts(x)` / `<area>.spec.ts`.
- Never weaken, skip or delete an existing test to make yours pass. If an existing test is wrong, report it.
- No `test.only`, no arbitrary `waitForTimeout` in E2E (use web-first assertions).

---

## §8 Git & branches

- Branch per task: `task/<TASK-ID>` from the latest `main`.
- Conventional commits: `feat(F-07): depth tabs component`, `test(T-02): storage utils`, `docs(D-01): design principles`.
- One task = one PR. PR title = `<TASK-ID>: <task title>`. PR body = your report.
- Never force-push to `main`. Never merge your own PR — the orchestrator merges.

---

## §9 Reporting

When you finish (or stop), create `reports/<TASK-ID>.md` from `templates/REPORT_TEMPLATE.md`. It must contain: what you did, files created/changed, the exact verify commands you ran **with their output summary**, acceptance-criteria checklist (each ticked or explained), and questions/risks. A task without a report is not done.

---

## §10 Definition of Done (applies to every task)

- [ ] All acceptance criteria in the task are met.
- [ ] All verify commands in the task ran successfully; results are in the report.
- [ ] `npm run lint` and `npm run typecheck` pass (for code tasks).
- [ ] No files outside *Owns files* were modified (`git diff --name-only main` proves it).
- [ ] No rule in §1 is violated.
- [ ] Report written.

---

## §11 Escalation — when to STOP

Stop working and write your questions in the report (status `BLOCKED`) if:
- a fact you need is not in `content-source/`;
- your task conflicts with Architecture or Conventions;
- you need to edit a file you don't own, add an unlisted dependency, or change a contract;
- a dependency task's output is missing or broken;
- you have tried the same fix three times without success.

Stopping early with a clear question is a **successful** outcome. Guessing is a failure.
