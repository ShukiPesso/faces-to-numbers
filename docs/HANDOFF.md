# Handoff — orchestrator state (2026-10-12)

Read this first if you are a new orchestrator session continuing the build of **פנים למספרים / faces-to-numbers**.
Then read `README.md`, `docs/06_ORCHESTRATION.md`, `TASK_BOARD.md` and `docs/DECISIONS_ANSWERS.md`.

## Where things stand
- Waves 0–6 code work is done and merged on `main`: shell, all pages, PWA/offline, performance (Lighthouse mobile ≈92–95, a11y 100), design QA fixes, gentle openings for graphic people, full test suite (542 unit/component/integrity tests; 171 Chromium E2E), test audit (T-11) and its gap fixes (T-12).
- **Not yet done / waiting:**
  - **O-03 (status: review):** `.github/workflows/deploy.yml` + `scripts/deploy-base44.sh` are ready. Shuki must run *Actions → Deploy → Run workflow* once (secrets `BASE44_API_KEY`, `BASE44_APP_ID` already exist). That first run is also the O-01 spike. On success: mark O-01 and O-03 done, consider enabling `push: main` trigger, do the hosting checks in `docs/DEPLOY_BASE44.md` §9. On failure: Shuki sends only the `[deploy-base44]` log lines; 401 → wrong key type (needs workspace key, scope `apps:deploy`, header `api_key`; override via repo variable `BASE44_AUTH_HEADER=bearer` for a personal token).
  - **CI:** first GitHub Actions run of `ci.yml` (incl. WebKit projects mobile-safari/tablet, never run before) — check results and fix.
  - Human tasks: H-02 (Sa'ad junction + verify all coordinates, see `review/C-03-coordinates.md`), H-03 (families), C-04 + H-05 (proofread + field test on the live site), H-06 (sign-off), then L-01 (soft launch). H-04 (photos) after launch.
- Open content items (Shuki's call, see `content-source/VERIFICATION.md`): Eliyahu's daughter ליה/לאה; Awad "the team fled" (Makor Rishon unreadable); Izkor page of סמל אוריאל סגל.

## Shuki's decisions so far (also in memory/project docs)
All recommendations in `docs/07_DECISIONS_FOR_SHUKI.md` accepted · spelling הירש · silence moment without countdown · G2 approved (graphic people's quotes behind the gate; small photo strip; start button above safety notes) · gentle openings approved (C-07 proposals) · Aviel's `after`/`past` stay visible · source titles unchanged · deploy manually first.
Shuki prefers Hebrew, tables, and step-by-step confirmation before each new wave.

## How the orchestrator works here (lessons learned)
- One git worktree per task: `git worktree add ../wt/<ID> -b task/<ID>` + `ln -s <repo>/node_modules ../wt/<ID>/node_modules`. Merge with `--no-ff`, check `git diff --name-only main...task/<ID>` ⊆ owns, re-run verify yourself.
- Git identity: `git config user.email noreply@anthropic.com && git config user.name Claude` (unverified-commit hook).
- Model per task is in `backlog/*.yaml` (`haiku|sonnet|opus|fable|human`). Fable ran out of credits twice → fall back to opus (never down).
- Playwright in the cloud container: `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers PW_CHROMIUM_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome`; Chromium only. Ports 4173/4174 belong to Playwright's webServers — always run E2E as `flock /tmp/pw-e2e.lock npx playwright test ...`; manual previews on 419x ports.
- Lighthouse: `CHROME_PATH=<chromium> npx --yes @lhci/cli@0.14 autorun` (see `lighthouserc.json`).
- Never write the Base44 key anywhere. Never use the Base44 builder AI on the app.
