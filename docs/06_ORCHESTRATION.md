# 06 — Orchestration Guide

How to turn this backlog into a working site using many sub-agents, most of them less capable than the orchestrator.

## 1. Roles

| Role | Who | Responsibilities |
|---|---|---|
| **Orchestrator** | strongest available model (or Shuki with one) | dispatch tasks, give each agent exactly its inputs, review reports, run verify commands, merge, update status, resolve BLOCKED |
| **Dev agent** | the model named in the task's `model:` field | implement code tasks (`F-*`, `P0-*`, `O-*`) |
| **Test agent** | the task's `model:` (never the same agent that wrote the code) | implement test tasks (`T-*`) — independently from the dev who wrote the code |
| **Design agent** | model with good visual/UX judgment | design tasks (`D-*`) — outputs under `design/` |
| **Content agent** | the task's `model:`, *very literal* | conversion tasks (`C-*`) — copy, never write |
| **Reviewer** | opus or fable, fresh context | optional second review on `opus`/`fable` tasks and anything touching content ethics |
| **Human** | Shuki | tasks with `agent: human` and the three gates (§5) |

### Model tiers (field `model:` in every task)
| Model | Used for | Tasks |
|---|---|---|
| `haiku` | short, mechanical, fully specified; easy to verify | D-06, F-05, T-09, T-10 |
| `sonnet` | normal implementation with a clear spec and tests | most F-, T-, D- and C- tasks |
| `opus` | infrastructure, architecture-heavy pages, offline/PWA, deploy, design system, launch | P0-01, P0-03, O-01, O-03, D-01, D-03, D-07, D-09, F-03, F-06, F-15, F-16, F-18, F-19, T-01, T-05, L-01 |
| `fable` | highest stakes — where a mistake is silent and costly: the anti-hallucination converter, fact verification against sources, the visual direction (gate G2), the final adversarial test audit | F-02, C-02, D-04, T-11 |
| `human` | Shuki | H-01..H-06 |
If a model is unavailable, use the next tier up; never down for `opus`/`fable` tasks.

## 2. Status lifecycle (edit `status:` in `backlog/*.yaml`, then regenerate)
`todo` → `in_progress` → `review` → `done`  (or → `blocked` with a note)

## 3. Dispatch algorithm
```
loop:
  ready = tasks where status == todo
          AND every depends_on task is done
          AND no human gate before this task is still open (G1 for everything after wave 0)
  drop from ready any task whose `owns` overlaps a task currently in_progress
  dispatch up to MAX_PARALLEL (recommended 6) tasks from ready, preferring:
      1. tasks on the critical path (P0-01 → P0-02 → F-02 → F-03 → F-06 → F-08 → F-16 → F-18 → T-10 → O-03 → C-04 → H-06 → L-01)
      2. fable and opus tasks first (they gate the most work)
  for each finished agent:
      read reports/<ID>.md
      run the task's verify commands yourself (never trust the report alone)
      check `git diff --name-only main...task/<ID>` ⊆ task.owns (+ reports/<ID>.md)
      if all good → merge, status = done
      else → send the agent back with the precise failing check (max 2 rounds), then reassign or split
  if a human gate is reached → stop and ask Shuki (§5)
```

## 4. The prompt to send each sub-agent
Copy `templates/AGENT_PROMPT.md`, fill the placeholders, and attach the files it lists. Keep it short: the task file already contains everything. **Do not paste the whole repository or all docs** — weaker agents get worse with more context.

Always attach: `docs/03_CONVENTIONS.md` + `tasks/<ID>.md` + every file under the task's *Read-only inputs*. Add `docs/02_ARCHITECTURE.md` for dev/test tasks and `docs/05_DESIGN_BRIEF.md` for design tasks only when the task lists them.

## 5. Human gates (do not pass without Shuki)
| Gate | When | Shuki confirms |
|---|---|---|
| **G1 — Foundation** | after Wave 0 | decisions in `07_DECISIONS_FOR_SHUKI.md`; Base44 app + API key exist; O-01 spike result (deploy works) |
| **G2 — Look & feel** | after D-04 (mockups) | the visual direction is right. D-04 is marked `done` only after Shuki approves, so the wave-4 pages (which depend on D-04) cannot start before G2 |
| **G3 — Launch** | after the wave-6 QA tasks, before L-01 | field test (H-05) passed; content & sensitivity sign-off (H-06); rights statement accurate |

