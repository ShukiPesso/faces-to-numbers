# Page mockups (D-04) — gate G2

Responsive HTML mockups of every page and key state, with real content. They decide the look of the
whole site. Open any `.html` file in a browser (no network needed). Every page has a working
**מצב הקראה** button in the header, so you can see read-aloud mode anywhere. The depth tabs, the
content-warning buttons, the moment-of-silence buttons and the "mark visited" button also work.

**Approved by Shuki on: ____**

## Pages

| File                 | Route                   | What it shows                                                                                                                                                                                                                                                                                            |
| -------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `home.html`          | `/`                     | First visit: title, subtitle, "7 תחנות · כ-3 שעות", intro, start button, message, safety, how-to                                                                                                                                                                                                         |
| `tour.html`          | `/tour`                 | "איפה אני" (idle), the schematic map, 7 station cards. Sample progress: stations 1–3 visited, 4 is next                                                                                                                                                                                                  |
| `station-stop.html`  | `/station/reim-shelter` | Stop station: header, background, talking points, 2 people + 2 companion stories, moment of silence (idle), access, "location being checked", mark visited, sources, previous/next                                                                                                                       |
| `station-drive.html` | `/station/route-232`    | Drive segment: driver warning right under the title, then the same sections (no companions, no silence)                                                                                                                                                                                                  |
| `person-s30.html`    | `/person/roni-eshel`    | Depth "30 שניות": the short read-aloud text in a large-type box                                                                                                                                                                                                                                          |
| `person-m2.html`     | `/person/aner-shapira`  | Depth "2 דקות" with the **content-warning gate closed** (the October 7 passage is not on the page until "להציג את הקטע" is pressed)                                                                                                                                                                      |
| `person-m5.html`     | `/person/roni-eshel`    | Depth "5 דקות": the full story, quote, anemone mark at the end of the story, sources                                                                                                                                                                                                                     |
| `about.html`         | `/about`                | About text, rights, last review date                                                                                                                                                                                                                                                                     |
| `sources.html`       | `/sources`              | All sources by person (9) and by station (7)                                                                                                                                                                                                                                                             |
| `not-found.html`     | `*`                     | 404                                                                                                                                                                                                                                                                                                      |
| `states.html`        | —                       | Gallery (mockup page only): offline + "saved" banners, update prompt, all 7 "איפה אני" states, silence running and ended, gate skipped, read-aloud mode on a drive segment, home with progress (resume / start over), "mark visited" pressed, share "copied", last station ("סוף המסלול" + closing text) |

Each person file holds all three depths. The file's depth is selected, and the tabs switch between them.

Screenshots: `shots/<page>-<width>.png` at 390×844, 820×1180 and 1440×900 (33 files). They are taken with
**Chromium** (WebKit is not available in this environment) and show the whole page. The viewport is grown
to the page height so the fixed bottom bars appear once, at the bottom.

## What to look at

1. **Faces before numbers.** On station pages the person cards (name in the large serif) come after the
   short background. On person pages the name is the largest text on the screen.
2. **Memorial red** appears only in three places: the anemone mark, the driver warning and the
   content-warning label. The "תחנה 4 מתוך 7" label is grey on purpose (red is never used for numbers).
3. **Moment of silence.** "להתחיל 60 שניות של שקט" is the only primary (navy) button on the station. While
   it runs nothing on the screen changes: no countdown and no animation, only "לסיים" (your decision of 2026-10-11).
4. **Drive segment.** The warning sits right under the title, before any text to read. The previous/next
   buttons are large and labelled, at the bottom within thumb reach.
5. **Mobile vs desktop.** Below 1024 px there is a bottom navigation (בית · המסלול · איפה אני · אודות), and on
   station pages a previous/next bar above it. From 1024 px the route list moves to a side column on the
   right and previous/next appear at the end of the page.

## Open questions for Shuki

1. **ענר שפירא — quote outside the gate.** By design (ADR-007) the quote is shown at "2 דקות" and
   "5 דקות" outside the content-warning gate. This quote ("הוא הדף 10-11 רימונים. שניים אחרי שאיבד את ידו")
   contains the same hard detail the gate hides. Should graphic people's quotes go behind the gate too?
   (Content is unchanged; this is about placement only.)
2. **Start button on the home page.** It currently sits after the intro and before "לפני שיוצאים לדרך".
   Should it come after the safety notes instead? That is more careful, but it means more scrolling on a phone.
3. **Photo placeholder size.** On a phone the 4:3 frame ("תמונה תתווסף רק באישור המשפחה") takes almost a
   full screen height before the story starts. Should it be smaller or come after the story until photos are cleared?
4. **Contact.** The about text invites corrections ("נשמח שתפנו אלינו"), but the content has no contact
   e-mail (`tour.contactEmail`), so no contact line is shown.
5. **"Mark visited"** sits at the end of the station, after access and before sources. Is that the right place?

## How these files are made

`_build/build.mjs` generates every `.html` from `src/content/data/*.json` (content) and `src/i18n/he.ts`
(UI strings), so no text about a person is typed by hand. `_build/mockup.css` is inlined into each page and
uses only tokens from `../tokens.css`. Fonts (Assistant 400/600, Frank Ruhl Libre 500/700, SIL OFL) are
bundled in `fonts/`. Icons are the Lucide shapes from `design/icons.md`, inlined.

```
node design/mockups/_build/build.mjs      # regenerate the 11 HTML files
node design/mockups/_build/shoot.mjs      # 33 screenshots + no-horizontal-scroll check at 320–1440 px
```
