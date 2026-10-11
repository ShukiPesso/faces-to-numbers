#!/usr/bin/env python3
"""
Generate tasks/*.md and TASK_BOARD.md from backlog/*.yaml, and validate the task graph.

Usage:  python3 scripts/generate_tasks.py          # validate + write
        python3 scripts/generate_tasks.py --check  # validate only (exit 1 on problems)

Validation (any failure → exit 1, nothing written):
  - required fields present, enums valid, ids unique
  - every depends_on id exists; no dependency on a LATER wave; no cycles
  - no two tasks in the SAME wave own overlapping paths ("a/" owns everything under a/)
  - every read input exists already or is owned by the task itself or one of its (transitive) dependencies
"""
from __future__ import annotations
import pathlib, re, sys
from collections import defaultdict, deque
import yaml

ROOT = pathlib.Path(__file__).resolve().parent.parent
BACKLOG, TASKS = ROOT / "backlog", ROOT / "tasks"
REQUIRED = ["id", "title", "agent", "model", "wave", "size", "status", "depends_on",
            "owns", "reads", "goal", "steps", "acceptance", "verify"]
AGENTS = {"dev", "test", "design", "content", "devops", "human"}
MODELS = {"haiku", "sonnet", "opus", "fable", "human"}
SIZES = {"S": 1, "M": 2, "L": 4}
STATUSES = {"todo", "in_progress", "review", "done", "blocked"}
WAVE_NAMES = {
    0: "Foundation", 1: "Parallel lanes start", 2: "Building blocks", 3: "Components",
    4: "Pages", 5: "PWA, deploy & end-to-end tests", 6: "QA & launch", 7: "Post-launch",
}
GATES = {
    0: "**Gate G1 — Foundation** (Shuki): decisions answered, Base44 app + key, deploy spike works.",
    2: "**Gate G2 — Look & feel** (Shuki): approve the mockups from D-04 before wave-4 pages are built.",
    6: "**Gate G3 — Launch** (Shuki): field test H-05 passed and sign-off H-06 before L-01.",
}
CMD_RE = re.compile(r"^(npm|npx|node|bash|grep|diff|ls|file|curl|git|du|python3|DIST_DIR|LIVE_URL|!|cat|test )")


def load() -> list[dict]:
    tasks = []
    for f in sorted(BACKLOG.glob("*.yaml")):
        data = yaml.safe_load(f.read_text(encoding="utf-8")) or []
        for t in data:
            t["_file"] = f.name
            tasks.append(t)
    return tasks


def overlaps(a: str, b: str) -> bool:
    a2, b2 = a.rstrip("/"), b.rstrip("/")
    return a2 == b2 or a2.startswith(b2 + "/") or b2.startswith(a2 + "/")