## 6. Review checklist (orchestrator, every task)
1. Report exists, status `DONE`, all acceptance criteria ticked with evidence.
2. Verify commands re-run by you: green.
3. Diff limited to owned files.
4. Spot-check Conventions §1 (content ethics) for any UI/content change: no invented facts, no press photos, no celebratory copy, no autoplay.
5. For content tasks: run `npm test -- tests/integrity` — must be green.
6. For UI tasks: open the preview at 390 px and 1440 px; look at it.
7. For `opus`/`fable` tasks: optional fresh-context reviewer pass.

## 7. Parallelism and conflicts
- Every task declares `owns` (files/folders it may write). The generator rejects two tasks **in the same wave** owning the same path.
- Shared files are owned by exactly one task at a time: `package.json` (P0-01, later only tasks that list it), `src/i18n/he.ts` (P0-02, then D-07 values only), `src/content/schema.ts` (P0-02, frozen), `vite.config.ts` (P0-01, then F-18 for PWA), `playwright.config.ts` (P0-03).
- If an agent needs a shared file it doesn't own → BLOCKED → orchestrator creates a tiny follow-up task.

## 8. When things go wrong
| Symptom | Action |
|---|---|
| Agent invented content | Reject immediately; re-dispatch with Conventions §1.1 quoted at the top of the prompt; consider a more literal agent |
| Agent edited files it doesn't own | Reject; ask to revert those files |
| Agent stuck after 2 review rounds | Split the task, or move it one model tier up (haiku → sonnet → opus → fable) |
| Flaky E2E | Re-run once; if flaky twice in a week create a fix task — never `skip` without approval |
| `deploy-dist` failing | Check rate limit (5/min per workspace) and size limits; if the API changed, follow Risk R-01 fallback |

## 9. Using the Base44 tools
- Use the Base44 MCP / API **only** for: creating the app (H-01, if Shuki prefers), discovering the deploy contract (O-01), deploys (O-03), published URL, custom domain (L-01).
- **Never** ask the Base44 builder AI to write or change this app's code — it would diverge from git and be overwritten by the next `deploy-dist`.

## 10. Critical path & waves (overview — full list and graph in `TASK_BOARD.md`)
**Critical path:** P0-01 → P0-02 → F-02 → F-03 → F-06 → F-08 → F-16 → F-18 → T-10 → O-03 → C-04 → H-06 → L-01. Put your strongest agents and your own attention here; everything else has slack.

| Wave | Name | What happens | Tasks |
|---|---|---|---|
| 0 | Foundation | scaffold, contracts in code, test infrastructure, Base44 deploy spike, Shuki's decisions | H-01, P0-01..03, O-01 · **Gate G1** |
| 1 | Parallel lanes start | design principles/tokens/specs/map/icons · converter · pure utils · CI · quote verification · coordinate candidates · family contact | D-01..03, D-05, D-06, F-01, F-02, F-04, O-02, C-02, C-03, H-03 |
| 2 | Building blocks | mockups, microcopy, brand · loader & fixtures · tokens & fonts · app shell · primitives · JSON proofread · coordinates · integrity tests | D-04, D-07, D-08, F-03, F-05..07, C-01, H-02, T-01 · **Gate G2** after D-04 |
| 3 | Components | depth tabs, gate & silence, tour cards, route map, nearby · repo scans | F-08..12, T-02 |
| 4 | Pages | home, tour, station, person, about & sources | F-13..17 |
| 5 | PWA, deploy & end-to-end | offline/PWA, performance, the whole E2E suite, Lighthouse, smoke, deploy pipeline | F-18, F-19, T-03..10, O-03 |
| 6 | QA & launch | design QA, rendered proofread, field test, sign-off, test audit, soft launch | D-09, C-04, H-05, H-06, T-11, L-01 · **Gate G3** before L-01 |
| 7 | Post-launch | family-approved photos | H-04 |

A wave is a planning band, not a barrier: dispatch any task whose dependencies are `done` (§3), even if other tasks of the earlier wave are still running.
