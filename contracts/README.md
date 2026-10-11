# contracts — frozen

| File | Copied to (by task) | Purpose |
|---|---|---|
| `content.schema.ts` | `src/content/schema.ts` (P0-02) | zod schemas + inferred types for tour, stations, people |
| `strings.he.ts` | `src/i18n/he.ts` (P0-02) | every UI string key (frozen) with initial Hebrew values (D-07 may refine values only) |
| `example-person.json` | — | the exact JSON the converter must produce for `content-source/people/04_roni-eshel.md` |
| `example-station.json` | — | the exact JSON the converter must produce for `content-source/stations/04_reim-shelter.md` |

Validated on 2026-10-11: `content.schema.ts` compiles with `tsc --strict`; all 9 people, 7 stations and the tour from `content-source/` pass the schemas; `strings.he.ts` has 105 keys, no "!" and no emoji.

The two example JSON files are the acceptance oracle for task F-02 (content converter): its output for those two source files must deep-equal them.
