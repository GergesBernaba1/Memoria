---
name: "✅ Good First Issue: Add --dry-run to memoria ingest"
about: Add a --dry-run flag that previews what would be indexed without writing files
title: "[Good First Issue] Add `--dry-run` flag to `memoria ingest`"
labels: ["good first issue", "feature", "help wanted"]
assignees: ""
---

## Summary

The `memoria ingest` command indexes the project and writes embedding/knowledge-graph files to `.memoria/`. Before committing to a full ingest (which can take a few minutes on large projects), it would be useful to see **what files would be indexed** without actually writing anything. A `--dry-run` flag would provide that preview.

## What to do

Add a `--dry-run` flag to `memoria ingest` that:
1. Scans the project exactly as a normal `ingest` would
2. Prints the list of files that **would** be indexed (with counts)
3. Exits **without writing** any `.memoria/` files

## Expected behavior

```bash
memoria ingest --dry-run

# Output example:
# Dry run — no files will be written.
#
# Would index 43 files:
#   src/commands/recall.ts
#   src/commands/ingest.ts
#   src/core/config.ts
#   ... (40 more)
#
# Skipping 12 files (matches .memoriaignore / node_modules / dist):
#   node_modules/...
#   dist/...
#
# Run `memoria ingest` to index these files.
```

## Acceptance criteria

- [ ] `memoria ingest --dry-run` prints file list and exits without writing
- [ ] Output clearly states "Dry run — no files will be written"
- [ ] Shows counts: files that would be indexed vs. skipped
- [ ] Normal `memoria ingest` (without flag) is unchanged
- [ ] `npm run typecheck`, `npm run lint`, and `npm test` all pass
- [ ] At least one test covers the dry-run path

## Getting started

```bash
git clone https://github.com/GergesBernaba1/Memoria.git
cd Memoria/memoria
npm install
npm run dev -- ingest --help    # see current flags
```

The ingest command lives in `memoria/src/commands/ingest.ts`. Add the `--dry-run` option using `commander` (already used throughout the project).

## Resources

- [commander docs](https://github.com/tj/commander.js)
- [CONTRIBUTING.md](../../CONTRIBUTING.md)
