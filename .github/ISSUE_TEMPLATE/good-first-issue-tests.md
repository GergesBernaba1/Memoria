---
name: "✅ Good First Issue: Add tests for a CLI command"
about: Write missing Vitest tests for one of Memoria's CLI commands
title: "[Good First Issue] Add tests for `memoria <command>`"
labels: ["good first issue", "tests", "help wanted"]
assignees: ""
---

## Summary

Several Memoria CLI commands are either untested or lightly tested. This issue is a great entry point for anyone who wants to contribute — no deep knowledge of the internals required, just TypeScript and Vitest.

## What to do

Pick **one** command from the list below and write tests for it using [Vitest](https://vitest.dev/). Existing test files in `memoria/src/` are great examples to follow.

### Candidate commands (pick one)

- [ ] `memoria doctor` — workspace health checks
- [ ] `memoria savings` — token/cost comparison reporting
- [ ] `memoria memory list` — listing stored memories
- [ ] `memoria feature list` — listing active Feature Memory Packets
- [ ] `memoria search` — semantic search over indexed content

## Acceptance criteria

- [ ] At least **3 meaningful test cases** for the chosen command (happy path, missing args, edge case)
- [ ] Tests use the existing Vitest setup in `memoria/src/`
- [ ] `npm test` passes with no new failures
- [ ] `npm run typecheck` and `npm run lint` pass

## Getting started

```bash
git clone https://github.com/GergesBernaba1/Memoria.git
cd Memoria/memoria
npm install
npm test          # run existing tests to verify your setup
```

Browse `memoria/src/commands/` to find the command you want to test, and `memoria/src/*.test.ts` for examples.

## Resources

- [Vitest docs](https://vitest.dev/)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)

**Comment below to claim a command before you start, so we don't get duplicates!**
