# C-05 — Second verification pass: open C-02 items vs. the official "לעד" memorial site

**Date accessed (all URLs):** 2026-10-11
**Method:** every page was opened with the WebFetch tool and asked to return the relevant sentences verbatim (Hebrew). Nothing is taken from memory or from a search snippet. Where a source could not be opened, the row says so; nothing else was tried (no curl, archives, caches or mirrors — the Wikipedia mirror hamichlol.org.il that appeared in search results was deliberately **not** used).
**Scope:** every C-02 row classified MISMATCH, NOT FOUND, COULD NOT ACCESS or MINOR. Le'ad verification was done for the five civilians named in the task. Rows for police/soldiers and stations are listed for completeness and marked *out of Le'ad scope — C-02 verdict stands*.

**Verdicts:**
- **CONFIRMED** — two independent sources that I read agree; quotes given.
- **CORRECTION PROPOSED** — exact replacement Hebrew text + sources.
- **STILL OPEN** — what would settle it.
- **REMOVE** — no source supports the sentence.

**Nothing in `content-source/` was changed.** Shuki decides.

---

## 0. Summary

| Verdict | Count |
|---|---|
| CONFIRMED | 7 (F3e, F3h*, F9b, F9d, F9g*, Q17, F13c-purpose) |
| CORRECTION PROPOSED | 14 (Q4, Q14, Q15a, Q17, Q18b, Q18c, Q18e, F3a, F3b, F3g, F4e, F9g, F12c, F13c) |
| REMOVE | 2 (F12e ״בשעת בוקר מוקדמת״, F12f ״תחבושות ביד אחת וחוסמי עורקים בשנייה״ — replacement offered) |
| STILL OPEN | 2 (F12b team fled; Q3 framing — optional) |
| Out of Le'ad scope (C-02 verdict stands) | 19 (Q7b, Q7d, Q12, Q13, Q18 others, F1, F5c, F7e, F10b–d, F10i, F10j, F11#6, S2, S7, S8, Q11 attribution) |
| Could not access (again) | 2 sources (Makor Rishon 775176; he.wikipedia הירש_גולדברג-פולין) |

\* F3h and F9g are "confirmed" in substance but the **current wording** needs a small edit — see rows.

