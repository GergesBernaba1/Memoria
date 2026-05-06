---
name: "✅ Good First Issue: Write a new USE_CASES scenario"
about: Add a real-world workflow scenario to USE_CASES.md
title: "[Good First Issue] Add USE_CASE scenario for <your scenario>"
labels: ["good first issue", "docs", "help wanted"]
assignees: ""
---

## Summary

[USE_CASES.md](../../USE_CASES.md) documents real-world Memoria workflows. Adding more scenarios helps new users quickly see how Memoria fits into their own day-to-day. **This is a pure docs contribution — no code required.**

## What to do

Write a new scenario section in `USE_CASES.md` for **one** of the following (or propose your own):

### Open scenarios (pick one)

- [ ] **Python / Django project** — workflow for a backend Python developer
- [ ] **Monorepo** — using Memoria across multiple packages in a single repo
- [ ] **Open source maintainer** — onboarding a new contributor to a public repo using Memoria memories
- [ ] **Solo weekend project** — quick setup for a small personal project
- [ ] **Pre-PR review prep** — using recall to give an AI agent focused context before reviewing a pull request
- [ ] **Data science / Jupyter notebook project** — adapting Memoria to a notebooks-based workflow

## Format to follow

Each scenario should include:

```markdown
## Scenario: <name>

**Situation:** One sentence describing the developer and the task.

**Commands:**
```bash
# Step 1: ...
memoria <command> "..."

# Step 2: ...
memoria <command> "..."
```

**What Memoria does:** Brief explanation of what gets stored/recalled.

**Result:** What the developer gets out of it (time saved, cost saved, quality improvement).
```

## Acceptance criteria

- [ ] New scenario added to `USE_CASES.md` following the existing format
- [ ] Commands are real `memoria` CLI commands (check `memoria --help`)
- [ ] Scenario is realistic and useful to developers in that situation
- [ ] Spelling and grammar checked

## Getting started

```bash
git clone https://github.com/GergesBernaba1/Memoria.git
# Read USE_CASES.md to see the existing format
# Edit USE_CASES.md and add your scenario
```

**Comment below with the scenario you want to write so we don't get duplicates!**

## Resources

- [USE_CASES.md](../../USE_CASES.md) — existing scenarios to model yours on
- [Full CLI Reference](../../memoria/README.md) — all available commands
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
