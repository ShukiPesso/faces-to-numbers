# Deploy to Base44 — העלאת האתר ל-Base44

Status: **pipeline ready, not yet run against the real Base44.** The first manual run by Shuki is
also the spike (O-01): it is the first time the real API is called. The seven hosting observations
in §9 are still open until that run succeeds.

- Workflow: `.github/workflows/deploy.yml` (manual only for now: `workflow_dispatch`)
- Script: `scripts/deploy-base44.sh`
- Base44 app: "פנים למספרים", App ID `6acbdd0752a2bf13ffbef220`, slug `app-ffbef220`
- Secrets in GitHub (already created): `BASE44_API_KEY`, `BASE44_APP_ID`

---

## 1. Sources (read 2026-10-12)

Everything below comes from these pages. Nothing about the API was guessed.

| # | Source | What it gave us |
|---|---|---|
| S1 | https://docs.base44.com/api-reference/deploy-a-prebuilt-site.md (HTML: https://docs.base44.com/api-reference/deploy-a-prebuilt-site) | The OpenAPI spec of the endpoint: server, path, both auth schemes, `multipart/form-data` with field `file`, limits, status codes |
| S2 | https://docs.base44.com/developers/references/apps-api/get-started/authentication.md | Personal access tokens use `Authorization: Bearer`; **account** API keys in `api_key` stop working on 2026-10-15 |
| S3 | https://docs.base44.com/developers/references/app-management/get-started/authentication.md | Older page: personal key in the `api_key` header; example host `https://app.base44.com/api/...` |
| S4 | https://docs.base44.com/developers/references/apps-api/sections/deployment.md | Only a one-line description of deploy-dist; no extra detail |
| S5 | https://docs.base44.com/llms.txt | The docs index, used to find S1–S4 |
| S6 | https://docs.github.com/en/actions/reference/workflows-and-actions/deployments-and-environments | "If you are on a GitHub Free, GitHub Pro, or GitHub Team plan, required reviewers are only available for public repositories." |

All pages could be fetched. No page needed a workaround.

## 2. The API contract (from S1)

| Item | Value | Source |
|---|---|---|
| Server | `https://app.base44.com` | S1 `servers` |
| Request | `POST /api/apps/{app_id}/deploy-dist` | S1 |
| Auth, workspace API key | header `api_key: <key>` (OpenAPI `type: apiKey, in: header, name: api_key`), key needs scope `apps:deploy` | S1 |
| Auth, personal access token | header `Authorization: Bearer <token>`; the token needs "Full access" | S1, S2 |
| Body | `multipart/form-data`, one field `file` (binary): a gzipped tar whose **file name ends in `.tar.gz`** | S1 |
| Archive layout | the **contents** of the build folder, `index.html` at the root | S1 |
| Limits | ≤ 50 MB uploaded and unpacked, ≤ 1,000 files | S1 |
| Silently dropped | links (symlinks), absolute paths, paths with `..` or `:` | S1 |
| Rate limit | 5 requests per minute, shared by all keys of the workspace | S1 |
| Effect | replaces the whole published site; does not touch code, functions or entities; publishes an unpublished app | S1 |
| Same archive again | Base44 re-publishes its stored copy without re-uploading | S1 |
| 200 | `{ "deployed_at": "2026-09-30T12:34:56.789000", "app_url": "https://….base44.app" }` (UTC, no offset; Base44 domain only, never a custom domain) | S1 |

The same request with curl, placeholders only (this is what the script sends):

```bash
tar -czf site.tar.gz -C dist .
curl -X POST "https://app.base44.com/api/apps/<APP_ID>/deploy-dist" \
  -H "api_key: <WORKSPACE_API_KEY>" \
  -F "file=@site.tar.gz;type=application/gzip;filename=site.tar.gz"
```

### Status codes (S1) and what to do