def validate(tasks: list[dict]) -> list[str]:
    errs, byid = [], {}
    for t in tasks:
        tid = t.get("id", "?")
        for k in REQUIRED:
            if k not in t or t[k] in (None, ""):
                errs.append(f"{tid}: missing field '{k}' ({t['_file']})")
        if tid in byid:
            errs.append(f"{tid}: duplicate id")
        byid[tid] = t
        if t.get("agent") not in AGENTS: errs.append(f"{tid}: bad agent {t.get('agent')}")
        if t.get("model") not in MODELS: errs.append(f"{tid}: bad model {t.get('model')}")
        if t.get("size") not in SIZES: errs.append(f"{tid}: bad size {t.get('size')}")
        if t.get("status") not in STATUSES: errs.append(f"{tid}: bad status {t.get('status')}")
        if not isinstance(t.get("wave"), int) or t["wave"] not in WAVE_NAMES:
            errs.append(f"{tid}: bad wave {t.get('wave')}")
    if errs:
        return errs
    for t in tasks:
        for d in t["depends_on"]:
            if d not in byid:
                errs.append(f"{t['id']}: unknown dependency {d}")
            elif byid[d]["wave"] > t["wave"]:
                errs.append(f"{t['id']} (wave {t['wave']}) depends on later-wave {d} (wave {byid[d]['wave']})")
    # cycles (Kahn)
    indeg = {t["id"]: 0 for t in tasks}
    out = defaultdict(list)
    for t in tasks:
        for d in t["depends_on"]:
            if d in byid:
                out[d].append(t["id"]); indeg[t["id"]] += 1
    q = deque(k for k, v in indeg.items() if v == 0); seen = 0
    while q:
        n = q.popleft(); seen += 1
        for m in out[n]:
            indeg[m] -= 1
            if indeg[m] == 0: q.append(m)
    if seen != len(tasks):
        errs.append("dependency cycle among: " + ", ".join(k for k, v in indeg.items() if v > 0))
    # same-wave ownership conflicts
    bywave = defaultdict(list)
    for t in tasks: bywave[t["wave"]].append(t)
    for w, ts in bywave.items():
        for i, a in enumerate(ts):
            for b in ts[i + 1:]:
                for pa in a["owns"]:
                    for pb in b["owns"]:
                        if overlaps(pa, pb):
                            errs.append(f"wave {w}: {a['id']} and {b['id']} both own '{pa}' / '{pb}'")
    # every read input must already exist in the repo, or be produced by the task itself or by one
    # of its (transitive) dependencies — otherwise an agent would start without its inputs
    if errs:
        return errs
    def ancestors(tid: str, acc: set | None = None) -> set:
        acc = set() if acc is None else acc
        for d in byid[tid]["depends_on"]:
            if d not in acc:
                acc.add(d); ancestors(d, acc)
        return acc
    for t in tasks:
        anc = ancestors(t["id"]) | {t["id"]}
        for r in t["reads"]:
            if (ROOT / r.rstrip("/")).exists():
                continue
            producers = [o["id"] for o in tasks for p in o["owns"] if overlaps(r, p)]
            if not producers:
                errs.append(f"{t['id']}: reads '{r}' which does not exist and no task owns it")
            elif not anc.intersection(producers):
                errs.append(f"{t['id']}: reads '{r}' (made by {', '.join(producers)}) but does not depend on it")
    return errs


def critical_path(tasks: list[dict]) -> list[str]:
    byid = {t["id"]: t for t in tasks}
    memo: dict[str, tuple[int, list[str]]] = {}
    def best(tid: str) -> tuple[int, list[str]]:
        if tid in memo: return memo[tid]
        t = byid[tid]; w = SIZES[t["size"]]
        cands = [best(d) for d in t["depends_on"]]
        bw, bp = max(cands, key=lambda x: x[0]) if cands else (0, [])
        memo[tid] = (bw + w, bp + [tid]); return memo[tid]
    return max((best(t["id"]) for t in tasks), key=lambda x: x[0])[1]


def fmt_item(s: str) -> str:
    s = str(s).strip()
    return f"`{s}`" if CMD_RE.match(s) and "`" not in s else s


def render_task(t: dict, byid: dict, unblocks: dict) -> str:
    deps = ", ".join(f"**{d}** ({byid[d]['title']})" for d in t["depends_on"]) or "none — can start immediately"
    ub = ", ".join(f"{u}" for u in sorted(unblocks.get(t["id"], []))) or "—"
    reads = ["docs/03_CONVENTIONS.md (always)"] + [r for r in t["reads"] if r != "docs/03_CONVENTIONS.md"]
    L = [f"# {t['id']} — {t['title']}", "",
         "| Agent | Model | Wave | Size | Status |", "|---|---|---|---|---|",
         f"| {t['agent']} | {t['model']} | {t['wave']} · {WAVE_NAMES[t['wave']]} | {t['size']} | {t['status']} |", "",
         f"**Depends on:** {deps}  ", f"**Unblocks:** {ub}", "",
         "## Goal", t["goal"].strip(), ""]
    if t.get("context"):
        L += ["## Context", t["context"].strip(), ""]
    L += ["## Read-only inputs"] + [f"- `{r}`" if not r.endswith(")") else f"- {r}" for r in reads] + [""]
    L += ["## Owns files — you may create or modify ONLY these"] + [f"- `{o}`" for o in t["owns"]] \
         + [f"- `reports/{t['id']}.md` (your report)", ""]
    L += ["## Steps"] + [f"{i}. {s.strip()}" for i, s in enumerate(t["steps"], 1)] + [""]
    if t.get("dont"):
        L += ["## Do NOT"] + [f"- {d.strip()}" for d in t["dont"]] + [""]
    L += ["## Acceptance criteria — all must be true"] + [f"- [ ] {a.strip()}" for a in t["acceptance"]] + [""]
    L += ["## How to verify"] + [f"- {fmt_item(v)}" for v in t["verify"]] + [""]
    if t.get("appendix"):
        L += ["## Appendix", t["appendix"].strip(), ""]
    L += ["## Definition of Done",
          "Conventions §10 applies. Write `reports/" + t["id"] + ".md` from `templates/REPORT_TEMPLATE.md`. "
          "If anything is unclear or missing: stop, set status BLOCKED in the report, and ask (Conventions §11).", ""]
    return "\n".join(L)