**Two important findings that reverse or narrow C-02:**
1. **F3h — burial.** C-02 proposed changing ״נטמנו … בכפר עזה״ to Even Yehuda. Both official pages (Izkor for Ofir, Le'ad for Nitzan) and ynet (19.9.2025) say they were buried in Even Yehuda **and reinterred in Kfar Aza in September 2025**. The current text (Kfar Aza) is therefore correct today; do **not** apply C-02's Even Yehuda correction. A small wording fix is proposed.
2. **Ofir Libstein is not on Le'ad.** Le'ad (Nitzan's page) states he is ״מונצח כחלל צה"ל״; his official page is on **Izkor** (רב סמל ראשון אופיר ליבשטיין). I used it as the official source for him.

**Le'ad profile URLs (official, National Insurance Institute):**

| Person | Le'ad URL | Header as written |
|---|---|---|
| ניצן ליבשטיין | https://laad.btl.gov.il/Web/He/TerrorVictims/Page/Default.aspx?ID=43503 | „ניצן ליבשטיין ז''ל” · „בן 19 במותו” · „בכ"ב בתשרי תשפ"ד, 7/10/2023” |
| הירש גולדברג-פולין | https://laad.btl.gov.il/Web/He/TerrorVictims/Page/Default.aspx?ID=44204 | „הירש גולדברג-פולין ז''ל” · „בן 23 במותו” · „נרצח ברצועת עזה בכ"ה באב תשפ"ד (29.08.2024)” |
| עוואד דראושה | https://laad.btl.gov.il/Web/He/TerrorVictims/Page/Default.aspx?ID=43800 | „עוואד דראושה ז''ל” · „בן 23 במותו” · „התגורר באכסאל” · „בן הודא ומוסא” |
| אביאל שלום רחמים | https://laad.btl.gov.il/Web/He/TerrorVictims/Page/Default.aspx?ID=43973 | „אביאל שלום רחמים ז''ל” · „בן 27 במותו” · „התגורר במרכז שפירא” · „הובא למנוחת עולמים במשואות יצחק” |
| אופיר ליבשטיין | **not on Le'ad** — Izkor: https://www.izkor.gov.il/אופיר%20ליבשטיין/en_236149870c993591831097ff5fd04df2 | „יזכור - רב סמל ראשון אופיר ליבשטיין” · „בן 50 בנופלו” |

Le'ad's site search is an ASP.NET postback form (no query-string search), so profiles were located with web searches restricted to the domain and then opened directly. Awad's Le'ad page carries only the header data and a general paragraph about the attack — no personal narrative — so it cannot settle his open items.

---

## 1. Civilians — open items, one row each

### Ofir Libstein (official source: Izkor; Le'ad: none)

| ID | Claim as it stands in content-source | C-02 finding | What the official / second source says (verbatim) | Verdict | Proposed text |
|---|---|---|---|---|---|
| **Q3** | `past`: …מתוך אמונה שכשלתושבי עזה יהיה מה להפסיד, ״החיים של כולנו יהיו יותר טובים״ | MATCH text / MINOR framing (author is ליאור ניסקי, ynet) | Izkor: „פארק תעשייה "ארזים" משותף לעזתים ולישראלים” — no quote. Le'ad: n/a. | **STILL OPEN (optional)** — framing only; C-02's optional wording stands. Nothing new. | (C-02) …מתוך אמונה, כפי שכתב עליו מנכ״ל המועצה ליאור ניסקי, שכשלתושבי עזה ״יהיה מה להפסיד – החיים של כולנו יהיו יותר טובים״ |
| **F3a** | `oct7`: ״שבועות קודם לכן נדרשה כיתת הכוננות … להחזיר את נשקהּ לנשקייה״ | MINOR — onlife says „לפני חודשיים” | Izkor: „כאשר קיבל הודעה על חדירת מחבלים לקיבוץ, יצא מיד מביתו מצויד באקדחו לעבר הנשקייה.” — confirms the weapons were in the armory, silent on when. | **CORRECTION PROPOSED** (single source for "two months": onlife; Izkor confirms the armory itself) | כחודשיים קודם לכן נדרשה כיתת הכוננות של הקיבוץ להפקיד את נשקהּ בנשקייה |
| **F3b** | `opening`: ״יצא אל שער כפר עזה״; `oct7`: ״ואופיר הצליח, כמעט לבדו, להגיע לנשק, לצאת אל אזור השער ולפתוח באש״; guideLevels 30 s ״להגן על שער הקיבוץ״; 2 min ״היציאה אל השער״ | MISMATCH (onlife: „היחיד”); ״שער״ NOT FOUND | Izkor: „אופיר היה מהראשונים להגיע לנשקייה, הצטייד בנשק ויצא לברר דיווחים על חדירת מצנחי רחיפה.”; „הוא נתקל במחבלים ונלחם בהם בגבורה, עד אשר אירע מעצור בנשקו.”; „כמה דקות לפני השעה שבע בבוקר נורה למוות מתחת לעץ הזית סמוך לביתו.” **No gate (שער) on Izkor either.** Note the two sources differ: onlife „היחיד מכיתת הכוננות … שהצליח להגיע לנשקייה” vs Izkor „מהראשונים להגיע לנשקייה”. | **CORRECTION PROPOSED** — remove ״שער״ everywhere; use wording both sources support | `opening`: …ובבוקר המתקפה נטל נשק, יצא להגן על תושביו, ונפל. `oct7`: …ואופיר היה מהראשונים שהצליחו להגיע לנשקייה, הצטייד בנשק ונלחם במחבלים שחדרו. guideLevels 30 s: …יצא בבוקר המתקפה להגן על הקיבוץ ונפל. 2 min: …היציאה אל הנשקייה והקרב… Station 02 talkingPoint: ״יצא … להגן על הקיבוץ״. Also Nitzan `oct7` ״אביו, אופיר, יצא אל השער להילחם״ → ״אביו, אופיר, יצא להילחם״. |
| **F3e** | `past`: ״יחד עם אשתו ורד יזם גם את מיזם ״דרום אדום״״ | MINOR (onlife names a third partner) | Izkor: „יחד עם רעייתו ורד יזם וניהל את פסטיבל "דרום אדום"”. onlife (C-02): „הפרויקט האישי שלו ושל ורד וחברה נוספת- ׳דרום אדום׳”. | **CONFIRMED** (Izkor + onlife; the official page itself names only Vered) | Keep as is. (Only ״שנועד להראות את הפנים היפות של העוטף״ remains unsourced — optional drop.) |
| **F3g** | `personality`: ״עוגן רגשי״ למשפחות וחברים רבים; ביתו … ״תמיד היו צחוק, אור ושמחת חיים״ | MISMATCH (not verbatim; over-generalised) | Izkor: „"העוגן של המשפחה", כדברי יקיריו.”; „ביתם בכפר עזה היה חם ואוהב, מלא שמחה ושחוק, חברים ואורחים.” onlife (C-02): „הוא היה העוגן שלהם” (boarding-school friends); „תמיד בית שופע צחוק, מאור פנים ושמחת חיים ויצירה.” | **CORRECTION PROPOSED** — both sources use ״עוגן״ but neither says ״עוגן רגשי למשפחות״; use Izkor's verbatim phrases | ״העוגן של המשפחה״, כדברי יקיריו, וגם העוגן של חבורת חבריו; אדם עם אופטימיות מדבקת ומנהיגות טבעית. ביתו בכפר עזה היה ״חם ואוהב, מלא שמחה ושחוק, חברים ואורחים״. |
| **F3h** | Ofir `after`: ״אופיר וניצן נטמנו זה לצד זה בכפר עזה״; Nitzan `oct7`: ״הוא נטמן בכפר עזה לצד אביו״; Nitzan `after`: ״נטמנו זה לצד זה באדמת כפר עזה״; Nitzan 2 min: ״הקבורה לצד אביו – אב ובן באותה אדמה״ | MISMATCH → C-02 proposed ״בבית העלמין באבן יהודה״ | Izkor (Ofir): „הובא למנוחות בחלקה הצבאית בבית העלמין באבן יהודה.” „נטמן לצד בנו ניצן.” „בספטמבר 2025 הם הועברו למנוחת עולמים בבית העלמין בכפר עזה.” Le'ad (Nitzan): „הובא למנוחות בבית העלמין באבן יהודה, שם נטמן בחלקה הצבאית לצד אביו אופיר.” „בספטמבר 2025 שניהם הועברו למנוחת עולמים בכפר עזה.” ynet 19.9.2025 (https://www.ynet.co.il/news/article/r1axm9qoge): headline „אופיר ובנו ניצן שנרצחו ב-7/10 נטמנו בכפר עזה: "אתם חוזרים לאדמה שאהבתם"”; „השניים נקברו באופן זמני ביישוב אבן יהודה - וכעת שבו לאדמת הקיבוץ.” | **CONFIRMED** that they rest in Kfar Aza today (Izkor + Le'ad + ynet). **Do not apply C-02's Even Yehuda edit.** Small wording fix so the text is accurate about the history. | Ofir `after`: אופיר וניצן נטמנו זה לצד זה באבן יהודה, ובספטמבר 2025 הועברו למנוחת עולמים בכפר עזה. Nitzan `oct7`: …נטמן לצד אביו, ובספטמבר 2025 הועברו שניהם למנוחת עולמים בכפר עזה. Nitzan `after`: אופיר וניצן, אב ובנו, נטמנו זה לצד זה – תחילה באבן יהודה, ומספטמבר 2025 באדמת כפר עזה. Nitzan 2 min: keep (true today). |

### Nitzan Libstein (Le'ad ID=43503)

| ID | Claim | C-02 finding | Official / second source (verbatim) | Verdict | Proposed text |
|---|---|---|---|---|---|
| **Q4** | quote: „היית ילד שכולו לב, הראשון להושיט יד כשצריך עזרה. כמה שכל היה לך, כמה אומץ וכוח רצון” — ורד | MISMATCH (two non-consecutive sentences stitched; ynet has a Hapoel sentence between them) | Le'ad, introduced „אימו ורד ספדה:” — „היית ילד שכולו לב, הראשון להושיט יד כשצריך עזרה... כמה שכל היה לך, כמה אומץ וכוח רצון... תודה שהייתי אמא שלך.” — the official page makes **the same cut, marked with ellipses**. | **CORRECTION PROPOSED** — adopt the ellipsis form (identical to Le'ad; honest about the cut per ynet) | > „היית ילד שכולו לב, הראשון להושיט יד כשצריך עזרה… כמה שכל היה לך, כמה אומץ וכוח רצון” — ורד ליבשטיין, אמו |
| **F4e** | `personality`: ״חבריו כתבו עליו … אחד מהם כתב שראה בו ראש ממשלה…״; `past`: ״גרסה משופרת של עצמו, כפי שתיארו אותו״ | MINOR (onlife: written by סתיו גבאי בן שבת, relation unknown) | Le'ad, introduced only „כתבה סתיו:” — „הייתם אמורים להכיר, הוא היה אמור להיות ראש הממשלה שלנו עוד כמה שנים... או לפחות בתפקיד בכיר אחר”; „הילד שהגיע לעבוד על עצמו, ויצא גדול מהחיים, מודל משופר של עצמו.” Relation still not stated on either source. | **CORRECTION PROPOSED** (two sources agree on the words and the author's first name; relation unknown → neutral attribution) | `personality`: …נכתב עליו שהיה מיועד לגדולות – סתיו, שכתבה עליו לאחר מותו, כתבה: ״הוא היה אמור להיות ראש הממשלה שלנו עוד כמה שנים… או לפחות בתפקיד בכיר אחר״. `past`: …״מודל משופר של עצמו״, כפי שכתבה עליו סתיו. |
| (F4b/F4c re-read) | leg wound, tourniquet, bushes by the safe-room window, 12 days | MATCH in C-02 | Le'ad: „המחבלים ירו מבעד לדלת ופצעו אותו ברגלו.” „הוא עשה לעצמו חוסם עורקים והמשיך להחזיק את הדלת.” „קפץ מחלון הממ"ד ונשכב על השיחים, עד אשר נפטר מאובדן דם.” „הוא הוגדר נעדר ורק כעבור שנים-עשר יום קיבלה משפחתו את הבשורה הקשה שנרצח.” | (not open — re-confirmed) | — |

