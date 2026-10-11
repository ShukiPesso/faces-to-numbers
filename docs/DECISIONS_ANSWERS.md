# Decisions — answers (H-01)

Answered by Shuki on 2026-10-11: **accept every recommendation** in `docs/07_DECISIONS_FOR_SHUKI.md`.
Written into this file by the orchestrator on his behalf.

| # | Decision | Answer |
|---|---|---|
| 1 | Build vs host | Hybrid: static PWA built in git, published to Base44 via `deploy-dist`. Base44 builder AI is never used for code. |
| 2 | Base44 app + API key | App created 2026-10-11: name "פנים למספרים", **App ID `6acbdd0752a2bf13ffbef220`**, slug `app-ffbef220`, `public_without_login`, empty (no builder turn). API key: Shuki creates a workspace key with `apps:deploy` only and stores it ONLY as GitHub secret `BASE44_API_KEY`. **Pending.** |
| 3 | GitHub | Private GitHub repo + Actions. Shuki is creating it. **Pending (URL).** |
| 4 | Site name | "פנים למספרים" — subtitle "סיור עצמאי בעוטף עזה, בעקבות 7 באוקטובר" |
| 5 | Domain | Base44 URL for now; decide own domain before public launch |
| 6 | Closing drive | General wording about distance from home to the border, plus one personal line ("יוצר הסיור גר בנתיבות, כרבע שעה מכאן") |
| 7 | Shuki's name | Yes, on the About page, as the person who researched and built the tour |
| 8 | Families | Contact every family before public launch; no wide launch before answers |
| 9 | Photos | Only family-provided photos with written consent and credit; never press photos |
| 10 | Locations | Shuki verifies every point (H-02); unverified → "המיקום בבדיקה", no navigation buttons |
| 11 | Kfar Aza | View from the road only, no entry |
| 12 | Raz Peretz & Aviel Rahamim | Raz: companion story at Aner's shelter (fell at Kissufim). Aviel: short mention at Re'im junction, full story at Tkuma |
| 13 | Language | Hebrew only in MVP; English in phase 2 |
| 14 | Voice | Not in MVP; recordings in Shuki's voice in phase 2 |
| 15 | Contact email | Dedicated project address on About (Shuki to create; empty until then) |
| 16 | Safety guidance | Refer to Home Front Command and security forces' instructions on site |

**Gate G1 status:** decisions ✅ · Base44 app ✅ · API key ⏳ · GitHub repo ⏳ · deploy spike O-01 ⏳ (needs the key).
Wave-1 tasks that do not need Base44 were started before G1 by Shuki's explicit decision (2026-10-11). O-01 and anything after it that deploys still waits for G1.
