# Handoff — orchestrator state (2026-10-12, updated evening)

Read this first if you are a new orchestrator session continuing the build of **פנים למספרים / faces-to-numbers**.
Then read `README.md`, `docs/06_ORCHESTRATION.md`, `TASK_BOARD.md` and `docs/DECISIONS_ANSWERS.md`.

## Where things stand
- Waves 0–6 code work is done and merged on `main`: shell, all pages, PWA/offline, performance (Lighthouse mobile ≈92–95, a11y 100), design QA fixes, gentle openings for graphic people, full test suite (542 unit/component/integrity tests; 171 Chromium E2E), test audit (T-11) and its gap fixes (T-12).
- **Not yet done / waiting:**
  - **O-03: done.** First real deploy + smoke green (2026-10-12, 3rd manual run). The secret is a personal access token, so the repo variable `BASE44_AUTH_HEADER=bearer` is set. Trigger is still manual only (`workflow_dispatch`); enabling `push: main` is Shuki's call.
  - **O-01: done.** Hosting observations recorded in `docs/DEPLOY_BASE44.md` §9. Live site: https://app-ffbef220.base44.app
  - **CI: green on `main`.** E2E-LAYOUT-04 baselines were rendered by the cloud container's Chromium and failed on GitHub's runner; regenerated on the runner via the new manual workflow **Visual baselines** (PR #1, `visual-change`, merged). WebKit projects pass.
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
- **No access to GitHub Actions logs, artifacts, or variables/secrets from the cloud container** (egress policy). Read results only via annotations: `gh api repos/ShukiPesso/faces-to-numbers/check-runs/<job id>/annotations`. CI E2E failures → one `E2E failures (N)` annotation (`scripts/ci-e2e-failures.mjs`); deploy failures → `deploy-base44 failed`. `gh workflow run` works. Base44 hosts are not reachable from the container.
- Never commit visual baselines rendered in the container — use the **Visual baselines** workflow (pushes a branch; open the `visual-change` PR via REST: `gh api repos/.../pulls`; GraphQL is blocked).
- Never write the Base44 key anywhere. Never use the Base44 builder AI on the app.