### Hersh Goldberg-Polin (Le'ad ID=44204)

| ID | Claim | C-02 finding | Official / second source (verbatim) | Verdict | Proposed text |
|---|---|---|---|---|---|
| **F9b** | `oct7`: ״מהרימונים שהמחבלים השליכו פנימה נקטעה זרועו השמאלית״; `opening` ״נפצע קשה בזרועו״; 30 s ״הרימונים קטעו את ידו״ | NOT FOUND (side + grenade cause) | Le'ad: „המחבלים השליכו רימונים למיגונית וכתוצאה מכך ידו השמאלית נקטעה מתחת למרפק.” Times of Israel (4.8.2025, https://www.timesofisrael.com/hersh-goldberg-polin-23-soccer-lover-who-dreamed-of-world-travel/): „In one of the explosions, Hersh's left arm was blown off at the elbow.” Also ynet 22.8.2024 (hjzffcns0): „הירש איבד את יד שמאל לפני שהועלה לטנדר”; Kan 741845: „כף ידו השמאלית של גולדברג-פולין חסרה”. | **CONFIRMED** (Le'ad + Times of Israel; ynet/Kan concur on the side) | Keep. Optional precision per Le'ad: ״נקטעה ידו השמאלית מתחת למרפק״. |
| **F9d** | `personality`: ״חובב טיולים שתכנן מסע ארוך בעולם״; 2 min ״אוהב טיולים״ | NOT FOUND | Le'ad: „הוא תכנן לצאת בדצמבר 2023 לטיול ארוך של שנתיים ברחבי העולם וכבר הכין הכול לקראתו.” Times of Israel: „biggest dream was to spend up to two years traveling around the world”; „he even had a plane ticket for December 27, 2023, to head to India to start his trip.” | **CONFIRMED** (Le'ad + Times of Israel) | Keep. Optional: ״תכנן לצאת בדצמבר 2023 לטיול ארוך של שנתיים ברחבי העולם״. |
| **F9g** | `after`: ״הוריו, רייצ׳ל וג׳ון … נאמו באו״ם ונפגשו עם מנהיגים, ורייצ׳ל נבחרה לאחת מ-100 האנשים המשפיעים בעולם״; 2 min ״ההשפעה הבינלאומית של הוריו״ | NOT FOUND in listed sources | Le'ad: UN — ABSENT; TIME — ABSENT; leaders — only Herzog's eulogy „מיכל ואני פגשנו את הוריך ומשפחתך פעמים רבות בשנה האחרונה”. Kan 24.4.2024 (https://www.kan.org.il/content/kan-news/defense/741845/), about Rachel: „ונאמה בפני האו"ם בניו יורק ובז'נבה”; „נבחרה לאחרונה לאחת מ-100 המשפיעים והמשפיעות בעולם ברשימה של מגזין 'Time'”. ynetnews 17.4.2024 (https://www.ynetnews.com/article/hkgr88te0): „is among Time Magazine's 100 influential people of 2024”; quoting TIME: „She has addressed the U.N. in New York City and Geneva.” | **CONFIRMED for Rachel** (Kan + ynetnews) — but the sources attribute the UN speeches to **Rachel**, not to both parents. **CORRECTION PROPOSED** to narrow the subject and add a source. | `after`: הוריו, **רייצ׳ל וג׳ון**, הפכו לקול של משפחות החטופים בעולם כולו – נפגשו עם מנהיגים, רייצ׳ל נאמה באו״ם בניו יורק ובז׳נבה ונבחרה ב-2024 לרשימת 100 האנשים המשפיעים בעולם של מגזין TIME. Add to `sources`: רייצ׳ל גולדברג-פולין ברשימת TIME (כאן) — https://www.kan.org.il/content/kan-news/defense/741845/ |
| **Q11** (spelling) | name הרש throughout | MISMATCH on stitching (handled by C-02); spelling flagged | Le'ad header: „הירש גולדברג-פולין ז''ל”. The official memorial, Hapoel Jerusalem, ynet, Kan and Maariv write **הירש**; Israel Hayom writes הרש. | **CORRECTION PROPOSED (spelling, Shuki's call)** — recommend the official spelling | `name`: הירש גולדברג-פולין; replace הרש → הירש in all sections; fix the Wikipedia `sources` link to …/wiki/הירש_גולדברג-פולין (C-02 noted the current link is dead). |
| (F9h re-read) | Rafah, five other hostages, body returned | MATCH in C-02 | Le'ad: „ב-29 באוגוסט 2024 החליטו המחבלים ששמרו במנהרה על קבוצה בת שישה חטופים ובהם הירש להימלט. לפני כן רצחו את ששת החטופים.”; „כעבור שלושה ימים, במהלך פעילות של צה"ל בשכונת תל סולטאן ברפיח, גופותיהם אותרו והוחזרו לארץ.” | (not open — re-confirmed) | — |
| (F9c re-read) | ״עלה לישראל בגיל שבע ״עטוף בדגל ישראל״״ | MATCH (hapoel) | Le'ad: „בשנת 2008, כשהיה בן שבע, עלה עם משפחתו לישראל.” (no flag — the flag phrase is Hapoel's wording, already verified by C-02) | (not open) | — |

