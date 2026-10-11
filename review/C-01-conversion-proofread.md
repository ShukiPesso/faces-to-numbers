# C-01 — Conversion proofread: Markdown sources vs generated JSON

**Method.** An independent parser (written separately from `scripts/content/parse.ts`, applying the rules of `content-source/README.md`) rebuilt the expected JSON from each Markdown file. It was compared with the generated JSON by strict equality: every key present, no extra keys, every string character-for-character (so Hebrew punctuation `״ ׳ „ ” – —`, `**` bold markers, `\n\n` paragraph breaks, URLs, front matter values and nesting). Bullet and quote markers were stripped per the rules; labels were stripped from `guideLevels`. Source files were also scanned for CR, BOM, invisible/format characters and non-NFC text (none found). The checker was validated by seeding two deliberate changes (a stray `.` and a lost `**`) in a scratch copy; both were reported. Total fields compared: **480**.

**Result: 17 of 17 files are textually faithful. 0 content differences.** Two structural remarks (R1, R2) are listed at the end; neither changes any text.

| # | Markdown source | JSON | Fields | Result |
|---|---|---|---|---|
| 1 | `content-source/people/01_eliyahu-harosh.md` | `src/content/data/people/eliyahu-harosh.json` | 29 | OK |
| 2 | `content-source/people/02_ofir-libstein.md` | `src/content/data/people/ofir-libstein.json` | 36 | OK |
| 3 | `content-source/people/03_nitzan-libstein.md` | `src/content/data/people/nitzan-libstein.json` | 28 | OK |
| 4 | `content-source/people/04_roni-eshel.md` | `src/content/data/people/roni-eshel.json` | 32 | OK |
| 5 | `content-source/people/05_aner-shapira.md` | `src/content/data/people/aner-shapira.json` | 32 | OK |
| 6 | `content-source/people/06_hersh-goldberg-polin.md` | `src/content/data/people/hersh-goldberg-polin.json` | 30 | OK |
| 7 | `content-source/people/07_raz-peretz.md` | `src/content/data/people/raz-peretz.json` | 31 | OK |
| 8 | `content-source/people/08_awad-darawshe.md` | `src/content/data/people/awad-darawshe.json` | 29 | OK |
| 9 | `content-source/people/09_aviel-rahamim.md` | `src/content/data/people/aviel-rahamim.json` | 34 | OK |
| 10 | `content-source/stations/01_sderot.md` | `src/content/data/stations.json [sderot]` | 23 | OK |
| 11 | `content-source/stations/02_route-232.md` | `src/content/data/stations.json [route-232]` | 27 | OK |
| 12 | `content-source/stations/03_observers-hill.md` | `src/content/data/stations.json [observers-hill]` | 26 | OK |
| 13 | `content-source/stations/04_reim-shelter.md` | `src/content/data/stations.json [reim-shelter]` | 28 | OK |
| 14 | `content-source/stations/05_nova.md` | `src/content/data/stations.json [nova]` | 24 | OK |
| 15 | `content-source/stations/06_tkuma.md` | `src/content/data/stations.json [tkuma]` | 24 | OK |
| 16 | `content-source/stations/07_closing-drive.md` | `src/content/data/stations.json [closing-drive]` | 19 | OK (see R1) |
| 17 | `content-source/tour.md` | `src/content/data/tour.json` | 28 | OK |


## `content-source/people/01_eliyahu-harosh.md`
JSON: `src/content/data/people/eliyahu-harosh.json`. Sections checked: ['opening', 'oct7', 'personality', 'past', 'quote', 'guideLevels', 'sources']. Front matter fields checked.
**OK** — no differences.

## `content-source/people/02_ofir-libstein.md`
JSON: `src/content/data/people/ofir-libstein.json`. Sections checked: ['opening', 'oct7', 'personality', 'past', 'after', 'quote', 'guideLevels', 'sources']. Front matter fields checked.
**OK** — no differences.

## `content-source/people/03_nitzan-libstein.md`
JSON: `src/content/data/people/nitzan-libstein.json`. Sections checked: ['opening', 'oct7', 'personality', 'past', 'after', 'quote', 'guideLevels', 'sources']. Front matter fields checked.
**OK** — no differences.

