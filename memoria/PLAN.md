# Memoria Enhancement Plan

Memoria is a memory-driven, token-aware workflow toolkit for LLM coding agents.
It now supports compact briefs, durable memories, skills, code ingestion,
semantic search, token-budgeted recall, summaries, clustering, and token savings
reports.

## Current Health

- `npm run typecheck` passes.
- `npm test` passes: 61 tests across 12 test files.
- `npm run build` passes.
- `npm run lint` passes.
- GitHub Actions CI is configured to run install, typecheck, lint, test, and build.

## Current Product Direction

Memoria should not copy Spec-Kit or Squad-Kit. Its best practice is different:

- Use a compact brief instead of long specs.
- Store reusable decisions and conventions as memory.
- Ingest code, skills, briefs, and memories into embeddings.
- Recall only the context needed for the task.
- Measure token savings instead of claiming fixed percentages.

The core workflow is:

```bash
memoria brief create "auth refresh tokens"
memoria memory add decision "Use rotating refresh tokens."
memoria ingest
memoria recall "auth refresh tokens" --budget 4000
memoria savings "auth refresh tokens" --baseline all-indexed --save
```

## Current Benefits

- Local-first memory stored as plain files under `.memoria/`.
- Compact task briefs that avoid large generated planning documents.
- Durable memories for decisions, conventions, notes, and sessions.
- Skill-MD files for reusable LLM instructions.
- Semantic recall over code, skills, briefs, and memories.
- Hybrid semantic + keyword retrieval.
- Explainable recall output with selected and dropped sections.
- Memory update/delete commands.
- Agent slash-command guides with `memoria agent install`.
- Token savings reports that compare baseline context with Memoria recall.
- No required database or daemon.

## Token Savings Position

Token savings depend on project size and prompt habits.

Use this formula:

```text
savings_percent = 100 * (baseline_tokens - memoria_context_tokens) / baseline_tokens
```

Realistic positioning:

- Tiny one-file tasks: 20%-40% savings.
- Normal feature/debug tasks: 50%-85% savings.
- Large or repeated tasks after memory exists: 70%-90% savings.

Memoria should always prefer measured claims from `memoria savings`.

## Priority 0: Retrieval Quality

### 0.1 Symbol-level chunks

Add parser-backed chunks for functions, classes, interfaces, and exports.

Acceptance criteria:

- Search and recall can return focused symbols instead of arbitrary text chunks.

### 0.2 Better TypeScript import resolution

Handle:

- extensionless imports.
- `index.ts` folder imports.
- `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs`, `.cjs`.
- `tsconfig` path aliases.

Acceptance criteria:

- KG relationships connect local imports to actual module entity IDs.

## Priority 1: Memory Workflow

### 1.1 Memory quality controls

- Detect near-duplicate memories.
- Add optional status for decisions: proposed, accepted, superseded.

Acceptance criteria:

- Memory stays useful instead of becoming noisy.

## Priority 2: Live Workflow

### 2.1 Incremental ingest

- Store content hashes for source files, briefs, memories, and skills.
- Re-embed only changed inputs.
- Remove records for deleted files.

Acceptance criteria:

- Re-running ingest on an unchanged project is fast.

### 2.2 Watch mode

Add:

```bash
memoria watch
```

Acceptance criteria:

- File edits update KG and embeddings after debounce.

## Priority 3: Integration

### 3.1 Native agent integrations

Build on the current generated slash-command guides with direct integrations.

Acceptance criteria:

- Claude Code, Codex, Copilot, and Cursor can consume Memoria context with less manual copy/paste.

### 3.2 MCP server mode

Add an MCP server so agents can call Memoria without shell command parsing.

Acceptance criteria:

- Agents can call search, recall, memory add, and savings tools.

## Suggested Release Roadmap

### v0.3: Memory-Aware Recall And Trust

- Briefs and memories embedded during ingest.
- Search and recall include code, skills, briefs, and memories.
- Savings baseline uses unique source files, not overlapping chunks.
- `recall --explain`.
- Deduplication.
- Hybrid search.
- Lint and CI.

### v0.4: Fast And Live

- Incremental ingest.
- Watch mode.

### v0.5: Agent Integration

- Export formats.
- MCP server.
- Package and CI hardening.