### Awad Darawshe (Le'ad ID=43800 — header only, no narrative)

| ID | Claim | C-02 finding | Official / second source (verbatim) | Verdict | Proposed text |
|---|---|---|---|---|---|
| **Q14** | quote „במותו איחד את הכפר” — הוריו; `after` ״והוריו אמרו״ | MISMATCH (walla: father מוסא) | Le'ad: „בן הודא ומוסא” — confirms the father's name מוסא; the quote itself is absent. | **CORRECTION PROPOSED** (C-02's; Le'ad corroborates the father's name) | > „במותו הוא איחד את הכפר” — מוסא דראושה, אביו של עוואד. `after`: …ואביו מוסא אמר: ״במותו הוא איחד את הכפר.״ 2 min: same wording. |
| **Q15a** | ״דמות דומיננטית״ בכל צוות, לפי מנהלו | MINOR (speaker is אילון שפרבר, סמנכ״ל) | Le'ad: absent. | **CORRECTION PROPOSED** (C-02's; nothing new) | ״דמות דומיננטית״ בכל צוות, לפי אילון שפרבר, סמנכ״ל ״יוסי אמבולנסים״ |
| **F12b** | `opening` ״יכול היה לברוח כמו כל הצוות״; `oct7` ״חבריו לצוות הרפואי נמלטו – ועוואד בחר להישאר״; 30 s ״כשכולם ברחו״ | COULD NOT ACCESS (Makor Rishon) | Makor Rishon 775176 — **could not access again** (fetch error, 2 attempts). Le'ad: absent. AP 15.10.2023 (https://abc17news.com/ap-national/2023/10/15/an-arab-paramedic-who-treated-israelis-injured-by-hamas-militants-is-remembered-as-a-hero/): „As the scope of the Hamas attack became clear, the station's leader ordered the paramedics to evacuate.” — says the evacuation was ordered, not that the colleagues fled. bhol 16.10.2023 (Hebrew, AP-based): „הורה בעלי חברת האמבולנסים לחובשים להתפנות. דראושה סירב לעזוב.” walla (C-02): „הוא היה יכול לברוח ולנסות להציל את עצמו, אבל הוא המשיך לטפל בפצועים.” | **STILL OPEN** — only Makor Rishon could support ״כל הצוות נמלט״. Safe wording available now. | `opening`: עוואד היה פרמדיק שיכול היה לברוח – ובחר להישאר ולטפל בפצועים בנובה. `oct7`: כשפרצה המתקפה הורה מנהל חברת האמבולנסים לחובשים להתפנות – ועוואד בחר להישאר עם הפצועים. 30 s: …בחר להישאר ולטפל בפצועים אף שהורו לחובשים להתפנות – ונרצח. |
| **F12c** | `oct7`: ״הוא **האמין שהעובדה שהוא ערבי ומוסלמי תעזור לו** כשהמחבלים יגיעו״; 2 min ״שהאמין שהיותו ערבי ומוסלמי תעזור לו״ | COULD NOT ACCESS / NOT FOUND | AP (cousin מוחמד דראושה): „He felt that, as an Arab, he could somehow mediate with the attackers.”; his words as relayed: „'No, I'm not leaving. I speak Arabic, I think I can manage,'”. The Media Line 15.10.2023 (https://themedialine.org/?p=144710, independent byline): „that he could mediate due to his Arabic language skills”. bhol (Hebrew): „הוא הרגיש שכערבי הוא יכול איכשהו לתווך עם התוקפים.”; „אני מדבר ערבית, אני חושב שאני יכול להסתדר”. **״ומוסלמי״ appears in none of them.** | **CORRECTION PROPOSED** (AP + Media Line agree; drop ״ומוסלמי״; attribute to family) | `oct7`: לפי בני משפחתו, הוא האמין שכערבי דובר ערבית יוכל לתווך מול המחבלים – ״אני מדבר ערבית, אני חושב שאני יכול להסתדר״. 2 min: הוסיפו שהאמין שכערבי דובר ערבית יוכל לתווך מול המחבלים… Add to `sources`: AP, 15.10.2023 (link above). |
| **F12e** | ״הוא נרצח בשעת בוקר מוקדמת, ככל הנראה ליד במת ה-DJ״ | MATCH (stage) / NOT FOUND (time) | Le'ad: no time. AP: „Shortly after dawn on Oct. 7” (start of the attack, not his death). mako morning 6.11.2023 (brother): „כששמע שהיריות קרובות אליו הלך לבמה, התחבא ושם נהרג.” (6:00–6:30 is when the brother heard shooting, not the time of death). | **REMOVE** the time phrase; stage stays (walla + mako) | הוא נרצח ככל הנראה ליד במת ה-DJ. |
| **F12f** | `opening` ״מצאו אותו עם תחבושות ביד אחת וחוסמי עורקים בשנייה״; `oct7` ״מי שמצאו את גופתו מצאו אותו עם תחבושות ביד אחת וחוסמי עורקים בשנייה – עובד עד השנייה האחרונה״; 30 s ״מצאו אותו עם תחבושות בידיים״ | COULD NOT ACCESS (Makor Rishon only) | Makor Rishon — could not access. Le'ad, walla, remember.bio, mako, Media Line: nothing on how he was found. AP: „He was shot to death while bandaging one of the injured.”; bhol: „הוא נורה למוות בזמן שחבש את אחד הפצועים”. | **REMOVE** the "found with bandages and tourniquets" image (no readable source); **replacement offered** from AP | `opening`: …ובחר להישאר ולטפל בפצועים בנובה. הוא נורה למוות בזמן שחבש את אחד הפצועים. `oct7`: …הוא נרצח ככל הנראה ליד במת ה-DJ, בזמן שחבש את אחד הפצועים – עובד עד השנייה האחרונה. 30 s: …ונרצח בזמן שחבש פצוע. |
| (new, not open) | subtitle ״מהכפר איכסאל״ | — | Le'ad writes „התגורר באכסאל”; walla „איכסאל”. Both spellings are in use; no change proposed. Le'ad also gives his age: „בן 23 במותו” (not in our content — may be added to the subtitle). | — | optional: subtitle ״פרמדיק · בן 23 · מהכפר איכסאל · מתנדב באיחוד הצלה״ |

