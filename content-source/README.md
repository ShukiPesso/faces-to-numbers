# content-source — the canonical content

Everything a visitor reads about a person, a station or the tour comes from these files **and nowhere else**. The JSON in `src/content/data/` is generated from them by `npm run content:build` — never edit the JSON by hand.

**Who may edit these files:** Shuki, or the orchestrator applying a correction Shuki approved. Agents: read-only (Conventions §1, §2.2).

This is the **site edition**. It differs from the printed guide edition only as logged in `CORRECTIONS.md`. The verification status of every quote and key fact is tracked in `VERIFICATION.md` — items marked `TO VERIFY` must be checked against the original article (task C-02) before public launch.

---

## File layout
```
content-source/
├── tour.md
├── stations/NN_<station-id>.md     # NN = order, 01..07
└── people/NN_<person-id>.md        # NN = order, 01..09
```

## File format (strict — the converter and the integrity tests depend on it)

```markdown
---
<YAML front matter — fields per type, see tables below>
---

# Any human-readable title (IGNORED by the parser)

## <Hebrew label> · <fieldKey>
<section body>

## <Hebrew label> · <fieldKey>
<section body>
```

Rules:
1. A section starts at a line beginning with `## ` and ending with ` · <fieldKey>` (space, middle dot U+00B7, space, key). The Hebrew label before ` · ` is for humans only.
2. A section body is every line until the next `## ` line or end of file, with leading/trailing blank lines trimmed. Paragraph breaks (one blank line) are kept as `\n\n`.
3. Anything before the first `## ` (the `# ` title) is ignored.
4. Unknown `fieldKey` or a duplicate `fieldKey` → the converter fails.
5. **Text sections** (body kept verbatim as Markdown): `opening`, `oct7`, `personality`, `past`, `after`, `guideNote`, `background`, `accessNotes`, `intro`, `message`, `closing`, `about`, `rights`.
6. **Bullet sections**: every line starting with `- ` is one item; the text after `- ` is kept verbatim. Lines that don't start with `- ` are not allowed. Used by: `talkingPoints`, `safety`, `howTo`.
7. **`guideLevels`**: exactly three bullets in this order, each `- **<label>:** <text>`. Item 1 → `s30`, 2 → `m2`, 3 → `m5`. The value is the text after `:** `.
8. **`quote` / `altQuote`**: exactly two lines: `> „<text>”` then `> — <by>`. Value `{ text, by }` without the „ ” marks and without "— ".
9. **`sources`**: every line is `- <title> — <url>` (spaces around an em dash U+2014). The URL is kept exactly (Hebrew characters and `%20` included).

## Front matter — person (`people/NN_<id>.md`)
| Field | Type | Example |
|---|---|---|
| `id` | kebab-case | `roni-eshel` |
| `order` | integer = NN | `4` |
| `name` | string | `סמל רוני אשל` |
| `honorific` | string, optional | `הי״ד` |
| `pronoun` | `he` \| `she` | `she` |
| `subtitle` | string | `תצפיתנית במוצב נחל עוז · בת 19 · מצור יצחק` |
| `stationIds` | list of station ids | `[observers-hill]` |
| `oct7Sensitivity` | `standard` \| `graphic` | `standard` |
| `photoReferenceUrl` | URL, optional — **never rendered** | |
| `consent` | `not_contacted` \| `requested` \| `granted` \| `declined`, optional (default `not_contacted`) | |
| `photo` | optional `{ src, alt, credit }` — **only** with written family permission (task H-04); `src` is `/photos/<id>.webp` | `{ src: /photos/roni-eshel.webp, alt: …, credit: … }` |

Sections: `opening`*, `oct7`*, `personality`*, `past`*, `after`, `quote`*, `altQuote`, `guideLevels`*, `guideNote`, `sources`* (* = required).

Converter adds: `sourceFile` (relative path), `consent` = `{ family: <front matter value or 'not_contacted'> }`, and `photo`:
- if front matter has `photo` **and** `consent: granted` → `{ status: 'cleared', src, alt, credit, referenceUrl? }`
- otherwise → `{ status: 'pending', referenceUrl? }` (from `photoReferenceUrl`).

## Front matter — station (`stations/NN_<id>.md`)
| Field | Type |
|---|---|
| `id`, `slug` | kebab-case (same value) |
| `order` | integer = NN |
| `title`, `subtitle` | string |
| `kind` | `stop` \| `drive` |
| `durationMin` | integer |
| `radiusM` | integer 100–2000 |
| `location` | `null` **or** `{ lat, lng, verified, verifiedBy, verifiedAt, note }` |
| `personIds`, `companionPersonIds` | lists of person ids (may be empty `[]`) |
| `sensitivity` | `standard` \| `graphic` |
| `driverWarning` | boolean (must be `true` for `drive`) |
| `silenceMoment` | `null` **or** `{ seconds, prompt }` |
| `lastVerified` | `YYYY-MM-DD`, optional |

Sections: `background`*, `talkingPoints`*, `accessNotes`, `sources`.

## Front matter — tour (`tour.md`)
`id`, `title`, `subtitle`, `totalDurationMin`, `stationIds` (ordered), `lastContentReview` (`YYYY-MM-DD`), `contactEmail` (optional).
Sections: `intro`*, `message`*, `safety`* (bullets), `howTo`* (bullets), `closing`*, `about`*, `rights`*.

## Coordinates (Shuki only — task H-02)
`location` stays `null` until a point is verified on site or on a map by Shuki. Then:
```yaml
location: { lat: 31.462451, lng: 34.524394, verified: true, verifiedBy: שוקי, verifiedAt: 2026-11-01, note: חניה בצד המזרחי }
```
Latitude first. Gaza-envelope points have lat ≈ 31.2–31.7 and lng ≈ 34.3–34.8 — if your numbers look like `lat: 34.x`, they are swapped.
