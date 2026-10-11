# How to add a task (orchestrator only)

Add an entry to the right file in `backlog/` and run `python3 scripts/generate_tasks.py`. Never write files in `tasks/` by hand — they are regenerated.

```yaml
- id: F-99                     # lane letter + number; unique
  title: Short imperative title
  agent: dev                   # dev | test | design | content | devops | human
  model: sonnet                # haiku | sonnet | opus | fable | human  (see docs/06_ORCHESTRATION.md §1)
  wave: 3                      # 0..5; must be greater than every dependency's wave
  size: M                      # S ≤ 1h · M 1–3h · L 3–6h (agent time). Split anything bigger.
  status: todo                 # todo | in_progress | review | done | blocked
  depends_on: [F-03, D-03]
  owns:                        # files/folders this task may create or modify (no overlaps within a wave)
    - src/components/tour/Example.tsx
    - tests/component/Example.test.tsx
  reads:                       # read-only inputs the agent must be given
    - docs/02_ARCHITECTURE.md
    - design/components/tour.md
  goal: One sentence. What exists when this is done.
  context: |
    2–5 sentences: why it matters and anything non-obvious.
  steps:
    - Concrete, ordered, small steps. Name files, functions, props, test IDs.
  dont:
    - Specific things NOT to do (the mistakes a weaker agent is likely to make).
  acceptance:
    - Checkable statements. Prefer "test X passes" / "command Y exits 0" / "file Z contains …".
  verify:
    - npm run lint
    - npm test -- tests/component/Example.test.tsx
```

Writing tips for weaker agents:
- One outcome per task. If the title has "and", consider splitting.
- Give exact names (files, functions, props, `data-testid`, test IDs) — never "something like".
- Put the most likely mistake in `dont`.
- Acceptance must be verifiable by a command or by looking at one specific thing.
