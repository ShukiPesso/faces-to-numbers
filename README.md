# Faces to Numbers — Self-Guided Tour Web App
### Build plan & task backlog for multi-agent development

> **לשוקי (עברית):** זו חבילת התכנון המלאה לבניית האתר. המשימות כתובות באנגלית בכוונה — זו השפה שבה סוכני קוד עובדים הכי מדויק, וכל הקוד והכלים באנגלית. כל התוכן שמוצג באתר נשאר בעברית. מה שדורש החלטה שלך מרוכז במסמך אחד בעברית: `docs/07_DECISIONS_FOR_SHUKI.md` — כדאי להתחיל ממנו. המשימות שמסומנות `human` הן שלך.

---

## What we are building

A **Hebrew, mobile-first, offline-capable web app (PWA)** that lets visitors walk/drive the Gaza-envelope October 7 memorial route **by themselves, without a guide**. Each stop tells the story of one real, documented person ("faces to numbers"). The app must work in a moving car (a passenger reads aloud), in direct sunlight, and with weak or no cellular signal.

It is hosted on **Base44** (published via Base44's `deploy-dist` endpoint), but built as a standard static site in a git repository so that many agents can work in parallel and everything can be tested properly. See `docs/02_ARCHITECTURE.md` → ADR-001 for why.

---

## Read order

| Who | Read first | Then |
|---|---|---|
| **Orchestrator** (the agent or person dispatching work) | this README → `docs/06_ORCHESTRATION.md` | `TASK_BOARD.md`, `backlog/*.yaml` |
| **Every sub-agent** (always) | `docs/03_CONVENTIONS.md` | its own task file in `tasks/` + the files the task lists under *Read-only inputs* |
| **Dev / test agents** | `docs/02_ARCHITECTURE.md`, `docs/04_TESTING_STRATEGY.md` | `contracts/` |
| **Design agents** | `docs/05_DESIGN_BRIEF.md` | `content-source/` (to feel the material) |
| **Content agents** | `content-source/README.md` | `contracts/content.schema.ts` |
| **Shuki (human)** | `docs/07_DECISIONS_FOR_SHUKI.md` (Hebrew) | tasks whose agent type is `human` |

A sub-agent should **never** need to read the whole repository. If a task requires knowledge that is not in its listed inputs, that is a bug in the task — the agent must stop and report it (see Conventions § Escalation).

---

## Folder map

```
otef-tour-plan/
├── README.md                    ← you are here
├── TASK_BOARD.md                ← generated: all tasks by wave, with dependencies
├── docs/
│   ├── 01_PROJECT_BRIEF.md      ← product, users, scope, success criteria
│   ├── 02_ARCHITECTURE.md       ← stack, ADRs, folder tree, routes, module contracts
│   ├── 03_CONVENTIONS.md        ← RULES every agent follows (content ethics first)
│   ├── 04_TESTING_STRATEGY.md   ← unit / component / integrity / E2E catalog
│   ├── 05_DESIGN_BRIEF.md       ← for design agents
│   ├── 06_ORCHESTRATION.md      ← how to dispatch agents, waves, review, merge
│   ├── 07_DECISIONS_FOR_SHUKI.md← open human decisions (Hebrew)
│   └── 08_RISKS.md              ← risk register
├── contracts/                   ← frozen data contracts (zod schema, strings, examples)
├── content-source/              ← CANONICAL Hebrew content. The only source of facts.
├── templates/                   ← task, report and agent-prompt templates
├── backlog/*.yaml               ← SINGLE SOURCE OF TRUTH for tasks (machine-readable)
├── tasks/*.md                   ← generated: one self-contained file per task
└── scripts/generate_tasks.py    ← regenerates tasks/ and TASK_BOARD.md, validates the graph
```

**Edit tasks only in `backlog/*.yaml`**, then run:

```bash
python3 scripts/generate_tasks.py
```

The script regenerates `tasks/` and `TASK_BOARD.md` and fails if a dependency is missing, the graph has a cycle, a task depends on a later wave, or two tasks in the same wave claim the same file.

---

## The ten rules that matter most

1. **Never invent, embellish or paraphrase facts about real people.** All facts come verbatim from `content-source/`. Missing → leave it out and report. (Conventions §1)
2. **Never render press photos.** Photos stay `pending` until rights and family consent are cleared by Shuki.
3. **No gamification, no celebration, no autoplay.** No points, badges, confetti, streaks, "well done!". No sound or video starts by itself.
4. **The driver never uses the app.** Drive segments are designed for a passenger reading aloud.
5. **Offline is a core feature, not an extra.** Everything must work after the first load with no signal.
6. **Mobile first, RTL always.** Hebrew, `dir="rtl"`, logical CSS properties, 44px tap targets, readable in sunlight.
7. **Stay inside your task.** Edit only the files your task owns. Do not refactor neighbours.
8. **Contracts are frozen.** Do not change `contracts/` or `src/content/schema.ts` without an orchestrator task.
9. **Done means verified.** Run the task's verify commands; paste the results into your report.
10. **When unsure — stop and ask.** A written question in your report is always better than a guess.