### Aviel Rahamim (Le'ad ID=43973)

| ID | Claim | C-02 finding | Official / second source (verbatim) | Verdict | Proposed text |
|---|---|---|---|---|---|
| **Q17** | altQuote „הוא באמת נשאר צעיר לנצח. לנצח יהיה בן 27” — **תמר רחמים, אמו**; `after` ״אמו תמר סיכמה״ | MISMATCH (mako body: said by partner תמר גולן) | Le'ad, introduced „תמר בת זוגו אמרה:” — „בפורים התחפשנו יחד לפיטר פן והוא אמר לי 'זו תחפושת בול בשבילנו, אנחנו צעירים לנצח'.” „והוא באמת נשאר צעיר לנצח.” „לנצח הוא יהיה בן 27.” Also „אביאל הכיר את בת זוגו תמר גולן בטיול בדרום אמריקה”. | **CONFIRMED** that the speaker is the partner (Le'ad + mako) → **CORRECTION PROPOSED** | altQuote: > „הוא באמת נשאר צעיר לנצח. לנצח הוא יהיה בן 27” — תמר גולן, בת זוגו של אביאל. `after`: בת זוגו תמר גולן סיכמה: ״הוא באמת נשאר צעיר לנצח. לנצח הוא יהיה בן 27.״ (Le'ad and mako body both have ״הוא״.) |
| **Q18b** | אחיו עומר: ״הוא היה החבר הכי טוב שלי״ | MINOR (mako: „הוא החבר הכי טוב שלי”) | Le'ad: absent (only „אחיו עומר סיפר שהמשפחתיות הייתה אצלו ערך ראשון”). | **CORRECTION PROPOSED** (C-02's) | ״הוא החבר הכי טוב שלי״ |
| **Q18c** | בת זוגו: ״שותפים בכל״ | MINOR (mako: „הוא שותף שלי, בכל”) | Le'ad: absent. | **CORRECTION PROPOSED** (C-02's) | …ושהיה ״שותף שלי, בכל״ |
| **Q18e** | ״במשפחה מספרים שהוא ׳תמיד היה עוצר בצד הדרך לעזור למי שתקוע עם פנצ׳ר׳״ | MINOR (mako attributes to תמר גולן) | Le'ad (profile narrative, unattributed): „הוא התנדב בארגון "ידידים" המסייע לאנשים בדרכים”; „נהג לעצור בצד הדרך ולעזור למי שתקוע עם פנצ'ר”. | **CORRECTION PROPOSED** — two options, both sourced | (a) per mako: בת זוגו תמר גולן מספרת שהוא ״תמיד היה עוצר בצד הדרך לעזור למי שתקוע עם פנצ׳ר״; or (b) per Le'ad, no attribution: הוא ״נהג לעצור בצד הדרך ולעזור למי שתקוע עם פנצ׳ר״. |
| **F13c** | `opening` ״נורה בתוך המכונית״; `oct7` ״אביאל, פצוע אנוש **בתוך הרכב**, התקשר … אחר כך **המחבלים השלימו את הריגתו**״; `past` ״פצוע בתוך רכב בצד הדרך״ | MISMATCH (mother: he got out of the car; "finished him off" unsupported by 2025 account) | Le'ad: „ברגע שהבינו את גודל הסכנה, נסעו אביאל ועידו חברו ברכב של אביאל עד שמחבלים פתחו עליהם באש.” „עידו ככל הנראה נהרג במקום ואביאל נפגע מכדור בבטן.” „כשהוא ירוי וכואב התגלתה גבורתו, כשהתקשר בכוחותיו האחרונים ליתר החברים, להזהיר אותם שיש מחבלים” „כוח של שלושה שוטרים הגיע למקום, והם דיברו איתו ושמרו עליו בהכרה.” „אחד מהם הוזנק להביא אמבולנס ואביאל נשאר עם שוטר ושוטרת.” „כמה דקות לאחר מכן הגיעו שני טנדרים עם חוליה של 12 מחבלים.” „הם ירו באביאל ובשוטרת למוות.” Israel Hayom 17835188 (mother), re-read: „אביאל הספיק לרדת מהמכונית לפני שהשוטרים מגיעים אליו, עדיין בהכרה, ומסר לשוטרת את פרטיו האישיים.”; „תוך שמגיעים עוד שני טנדרים של מחבלים”; „השוטרים מנסים להסתיר את אביאל, אבל לדעתי הוא כבר היה מת בשלב הזה.”; „השוטרת מקבלת חמישה כדורים בגבה ומתה אף היא.” | **CORRECTION PROPOSED.** Both sources agree: he was shot in the car, got out / was out of it when the police reached him, called his friends **to warn them**, and a second terrorist squad then arrived and fired at him and the policewoman. Whether he was still alive at that moment is uncertain (Le'ad: yes; mother: „לדעתי הוא כבר היה מת”). Le'ad does not say in/out of the car; the mother says out. | `opening`: אביאל ברח מהנובה ברכב עם חברו, נורה כמאה מטר אחרי צומת רעים – ובכוחותיו האחרונים, פצוע אנוש, התקשר אל שאר החברים להזהיר אותם. `oct7`: אביאל, פצוע אנוש, התקשר בכוחותיו האחרונים אל שאר החברים מהחבורה להזהיר אותם שיש מחבלים – ובכך, כתבו עליו, התגלתה גבורתו. שוטרים שהגיעו אליו ניסו לטפל בו, ואז הגיעה חוליית מחבלים נוספת וירתה בו ובשוטרת שטיפלה בו. `past`: …ובבוקר האחרון שלו, פצוע בצד הדרך, השתמש בכוחותיו האחרונים כדי להתקשר אל חבריו ולהזהיר אותם. **The call's purpose (״להזהיר אותם שיש מחבלים״) is now CONFIRMED (Le'ad + mako) — CORRECTIONS.md had removed it as unsourced; it may be restored.** |
| **F13b** (optional) | ״אביאל ספג ארבעה כדורים באזור הבטן״ | MATCH for mother's account; sources disagree (one: 5 in the back; mako: one in the abdomen) | Le'ad: „אביאל נפגע מכדור בבטן” (one bullet). | **CORRECTION PROPOSED (optional softening, as C-02 suggested)** — the official page gives a different number | אביאל נפגע מירי בבטנו; עידו ככל הנראה נהרג במקום. |
| (new, not open) | `after`: Omer learned of the death from the Beitar video | MATCH (one.co.il) | Le'ad adds: „רק שלושה ימים לאחר מכן קיבלה המשפחה את ההודעה הרשמית.” and burial „במשואות יצחק”. Not contradictory; may be added. | — | optional: …ההודעה הרשמית הגיעה למשפחה רק שלושה ימים לאחר מכן. |

---

## 2. Open C-02 items outside Le'ad scope (police / soldiers / stations) — listed per task step 1; C-02 verdict stands

| ID | Person / station | Claim | C-02 finding | C-05 status |
|---|---|---|---|---|
| Q7b | Roni Eshel | ״מנהלת הבית״ | MINOR → ״המנהלת של הבית״ | out of Le'ad scope (soldier; Izkor) — apply C-02 |
| Q7d | Roni Eshel | ״בכל מחיר, בלב גדול ומאיר״ | MINOR → ״בכל מחיר עם לב גדול ומאיר״ | apply C-02 |
| Q12 | Raz Peretz | quote attribution ״משפחתו״ | MINOR → רוני פרץ, אביו | apply C-02 |
| Q13 | Raz Peretz | ״שמר על קור רוח…״ unattributed | MINOR → אביו | apply C-02 |
| F1 | Eliyahu Harosh | daughter ״לאה״ | MISMATCH → ליה (ashdodonline); police memorial page robots-blocked | out of Le'ad scope (police). Still single-source; **STILL OPEN** until the police memorial or the family confirms ליה |
| F5c | Roni Eshel | ״וואטסאפ״ | MINOR → ״הודעה״ | apply C-02 |
| F7e | Aner Shapira | Or Levi ״ביקש לפגוש את הוריו״ | NOT FOUND | apply C-02 (remove / reword) |
| F10b | Raz Peretz | ״מ״פ קרבי״ | MISMATCH → מפקד פלוגת המפקדה | apply C-02 |
| F10c | Raz Peretz | ״19 חיילים״ | MINOR → 18 + רז | apply C-02 |
| F10d | Raz Peretz | ״חמישה חיילים חמושים״ | MISMATCH → שישה כלי נשק | apply C-02 |
| F10i | Raz Peretz | ״כשנה וחצי … אלפי שעות התנדבות״ | NOT FOUND | apply C-02 (remove) |
| F10j | Raz Peretz | musical garden exists | MINOR → planned | apply C-02 |
| F11 #6 | סמל אוריאל סגל | personal Izkor page | not located | STILL OPEN (name verified on Raz's Izkor page) |
| S2 | Sderot | 11 police | MATCH / MINOR framing | apply C-02 (optional) |
| S7 | Tkuma | hours | MATCH + newer info | apply C-02 |
| S8 | Observers' hill | coordinates | MATCH; H-02 on site | unchanged |
| Q11 (text) | Hersh | stitched quote | MISMATCH → ellipsis + plural attribution | apply C-02 (spelling: see §1) |

---

## 3. Sources that could not be opened (nothing else was tried)

| Source | Error (C-05, 2026-10-11) | What it would settle |
|---|---|---|
| https://www.makorrishon.co.il/opinion/775176/ | fetch error, 2 attempts | F12b (team fled), F12f (bandages/tourniquets image) |
| https://he.wikipedia.org/wiki/הירש_גולדברג-פולין (plain and percent-encoded) | URL_NOT_FOUND, 2 attempts | nothing essential now — F9b, F9d, F9g were settled with Le'ad, Times of Israel, Kan and ynetnews |
| https://time.com/6964879/rachel-goldberg-polin/ | fetch error | not needed — Kan + ynetnews quote the TIME listing |
| Le'ad site search (https://laad.btl.gov.il/Web/He/TerrorVictims/Default.aspx?exp=1) | ASP.NET postback form, not usable via fetch | profiles were found through domain-restricted web search instead |

---

## 4. Ready-to-approve list of proposed edits (per content-source file)

Each line: **section key** · old → new · source(s). Items marked *(C-02)* repeat C-02's proposal unchanged, listed here so Shuki has one list.

### `content-source/people/02_ofir-libstein.md`
1. **opening** · ״נטל נשק, יצא אל שער כפר עזה להגן על תושביו, ונפל״ → ״נטל נשק, יצא להגן על תושביו, ונפל״ · Izkor (no gate); onlife (no gate).
2. **oct7** · ״שבועות קודם לכן נדרשה כיתת הכוננות של הקיבוץ להחזיר את נשקהּ לנשקייה״ → ״כחודשיים קודם לכן נדרשה כיתת הכוננות של הקיבוץ להפקיד את נשקהּ בנשקייה״ · onlife 571715 („לפני חודשיים”).
3. **oct7** · ״ואופיר הצליח, כמעט לבדו, להגיע לנשק, לצאת אל אזור השער ולפתוח באש על המחבלים שחדרו״ → ״ואופיר היה מהראשונים שהצליחו להגיע לנשקייה, הצטייד בנשק ונלחם במחבלים שחדרו״ · Izkor („מהראשונים להגיע לנשקייה, הצטייד בנשק … נלחם בהם בגבורה”); onlife („היחיד … שהצליח להגיע לנשקייה”).
4. **personality** · ״״עוגן רגשי״ למשפחות וחברים רבים; … ביתו היה מקום מפגש שבו ״תמיד היו צחוק, אור ושמחת חיים״״ → ״״העוגן של המשפחה״, כדברי יקיריו, וגם העוגן של חבורת חבריו; אדם עם אופטימיות מדבקת ומנהיגות טבעית. ביתו בכפר עזה היה ״חם ואוהב, מלא שמחה ושחוק, חברים ואורחים״״ · Izkor; onlife.
5. **after** · ״אופיר וניצן נטמנו זה לצד זה בכפר עזה״ → ״אופיר וניצן נטמנו זה לצד זה באבן יהודה, ובספטמבר 2025 הועברו למנוחת עולמים בכפר עזה״ · Izkor; Le'ad (Nitzan); ynet r1axm9qoge. **(Supersedes C-02's Even Yehuda proposal.)**
6. **guideLevels 30 s** · ״יצא בבוקר המתקפה להגן על שער הקיבוץ ונפל״ → ״יצא בבוקר המתקפה להגן על הקיבוץ ונפל״ · as 1.
7. **guideLevels 2 min** · ״היציאה אל השער״ → ״היציאה אל הנשקייה והקרב״ · as 3.
8. **past** *(C-02, optional)* · framing of ״החיים של כולנו יהיו יותר טובים״ as ליאור ניסקי's words · ynet byeie857p.
9. **sources** · add: אופיר ליבשטיין (יזכור) — https://www.izkor.gov.il/אופיר%20ליבשטיין/en_236149870c993591831097ff5fd04df2 ; נטמנו בכפר עזה (ynet, 19.9.2025) — https://www.ynet.co.il/news/article/r1axm9qoge
10. **Station 02 talkingPoint** (route-232, wherever ״להגן על שער הקיבוץ״ appears) · ״שער הקיבוץ״ → ״הקיבוץ״ · as 1.

