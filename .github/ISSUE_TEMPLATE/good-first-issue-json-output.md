---
name: "✅ Good First Issue: Add --json flag to memoria savings"
about: Add machine-readable JSON output to the savings command
title: "[Good First Issue] Add `--json` flag to `memoria savings`"
labels: ["good first issue", "feature", "help wanted"]
assignees: ""
---

## Summary

The `memoria savings` command currently prints a human-readable report to stdout. This is great for developers reading it in the terminal, but makes it hard to use in scripts, CI pipelines, or dashboards. Adding a `--json` flag would let power users pipe the output to other tools.

## What to do

Add a `--json` flag to the `memoria savings` command so that passing it outputs structured JSON instead of the formatted text report.

## Expected behavior

```bash
# Current (human-readable)
memoria savings "add auth"
# Recalled: 8,167 tokens | Baseline: 45,234 tokens | Saved: 37,067 (82%) | ~$0.56

# New (machine-readable)
memoria savings "add auth" --json
# {
#   "task": "add auth",
#   "recalledTokens": 8167,
#   "baselineTokens": 45234,
#   "savedTokens": 37067,
#   "savingsPercent": 82,
#   "estimatedDollars": 0.56
# }
```

## Acceptance criteria

- [ ] `memoria savings <task> --json` outputs valid JSON to stdout
- [ ] JSON includes: `task`, `recalledTokens`, `baselineTokens`, `savedTokens`, `savingsPercent`, `estimatedDollars`
- [ ] Human-readable output is unchanged when `--json` is not passed
- [ ] `npm run typecheck`, `npm run lint`, and `npm test` all pass
- [ ] At least one test covers the `--json` output path

## Getting started

```bash
git clone https://github.com/GergesBernaba1/Memoria.git
cd Memoria/memoria
npm install
npm run dev -- savings --help    # see current flags
```

The savings command lives in `memoria/src/commands/savings.ts`. The `commander` library (already used throughout) makes adding flags straightforward.

## Resources

- [commander docs](https://github.com/tj/commander.js)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