def render_board(tasks: list[dict], cp: list[str]) -> str:
    byid = {t["id"]: t for t in tasks}
    n_by_agent = defaultdict(int)
    for t in tasks: n_by_agent[t["agent"]] += 1
    L = ["# Task Board", "",
         "_Generated by `scripts/generate_tasks.py` from `backlog/*.yaml` — do not edit by hand._", "",
         f"**{len(tasks)} tasks** · " + " · ".join(f"{a}: {n}" for a, n in sorted(n_by_agent.items())), "",
         "## Critical path", " → ".join(cp), "",
         "## How to read this", "- A task may start when every task in *Depends on* is `done`.",
         "- Tasks in the same wave run in parallel as soon as their own dependencies are done (some depend on a task earlier in the same wave). The generator guarantees that tasks in the same wave never own the same files.",
         "- Model per task: `haiku` = mechanical and fully specified · `sonnet` = normal implementation · `opus` = infrastructure, architecture-heavy or tricky · `fable` = highest stakes (anti-hallucination core, fact verification, design direction, final test audit) · `human` = Shuki. See docs/06_ORCHESTRATION.md §1.", ""]
    bywave = defaultdict(list)
    for t in tasks: bywave[t["wave"]].append(t)
    for w in sorted(bywave):
        L += [f"## Wave {w} — {WAVE_NAMES[w]}", ""]
        L += ["| ID | Title | Agent | Model | Size | Depends on | Status |", "|---|---|---|---|---|---|---|"]
        for t in sorted(bywave[w], key=lambda x: x["id"]):
            L.append(f"| [{t['id']}](tasks/{t['id']}.md) | {t['title']} | {t['agent']} | {t['model']} | "
                     f"{t['size']} | {', '.join(t['depends_on']) or '—'} | {t['status']} |")
        L.append("")
        if w in GATES: L += [GATES[w], ""]
    L += ["## Dependency graph", "", "```mermaid", "flowchart LR"]
    for w in sorted(bywave):
        L.append(f'  subgraph W{w}["Wave {w} · {WAVE_NAMES[w]}"]')
        for t in sorted(bywave[w], key=lambda x: x["id"]):
            nid = t["id"].replace("-", "_")
            L.append(f'    {nid}["{t["id"]}"]')
        L.append("  end")
    for t in tasks:
        for d in t["depends_on"]:
            L.append(f'  {d.replace("-", "_")} --> {t["id"].replace("-", "_")}')
    L += ["```", "", "## Later (not yet broken into tasks)",
          "- Audio narration per station (Hebrew; Shuki's speech-technology expertise).",
          "- English version.", "- Interactive map with online tiles (optional, never required for offline).",
          "- Feedback form for families and visitors (could use Base44 entities).",
          "- Print stylesheet for station and person pages.", ""]
    return "\n".join(L)


def main() -> int:
    tasks = load()
    errs = validate(tasks)
    if errs:
        print("VALIDATION FAILED:"); [print("  -", e) for e in errs]; return 1
    byid = {t["id"]: t for t in tasks}
    unblocks = defaultdict(list)
    for t in tasks:
        for d in t["depends_on"]: unblocks[d].append(t["id"])
    cp = critical_path(tasks)
    if "--check" in sys.argv:
        print(f"OK: {len(tasks)} tasks valid. Critical path: {' → '.join(cp)}"); return 0
    TASKS.mkdir(exist_ok=True)
    for old in TASKS.glob("*.md"): old.unlink()
    for t in tasks:
        (TASKS / f"{t['id']}.md").write_text(render_task(t, byid, unblocks), encoding="utf-8")
    (ROOT / "TASK_BOARD.md").write_text(render_board(tasks, cp), encoding="utf-8")
    waves = defaultdict(int)
    for t in tasks: waves[t["wave"]] += 1
    print(f"OK: wrote {len(tasks)} task files + TASK_BOARD.md")
    print("Tasks per wave:", dict(sorted(waves.items())))
    print("Critical path:", " → ".join(cp))
    return 0


if __name__ == "__main__":
    sys.exit(main())