### `content-source/people/03_nitzan-libstein.md`
1. **oct7** · ״אביו, אופיר, יצא אל השער להילחם״ → ״אביו, אופיר, יצא להילחם״ · Izkor; onlife.
2. **oct7** · ״הוא נטמן בכפר עזה לצד אביו״ → ״הוא נטמן לצד אביו באבן יהודה, ובספטמבר 2025 הועברו שניהם למנוחת עולמים בכפר עזה״ · Le'ad 43503; Izkor; ynet r1axm9qoge.
3. **personality** · ״חבריו כתבו עליו שהיה מיועד לגדולות – אחד מהם כתב שראה בו ראש ממשלה או בכיר במערכת השלטון בעתיד״ → ״נכתב עליו שהיה מיועד לגדולות – סתיו, שכתבה עליו לאחר מותו, כתבה: ״הוא היה אמור להיות ראש הממשלה שלנו עוד כמה שנים… או לפחות בתפקיד בכיר אחר״״ · Le'ad; onlife.
4. **past** · ״גרסה משופרת של עצמו, כפי שתיארו אותו״ → ״״מודל משופר של עצמו״, כפי שכתבה עליו סתיו״ · Le'ad; onlife.
5. **after** · ״נטמנו זה לצד זה באדמת כפר עזה״ → ״נטמנו זה לצד זה – תחילה באבן יהודה, ומספטמבר 2025 באדמת כפר עזה״ · as 2.
6. **quote** · „היית ילד שכולו לב, הראשון להושיט יד כשצריך עזרה. כמה שכל היה לך, כמה אומץ וכוח רצון” → „היית ילד שכולו לב, הראשון להושיט יד כשצריך עזרה… כמה שכל היה לך, כמה אומץ וכוח רצון” · Le'ad (same ellipsis); ynet byp11keefa (the omitted sentence).
7. **sources** · add: ניצן ליבשטיין (לעד – ביטוח לאומי) — https://laad.btl.gov.il/Web/He/TerrorVictims/Page/Default.aspx?ID=43503

