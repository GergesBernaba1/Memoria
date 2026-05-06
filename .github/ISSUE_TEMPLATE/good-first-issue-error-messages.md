---
name: "✅ Good First Issue: Improve error messages"
about: Make Memoria's error messages clearer and more actionable
title: "[Good First Issue] Improve error messages for missing config / API key"
labels: ["good first issue", "dx", "help wanted"]
assignees: ""
---

## Summary

When users run Memoria without an API key set, or in a directory that hasn't been initialized, the error messages are functional but not very helpful. This issue is about making those messages friendlier and actionable — a great first PR for anyone who wants to improve developer experience.

## What to do

Find error messages in `memoria/src/` that could be improved and replace them with clearer versions that:

1. Say **what went wrong** in plain English
2. Tell the user **exactly what to do next** (e.g. which command to run, which env var to set)
3. Optionally include a doc link

### Priority targets

| Scenario | Current behavior | Goal |
|---|---|---|
| No `ANTHROPIC_API_KEY` set | Generic error | Show: `"ANTHROPIC_API_KEY is not set. Add it to your shell profile or .env file. See: GETTING_STARTED.md#api-keys"` |
| Running `recall` before `ingest` | Crashes or empty result | Show: `"No index found. Run \`memoria ingest\` first to index your project."` |
| Running any command outside a `.memoria/` workspace | Unclear error | Show: `"Not a Memoria workspace. Run \`memoria init\` to set one up."` |

## Acceptance criteria

- [ ] At least **2 error messages** improved in the codebase
- [ ] Each improved message includes: what went wrong + what to do next
- [ ] `npm run typecheck`, `npm run lint`, and `npm test` all pass
- [ ] No new dependencies added

## Getting started

```bash
git clone https://github.com/GergesBernaba1/Memoria.git
cd Memoria/memoria
npm install
npm run dev -- recall "test"   # trigger an error to see current messages
```

Search for `throw new Error` and `console.error` in `memoria/src/` to find messages to improve.

## Resources

- [CONTRIBUTING.md](../../CONTRIBUTING.md)
- [GETTING_STARTED.md](../../GETTING_STARTED.md)