| Status | Meaning (from S1) | What to do |
|---|---|---|
| 400 | Bad file name, archive too large, too many files, empty or unreadable archive, no `index.html` at the root | Read the response body in the log |
| 401 | Missing or invalid credentials | Check the secret. Is it a workspace key (`api_key`) or a personal token (`bearer`)? See §3 |
| 403 | No editor access, app blocked, no publish permission, read-only key, key lacks `apps:deploy` or does not cover this app (`workspace_api_key_scope_required`, `read_only_credential_route_not_allowed`) | Fix the key's scope or app in Base44 workspace settings → Secrets |
| 404 | App not found | Check the `BASE44_APP_ID` secret |
| 409 | With a workspace key: the app left the key's workspace, or the key was revoked during the request. Nothing was published | Check the key and the app's workspace |
| 422 | The `file` field is missing | Only happens with `BASE44_UPLOAD_MODE=raw`; go back to the default |
| 429 | Rate limit | The script waits 65 s and retries **once** by itself |

## 3. What the docs leave open, and the switches

1. **Which header our key needs.** S1 documents two schemes. The key in the secret is meant to be a
   **workspace API key with `apps:deploy`** (docs/DECISIONS_ANSWERS.md #2), so the default is the
   `api_key` header. S2 says that from **2026-10-15** *account* API keys (the old personal ones) are
   rejected in `api_key`. That is about account keys, not workspace keys, and S1 still documents
   `api_key` for workspace keys. If the key turns out to be a **personal access token**, set the
   variable `BASE44_AUTH_HEADER=bearer` (§4).
2. **Upload encoding.** S1 is clear: `multipart/form-data`, field `file`. A raw body is **not**
   documented. `BASE44_UPLOAD_MODE=raw` exists only as a last-resort test switch; do not use it unless
   Base44 support says so.
3. **"50 MB".** Not said if decimal or binary. The script uses the stricter 50,000,000 bytes.

### Switches (all optional; empty = documented default)

They are read from GitHub **repository variables** (not secrets — they hold no secret):
Settings → Secrets and variables → Actions → **Variables** tab → New repository variable.

| Variable | Default | Other allowed values |
|---|---|---|
| `BASE44_API_BASE` | `https://app.base44.com` | any `https://host`, no path |
| `BASE44_AUTH_HEADER` | `api_key` (workspace key, S1) | `bearer` (personal access token, S1/S2) |
| `BASE44_UPLOAD_MODE` | `multipart` (S1) | `raw` (undocumented; test only) |

Any other value makes the script stop with an error. It never falls back to a guess by itself.

## 4. One-time setup — הכנה חד-פעמית

כבר נעשה:
- [x] סוד `BASE44_API_KEY` במאגר ב-GitHub
- [x] סוד `BASE44_APP_ID` במאגר ב-GitHub

אין צורך במשתנים (Variables) כדי להתחיל. מוסיפים אותם רק אם ההרצה הראשונה נכשלת ו-§6 אומר לעשות זאת.

**אופציונלי — אישור ידני לפני כל העלאה:** ב-GitHub אפשר ליצור Environment בשם `production` עם
"Required reviewers". **במאגר פרטי זה דורש GitHub Enterprise** (S6), לכן זה כבוי. אם המאגר יהיה
ציבורי או התוכנית תשתנה: Settings → Environments → New environment → `production` → Required reviewers
→ שוקי, ואז מורידים את הסימן `#` מהשורה `# environment: production` בקובץ ה-workflow.

## 5. First deploy — העלאה ראשונה (צעד אחר צעד)

1. ודאו שהשינויים מוזגו ל-`main`.
2. במאגר ב-GitHub לחצו על הלשונית **Actions**.
3. ברשימה משמאל לחצו **Deploy**.
4. מימין לחצו על הכפתור **Run workflow**.
5. בחלון שנפתח:
   - **Use workflow from:** השאירו `Branch: main` (מכל ענף אחר ההעלאה לא תרוץ).
   - **rollback_run_id:** השאירו **ריק**.
6. לחצו על הכפתור הירוק **Run workflow**.
7. רעננו את הדף ולחצו על ההרצה החדשה. יש שני שלבים:
   - **deploy** — בדיקות, בנייה, שמירת עותק, העלאה (בערך 5–10 דקות).
   - **smoke** — שלוש בדיקות על האתר החי (בערך 5 דקות).
8. כששניהם ירוקים: בעמוד ההרצה, תחת **Summary**, מופיעים `app_url` (כתובת האתר) ו-`deployed_at`.
9. שלחו לאורקסטרטור: את כתובת ההרצה (ה-URL של הדף) ואת `app_url`.

## 6. If it fails — אם משהו נכשל

1. לחצו על השלב האדום (**deploy** או **smoke**), ואז על הצעד האדום בתוכו.
2. **אם נכשל הצעד "Deploy to Base44":** העתיקו רק את השורות שמתחילות ב-`[deploy-base44]`.
   הן נראות כך:
   ```
   [deploy-base44] ERROR: HTTP status: 401
   [deploy-base44] ERROR: meaning: ...
   [deploy-base44] ERROR: sent to: POST https://app.base44.com/api/apps/***/deploy-dist
   [deploy-base44] ERROR: auth used: header "api_key: <redacted>" ...
   [deploy-base44] ERROR: response body (first 4000 chars, key redacted): ...
   ```
3. **אם נכשל צעד אחר** (Install, Check, Build, Smoke tests): העתיקו את 30 השורות האחרונות של אותו צעד.
4. **לעולם אל תשלחו את המפתח.** הסקריפט אף פעם לא מדפיס אותו (במקומו כתוב `<redacted>`
   או `[REDACTED]`, ו-GitHub מסתיר סודות כ-`***`). אם אתם רואים משהו שנראה כמו מפתח — אל תשלחו,
   ותגידו לנו. בטעות נחשף? מחקו את המפתח ב-Base44 (Workspace settings → Secrets), צרו חדש עם
   `apps:deploy` בלבד, ועדכנו את הסוד ב-GitHub.
5. אם כתוב `HTTP status: 401` והמפתח שיצרתם הוא **Personal access token** (ולא workspace key):
   הוסיפו משתנה `BASE44_AUTH_HEADER` = `bearer` (§3) והריצו שוב.
6. אל תריצו יותר מ-5 פעמים בדקה (מגבלת Base44).

## 7. How a deploy runs — מה קורה בהרצה

`deploy` job (only on `main`; manual for now):
1. `npm ci` → `npm run check` (lint, typecheck, content check, unit tests, build, size) → `npm run build`.
2. Upload `dist/` as the artifact `site-<7-char commit>` and keep it **90 days**. This is the rollback copy.
3. `bash scripts/deploy-base44.sh`:
   - refuses to run without `dist/index.html`, with > 1,000 files, > 50 MB unpacked, symlinks, or
     paths containing `:`;
   - packs `tar -czf site.tar.gz -C dist .` and refuses if it is > 50 MB or `index.html` is not at the root;
   - sends the key to curl on **stdin** (`-H @-`), so it is never on a command line, in a file, or in
     a child process's environment; never uses `set -x` or `curl -v`; never prints request headers;
   - on HTTP 429 waits 65 s and retries once;
   - on any other non-200: prints status, meaning, host and path, auth scheme name, upload mode,
     filtered response headers (no cookies) and the first 4,000 chars of the body with the key
     replaced by `[REDACTED]`; exits 1;
   - on 200: prints only `deployed_at` and `app_url` (shapes checked), and writes them to the job outputs.
4. Writes `app_url` to the run **Summary**.

`smoke` job (after deploy): `npm ci` → `npx playwright install --with-deps chromium` →
`LIVE_URL=<app_url> npx playwright test --project=smoke` (E2E-SMOKE-01..03 in
`tests/e2e/smoke.spec.ts`). The report is uploaded as the artifact `smoke-report`.

Two deploys never run at the same time (`concurrency: deploy`, never cancelled half-way).

**Later — automatic deploy on every merge:** after one successful run, remove the `#` from these two
lines in `.github/workflows/deploy.yml`:
```yaml
  # push:
  #   branches: [main]
```

## 8. Rollback — חזרה לגרסה קודמת (כמה דקות)

1. **Actions** → **Deploy** → ברשימת ההרצות מצאו את ההרצה **הירוקה האחרונה שהייתה תקינה**.
2. לחצו עליה. בשורת הכתובת של הדפדפן יש מספר אחרי `/runs/`, למשל
   `.../actions/runs/12345678901` → המספר הוא `12345678901`.
   (בתחתית אותו דף, תחת Artifacts, אמור להופיע `site-xxxxxxx`.)
3. **Run workflow** → Branch: `main` → בשדה **rollback_run_id** הדביקו את המספר → **Run workflow**.
4. ההרצה לא בונה מחדש: היא מורידה את `dist` מאותה הרצה ומעלה אותו, ואז מריצה את בדיקות ה-smoke.
5. ההרצה תסרב אם המספר אינו של הרצת Deploy על `main`, או אם אין בה בדיוק עותק `site-*` אחד.
   הרצת rollback עצמה לא שומרת עותק — לכן תמיד בחרו הרצה **רגילה** (שבנתה את האתר).

הערות: העותקים נשמרים 90 יום. Base44 מזהה ארכיון זהה שכבר הועלה ומפרסם את העותק השמור (S1).
אחרי חזרה לאחור, `main` עדיין מכיל את הקוד החדש — תקנו או בטלו (revert) אותו לפני ההעלאה הבאה.

**Auth in this repo (verified 2026-10-12):** `BASE44_API_KEY` holds a personal access token, so the repository
variable `BASE44_AUTH_HEADER` is set to `bearer`. A workspace key would return 401
`InvalidAccessTokenError` the other way round.

## 9. Hosting observations — answered 2026-10-12 (O-01)

Source: the smoke job's **Hosting observations** notice on Deploy runs 38300062796 and 38300077641
(both on `4fb6153`, started 8 s apart). Live URL: **https://app-ffbef220.base44.app**

| # | Question | Result |
|---|---|---|
| 1 | `index.html` status and content-type | `200`, `text/html; charset=utf-8`. **No `cache-control` header** (browser heuristics apply; acceptable because the service worker controls updates) |
| 2 | `sw.js` content-type, and does it register | `200`, `application/javascript; charset=utf-8`, no `cache-control`. Registers (E2E-SMOKE-03 green). Browsers bypass the HTTP cache for SW update checks by default, so no stale-SW risk |
| 3 | does `/#/…` load | Yes (E2E-SMOKE-02 green) |
| 4 | what `/does-not-exist` returns | `200` with `index.html` (SPA fallback, not a 404). Harmless: the app uses hash routing |
| 5 | cache-control | `/assets/*.js`: `public, max-age=604800` (7 days; file names are hashed, so safe). `manifest.webmanifest`: `public, max-age=3600`. `index.html`, `sw.js`: none |
| 6 | HTTPS | Yes, plus HSTS `max-age=31536000` |
| 7 | second deploy within one minute | Both runs succeeded (8 s apart, under the 5 requests/minute limit), smoke green on both |

## 10. Moving to another static host — מעבר לאחסון אחר (R-01)

`deploy-dist` is **beta**. The build does not depend on Base44: `dist/` is a plain static folder and
routing is hash-based (`#/…`), so any static host works with **no rewrite rules**. The service worker
needs HTTPS, which every option below gives.

Fastest path, no code change (about 10 minutes, by hand):
1. Download the newest `site-xxxxxxx` artifact from a green Deploy run (Actions → run → Artifacts) and unzip it.
2. **Netlify:** app.netlify.com → Add new site → **Deploy manually** → drag the unzipped folder.
   **Cloudflare Pages:** dash.cloudflare.com → Workers & Pages → Create → Pages → **Upload assets** → upload the folder.
3. Open the new URL and run the smoke tests against it:
   `LIVE_URL=<new url> npx playwright test --project=smoke`.

Permanent switch (one CI step): replace the step **"Deploy to Base44"** in `deploy.yml` with the host's
own CLI/action, for example `npx wrangler pages deploy dist --project-name=<name>` (secret
`CLOUDFLARE_API_TOKEN`) or `npx netlify deploy --dir=dist --prod` (secret `NETLIFY_AUTH_TOKEN`), and
make it write `app_url=<url>` to `$GITHUB_OUTPUT` so the smoke job keeps working. The build, the
rollback copies and the smoke job stay as they are. (The CLI commands above are from general
knowledge, not tested here; check each host's current docs before switching.)

## 11. Security rules

- The key lives **only** in the GitHub secret `BASE44_API_KEY`. Never in a file, commit, log, report or chat.
- No `set -x` and no `curl -v` in the deploy script.
- Deploys only from `main`; pull requests never deploy.
- Use a workspace key with **only** `apps:deploy` (S1). A personal access token needs "Full access" (S2), which is far broader.
- Check: `git grep -n BASE44_API_KEY` must show only the secret's name, never a value.