### `content-source/people/06_hersh-goldberg-polin.md`
1. **name / all sections** (Shuki's call) · הרש → הירש · Le'ad header; Hapoel; ynet; Kan.
2. **after** · ״נאמו באו״ם ונפגשו עם מנהיגים, ורייצ׳ל נבחרה לאחת מ-100 האנשים המשפיעים בעולם״ → ״נפגשו עם מנהיגים; רייצ׳ל נאמה באו״ם בניו יורק ובז׳נבה ונבחרה ב-2024 לרשימת 100 האנשים המשפיעים בעולם של מגזין TIME״ · Kan 741845; ynetnews hkgr88te0.
3. **oct7** *(optional precision)* · ״נקטעה זרועו השמאלית״ → ״נקטעה ידו השמאלית מתחת למרפק״ · Le'ad; Times of Israel.
4. **personality** *(optional precision)* · ״חובב טיולים שתכנן מסע ארוך בעולם״ → ״תכנן לצאת בדצמבר 2023 לטיול ארוך של שנתיים ברחבי העולם״ · Le'ad; Times of Israel.
5. **past** *(C-02)* · stitched quote → „אנחנו ידענו שהירש זה שם נרדף לאור, אהבה ושלום […] תמיד היית שם בשורה הראשונה, צמוד לגדר, צמוד לתוף עם דגל הפועל ירושלים ביד” — חבריו לארגון האוהדים של הפועל ירושלים · hapoel 34818.
6. **sources** · replace the dead Wikipedia link with https://he.wikipedia.org/wiki/הירש_גולדברג-פולין (still unverified by fetch) and add: הירש גולדברג-פולין (לעד) — https://laad.btl.gov.il/Web/He/TerrorVictims/Page/Default.aspx?ID=44204 ; רייצ׳ל ברשימת TIME (כאן) — https://www.kan.org.il/content/kan-news/defense/741845/ ; Times of Israel obituary — https://www.timesofisrael.com/hersh-goldberg-polin-23-soccer-lover-who-dreamed-of-world-travel/

### `content-source/people/08_awad-darawshe.md`
1. **opening** · ״עוואד היה פרמדיק שיכול היה לברוח כמו כל הצוות – ובחר להישאר ולטפל בפצועים בנובה. מצאו אותו עם תחבושות ביד אחת וחוסמי עורקים בשנייה.״ → ״עוואד היה פרמדיק שיכול היה לברוח – ובחר להישאר ולטפל בפצועים בנובה. הוא נורה למוות בזמן שחבש את אחד הפצועים.״ · AP 15.10.2023; walla 3618724. (Makor Rishon could not be read.)
2. **oct7** · ״כשפרצה המתקפה, חבריו לצוות הרפואי נמלטו – ועוואד בחר להישאר עם הפצועים.״ → ״כשפרצה המתקפה הורה מנהל חברת האמבולנסים לחובשים להתפנות – ועוואד בחר להישאר עם הפצועים.״ · AP; walla.
3. **oct7** · ״הוא **האמין שהעובדה שהוא ערבי ומוסלמי תעזור לו** כשהמחבלים יגיעו.״ → ״לפי בני משפחתו, הוא האמין שכערבי דובר ערבית יוכל לתווך מול המחבלים – ״אני מדבר ערבית, אני חושב שאני יכול להסתדר״.״ · AP; The Media Line.
4. **oct7** · ״הוא נרצח בשעת בוקר מוקדמת, ככל הנראה ליד במת ה-DJ. מי שמצאו את גופתו מצאו אותו עם תחבושות ביד אחת וחוסמי עורקים בשנייה – עובד עד השנייה האחרונה.״ → ״הוא נרצח ככל הנראה ליד במת ה-DJ, בזמן שחבש את אחד הפצועים – עובד עד השנייה האחרונה.״ · walla; mako morning; AP.
5. **personality** *(C-02)* · ״לפי מנהלו״ → ״לפי אילון שפרבר, סמנכ״ל ״יוסי אמבולנסים״״ · walla.
6. **after** *(C-02)* · ״והוריו אמרו: ״במותו איחד את הכפר.״״ → ״ואביו מוסא אמר: ״במותו הוא איחד את הכפר.״״ · walla; Le'ad („בן הודא ומוסא”).
7. **quote** *(C-02)* · „במותו איחד את הכפר” — הוריו של עוואד → „במותו הוא איחד את הכפר” — מוסא דראושה, אביו של עוואד · walla.
8. **guideLevels 30 s** · ״בחר להישאר ולטפל בפצועים כשכולם ברחו – ונרצח. מצאו אותו עם תחבושות בידיים.״ → ״בחר להישאר ולטפל בפצועים אף שהורו לחובשים להתפנות – ונרצח בזמן שחבש פצוע.״ · AP; walla.
9. **guideLevels 2 min** · ״שהאמין שהיותו ערבי ומוסלמי תעזור לו״ → ״שהאמין שכערבי דובר ערבית יוכל לתווך מול המחבלים״; ״״במותו איחד את הכפר״״ → ״״במותו הוא איחד את הכפר״״ · as 3, 7.
10. **sources** · add: עוואד דראושה (לעד) — https://laad.btl.gov.il/Web/He/TerrorVictims/Page/Default.aspx?ID=43800 ; AP, 15.10.2023 — https://abc17news.com/ap-national/2023/10/15/an-arab-paramedic-who-treated-israelis-injured-by-hamas-militants-is-remembered-as-a-hero/ ; mako, 6.11.2023 — https://www.mako.co.il/tv-morning-news/articles/Article-8db31d2d704ab81027.htm. Keep Makor Rishon only if Shuki can open it himself.

### `content-source/people/09_aviel-rahamim.md`
1. **opening** · ״נורה בתוך המכונית כמאה מטר אחרי צומת רעים – ובכוחותיו האחרונים, פצוע אנוש, התקשר אל שאר החברים״ → ״נורה כמאה מטר אחרי צומת רעים – ובכוחותיו האחרונים, פצוע אנוש, התקשר אל שאר החברים להזהיר אותם״ · Le'ad; mako; Israel Hayom 17835188.
2. **oct7** · ״אביאל, פצוע אנוש בתוך הרכב, **התקשר בכוחותיו האחרונים אל שאר החברים מהחבורה** – ובכך, כתבו עליו, התגלתה גבורתו. אחר כך המחבלים השלימו את הריגתו.״ → ״אביאל, פצוע אנוש, **התקשר בכוחותיו האחרונים אל שאר החברים מהחבורה להזהיר אותם שיש מחבלים** – ובכך, כתבו עליו, התגלתה גבורתו. שוטרים שהגיעו אליו ניסו לטפל בו, ואז הגיעה חוליית מחבלים נוספת וירתה בו ובשוטרת שטיפלה בו.״ · Le'ad; Israel Hayom; mako.
3. **oct7** *(optional)* · ״אביאל ספג ארבעה כדורים באזור הבטן״ → ״אביאל נפגע מירי בבטנו״ · Le'ad („מכדור בבטן”) vs Israel Hayom („ארבעה כדורים”) vs one („חמישה כדורים בגב”).
4. **personality** *(C-02)* · ״הוא היה החבר הכי טוב שלי״ → ״הוא החבר הכי טוב שלי״; ״״שותפים בכל״״ → ״״שותף שלי, בכל״״ · mako.
5. **past** · ״במשפחה מספרים שהוא ״תמיד היה עוצר בצד הדרך לעזור למי שתקוע עם פנצ׳ר״״ → ״בת זוגו תמר גולן מספרת שהוא ״תמיד היה עוצר בצד הדרך לעזור למי שתקוע עם פנצ׳ר״״ (mako) — or ״הוא ״נהג לעצור בצד הדרך ולעזור למי שתקוע עם פנצ׳ר״״ (Le'ad).
6. **past** · ״פצוע בתוך רכב בצד הדרך, השתמש בכוחותיו האחרונים כדי להתקשר אל חבריו״ → ״פצוע בצד הדרך, השתמש בכוחותיו האחרונים כדי להתקשר אל חבריו ולהזהיר אותם״ · Israel Hayom; Le'ad.
7. **after** · ״אמו תמר סיכמה: ״הוא באמת נשאר צעיר לנצח. לנצח יהיה בן 27.״״ → ״בת זוגו תמר גולן סיכמה: ״הוא באמת נשאר צעיר לנצח. לנצח הוא יהיה בן 27.״״ · Le'ad; mako.
8. **altQuote** · „הוא באמת נשאר צעיר לנצח. לנצח יהיה בן 27” — תמר רחמים, אמו של אביאל → „הוא באמת נשאר צעיר לנצח. לנצח הוא יהיה בן 27” — תמר גולן, בת זוגו של אביאל · Le'ad; mako.
9. **guideLevels 2 min** · ״ואת הטלפון שאביאל הספיק לעשות, פצוע אנוש, אל שאר החברים״ → ״…אל שאר החברים כדי להזהיר אותם״ · Le'ad; mako.
10. **sources** · add: אביאל שלום רחמים (לעד) — https://laad.btl.gov.il/Web/He/TerrorVictims/Page/Default.aspx?ID=43973
11. **CORRECTIONS.md** (Shuki/orchestrator) · the 2026-10-11 line ״התקשר כדי להזהיר אותם … → … The purpose was not stated in the source״ is now superseded: the purpose **is** stated in mako and on Le'ad.

---

## 5. Still open after C-05

| Item | Why | What would settle it |
|---|---|---|
| F12b — ״כל הצוות נמלט״ | only Makor Rishon 775176 might say it; unreadable by the tool | Shuki opens the Makor Rishon column in a browser; otherwise use the safe wording above |
| F12f — ״תחבושות ביד אחת וחוסמי עורקים בשנייה״ | not in any readable source | same; otherwise REMOVE (replacement offered) |
| F1 — daughter ליה / לאה (police) | single source (ashdodonline); police memorial robots-blocked | police memorial page in a browser, or the family |
| F11 #6 — Izkor page of סמל אוריאל סגל | Izkor search is JS-only | Shuki searches Izkor in a browser |
| Hersh spelling הרש/הירש | editorial choice | Shuki (official sites use הירש) |
| Q3 framing | optional | Shuki |
