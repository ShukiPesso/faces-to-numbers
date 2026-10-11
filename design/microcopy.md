# Microcopy — UI strings review (D-07)

Scope: values in `src/i18n/he.ts` only. Keys are identical to `contracts/strings.he.ts`; every `{placeholder}`
is kept. No content about people or stations was touched. 18 of 105 values changed; the rest were reviewed and
kept as they are.

## Changed strings

| Key                          | Old value                                                | New value                                                           | Reason                                                                                                                                                               |
| ---------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app.skipToContent`          | דילוג לתוכן                                              | לדלג לתוכן                                                          | Rule 3: actions in the infinitive.                                                                                                                                   |
| `station.navigateWaze`       | ניווט ב-Waze                                             | לנווט ב-Waze                                                        | Rule 3: button, infinitive.                                                                                                                                          |
| `station.navigateGoogle`     | ניווט ב-Google Maps                                      | לנווט ב-Google Maps                                                 | Rule 3: button, infinitive.                                                                                                                                          |
| `station.locationUnverified` | המיקום המדויק של התחנה עדיין בבדיקה. אפשר להיעזר בתיאור. | המיקום בבדיקה, ולכן אין כאן קישורי ניווט. אפשר להיעזר בתיאור התחנה. | Opens with the exact phrase from decision #10 ("המיקום בבדיקה") and explains why navigation buttons are missing (principle P8).                                      |
| `station.markVisited`        | סימון שהגענו לכאן                                        | לסמן שביקרתם כאן                                                    | Rule 3 (infinitive). Plural `אתם` instead of first-person "הגענו"; matches `tour.visited` ("ביקרתם כאן").                                                            |
| `station.unmarkVisited`      | ביטול הסימון                                             | לבטל את הסימון                                                      | Rule 3: infinitive, pairs with `station.markVisited`.                                                                                                                |
| `person.backToStation`       | חזרה לתחנה: {title}                                      | לחזור לתחנה: {title}                                                | Rule 3: infinitive; `{title}` kept.                                                                                                                                  |
| `warning.body`               | בהמשך יש תיאור של פציעה ומוות. אפשר לקרוא, ואפשר לדלג.   | הקטע הבא כולל תיאורים קשים. אפשר לקרוא אותו, ואפשר לדלג עליו.       | The gate is shared by every graphic passage; naming one kind of harm can be wrong for a given passage and is more graphic than needed. Both choices stay equal (P3). |
| `warning.skipped`            | הקטע הוסתר. אפשר לחזור אליו בכל רגע.                     | הקטע לא מוצג. אפשר להציג אותו בכל רגע.                              | Neutral state ("not shown") instead of an action done to the visitor; repeats the verb of the `warning.show` button so the way back is clear.                        |
| `silence.ended`              | תודה שעצרתם.                                             | רגע השקט הסתיים. אפשר להמשיך כשתרצו.                                | P5 and §1.4: no appraisal of the visitor after the silence; only a soft statement that it ended and the choice to continue.                                          |
| `photo.pending`              | התמונה תתווסף באישור המשפחה                              | תמונה תתווסף רק באישור המשפחה                                       | Does not promise that a photo will come; matches the rights text ("רק באישור המשפחות").                                                                              |
| `offline.ready`              | הסיור שמור במכשיר וזמין גם בלי קליטה                     | הסיור שמור במכשיר וזמין גם בלי קליטה.                               | Rule 6: a full sentence ends with a period.                                                                                                                          |
| `offline.now`                | אין כרגע חיבור. כל התוכן עדיין זמין.                     | אין כרגע חיבור. התוכן שנשמר במכשיר זמין גם עכשיו.                   | Rule 8: honest. "All content" may be false if caching did not finish.                                                                                                |
| `update.available`           | יש גרסה מעודכנת של הסיור                                 | יש גרסה מעודכנת של הסיור.                                           | Rule 6: a full sentence ends with a period.                                                                                                                          |
| `share.button`               | שיתוף                                                    | לשתף                                                                | Rule 3: button, infinitive.                                                                                                                                          |
| `notFound.home`              | חזרה לדף הבית                                            | לחזור לדף הבית                                                      | Rule 3: button, infinitive.                                                                                                                                          |
| `error.body`                 | אפשר לטעון את הדף מחדש. התוכן שמור במכשיר.               | אפשר לנסות לטעון את הדף מחדש.                                       | Rule 8: after an unknown error we cannot promise that content is saved. "לנסות" is honest that a reload may not help.                                                |
| `common.close`               | סגירה                                                    | לסגור                                                               | Rule 3: button, infinitive.                                                                                                                                          |

### Reviewed and kept on purpose

- `drive.warning` and `home.safetyTitle` / `home.howToTitle`: identical to the wording in
  `content-source/tour.md` (safety list and headings). They stay identical so the app speaks with one voice.
- `nav.whereAmI` / `nearby.button` ("איפה אני"): the content's how-to text quotes this label verbatim, so it is
  not changed even though it is first-person.
- `person.personality.he` / `.she`: gendered on purpose — they refer to the person in the story, not the reader.
- `silence.remaining` ("נותרו {seconds} שניות"): kept because the placeholder must stay. See the report about
  the static-label vs countdown question.
- Labels that name a thing rather than an action stay as nouns: `station.navigate` (group label),
  `readAloud.label`, `nav.*`, section titles.

## Style guide — 10 rules

1. **Plural address, always.** Speak to the visitors as `אתם` ("ביקרתם", "כשתרצו"). Never singular, never
   first person ("הגענו"), never gendered toward the reader. A verb about a person in the story follows that
   person's gender.
2. **Calm and plain.** Short everyday Hebrew. No slang, no drama, no urgency words ("מהר", "דחוף", "חשוב מאוד"). No exclamation marks and no emoji anywhere (§1.8).
3. **Buttons and links act in the infinitive.** "להציג", "לדלג", "לעדכן", "לשתף", "לסגור", "לחזור". Group
   labels, section titles and toggles that name a mode stay nouns ("מצב הקראה", "מקורות").
4. **Name the object when it helps.** "להציג את הקטע" / "לדלג על הקטע", not just "להציג". A short verb alone is
   fine only where the context is the whole screen ("לסיים" in the silence moment).
5. **Equal choices get equal words.** Paired options (show/skip, mark/unmark) use the same pattern and length,
   so "less" never reads as the lesser choice (P3).
6. **Punctuation.** Full sentences (body, status, error) end with a period. Buttons, labels and titles have no
   final punctuation. Use `…` only for an action in progress ("מאתרים מיקום…").
7. **Nothing celebratory, nothing that grades.** No praise, thanks-for-completing or "well done" lines, no
   counts presented as achievement (§1.4, P6). End states are stated quietly ("רגע השקט הסתיים").
8. **Honest.** Say only what the app can guarantee. Unknowns are said plainly ("המיקום בבדיקה", "לא ניתן
   לאתר מיקום כרגע"), and every dead end offers the next step ("אפשר לבחור תחנה מהרשימה").
9. **Warnings describe, they do not depict.** A content warning says that something is hard, not what the
   hard thing is in detail. It never blurs or teases the content.
10. **UI never rewrites content.** Names, honorifics, quotes and facts come from `content-source/` only.
    Where content already uses a phrase (safety lines, "איפה אני"), the UI uses the same words.