## `content-source/people/04_roni-eshel.md`
JSON: `src/content/data/people/roni-eshel.json`. Sections checked: ['opening', 'oct7', 'personality', 'past', 'after', 'quote', 'guideLevels', 'sources']. Front matter fields checked.
**OK** — no differences.

## `content-source/people/05_aner-shapira.md`
JSON: `src/content/data/people/aner-shapira.json`. Sections checked: ['opening', 'oct7', 'personality', 'past', 'after', 'quote', 'guideLevels', 'sources']. Front matter fields checked.
**OK** — no differences.

## `content-source/people/06_hersh-goldberg-polin.md`
JSON: `src/content/data/people/hersh-goldberg-polin.json`. Sections checked: ['opening', 'oct7', 'personality', 'past', 'after', 'quote', 'guideLevels', 'sources']. Front matter fields checked.
**OK** — no differences.

## `content-source/people/07_raz-peretz.md`
JSON: `src/content/data/people/raz-peretz.json`. Sections checked: ['opening', 'oct7', 'personality', 'past', 'after', 'quote', 'guideLevels', 'guideNote', 'sources']. Front matter fields checked.
**OK** — no differences.

## `content-source/people/08_awad-darawshe.md`
JSON: `src/content/data/people/awad-darawshe.json`. Sections checked: ['opening', 'oct7', 'personality', 'past', 'after', 'quote', 'guideLevels', 'guideNote', 'sources']. Front matter fields checked.
**OK** — no differences.

## `content-source/people/09_aviel-rahamim.md`
JSON: `src/content/data/people/aviel-rahamim.json`. Sections checked: ['opening', 'oct7', 'personality', 'past', 'after', 'quote', 'altQuote', 'guideLevels', 'guideNote', 'sources']. Front matter fields checked.
**OK** — no differences.

## `content-source/stations/01_sderot.md`
JSON: `src/content/data/stations.json [sderot]`. Sections checked: ['background', 'talkingPoints', 'accessNotes', 'sources']. Front matter fields checked.
**OK** — no differences.

## `content-source/stations/02_route-232.md`
JSON: `src/content/data/stations.json [route-232]`. Sections checked: ['background', 'talkingPoints', 'accessNotes', 'sources']. Front matter fields checked.
**OK** — no differences.

## `content-source/stations/03_observers-hill.md`
JSON: `src/content/data/stations.json [observers-hill]`. Sections checked: ['background', 'talkingPoints', 'accessNotes', 'sources']. Front matter fields checked.
**OK** — no differences.

## `content-source/stations/04_reim-shelter.md`
JSON: `src/content/data/stations.json [reim-shelter]`. Sections checked: ['background', 'talkingPoints', 'accessNotes', 'sources']. Front matter fields checked.
**OK** — no differences.

## `content-source/stations/05_nova.md`
JSON: `src/content/data/stations.json [nova]`. Sections checked: ['background', 'talkingPoints', 'accessNotes', 'sources']. Front matter fields checked.
**OK** — no differences.

## `content-source/stations/06_tkuma.md`
JSON: `src/content/data/stations.json [tkuma]`. Sections checked: ['background', 'talkingPoints', 'accessNotes', 'sources']. Front matter fields checked.
**OK** — no differences.

## `content-source/stations/07_closing-drive.md`
JSON: `src/content/data/stations.json [closing-drive]`. Sections checked: ['background', 'talkingPoints', 'accessNotes']. Front matter fields checked.
**OK** — no differences. Note R1 below.

## `content-source/tour.md`
JSON: `src/content/data/tour.json`. Sections checked: ['intro', 'message', 'safety', 'howTo', 'closing', 'about', 'rights']. Front matter fields checked.
**OK** — no differences.

## Remarks (no text differs)

- **R1** `content-source/stations/07_closing-drive.md` has no `## … · sources` section. The JSON has `"sources": []`. Expected under the optional-`sources` rule; reported only because the key is present in JSON but absent in the Markdown. No text is lost.
- **R2** Key order in `stations.json` (`location` and `radiusM` after `durationMin`, `accessNotes` before `driverWarning`, `sources` last) differs from the README table order. JSON key order carries no meaning; reported for completeness only. People JSON key order matches the expected order.
- Every station and person file is covered, including `silenceMoment` and `location` (all `null` in the sources, `null` in the JSON) and `photo`/`consent` (all `pending` / `not_contacted`; `referenceUrl` equals `photoReferenceUrl` in all nine people files).
