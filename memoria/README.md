<p align="center">
  <img src="assets/memoria-logo.svg" alt="Memoria" width="520" />
</p>

<p align="center">
  <strong>Memory-driven, token-aware development workflow for LLM coding agents.</strong>
</p>

<p align="center">
  <a href="../LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg" /></a>
  <img alt="Node.js >=20" src="https://img.shields.io/badge/node-%3E%3D20-339933.svg" />
  <img alt="CLI first" src="https://img.shields.io/badge/workflow-CLI%20first-111827.svg" />
</p>

Memoria helps developers work with LLMs through a compact memory-first workflow.
Instead of repeatedly pasting broad project context, Memoria stores compact
briefs, reusable skills, durable project memories, summaries, embeddings, and
token-savings reports as plain files under `.memoria/`.

The goal is simple: guide LLM-assisted development while sending less repeated
context to the model.

## Why Memoria

- Use one compact brief per task instead of large generated planning documents.
- Start, inspect, and finish Feature Memory Packets with one command group.
- Save durable decisions, conventions, and session notes as project memory.
- Recall only the most relevant code, notes, briefs, and skills for the task.
- Ask questions directly with `memoria ask`, using recalled context and cache-aware LLM calls.
- Explain why context was selected so developers can audit the result.
- Measure token savings instead of guessing.
- Check setup health with `memoria doctor`.
- Work with Claude Code, Codex, GitHub Copilot Chat, Cursor, Continue, and other agent tools.

## What Memoria Provides

- Compact briefs for intent, recall budget, memory links, and execution path.
- Feature workflow commands for start/status/finish.
- Durable project memories for decisions, conventions, notes, and sessions.
- Skill-MD files for reusable LLM instructions.
- Knowledge graph and embeddings for code, skills, briefs, and memories.
- Token-budgeted context assembly with explainable `memoria recall`.
- Context-grounded answers with `memoria ask`, optional LLM reranking, and cache stats.
- Hybrid semantic and keyword retrieval for more predictable matches.
- Token counting, cost estimation, compression, and savings reports.

## Workflow

```text
init -> ingest -> feature start -> implement -> feature done -> feature packet -> feature finish
```

1. `init` creates the `.memoria/` workspace.
2. `ingest` indexes code, briefs, skills, and memories.
3. `feature start` creates a Feature Memory Packet and recall context.
4. `feature list` and `feature status` show active work and progress.
5. `feature done` marks checklist progress.
6. `feature packet` prints a shareable packet for an AI agent.
7. `feature finish` records durable decisions, refreshes the index, and saves a savings report.
8. `recall` remains available for direct token-budgeted context assembly.

## Install

```bash
npm install
npm run build
npm link
```

Or run from source:

```bash
npm install
npx tsx src/cli.ts <command>
```

## Quickstart

```bash
cd path/to/your/project
memoria init

# Start a Feature Memory Packet
memoria feature start "auth refresh tokens" -d "Add refresh-token support with low-token LLM context."

# Capture durable memory
memoria memory add decision "Use short-lived access tokens and rotating refresh tokens." --title "Refresh token policy" -t auth tokens

# Index and retrieve context directly when needed
memoria ingest
memoria recall "auth refresh tokens" --budget 4000
memoria ask "Where should refresh token rotation be implemented?"

# Finish with durable memory and savings
memoria feature finish "auth refresh tokens" --decision "Use short-lived access tokens and rotating refresh tokens."
```

Install slash-command guidance for an AI coding tool:

```bash
memoria agent install claude
memoria agent install codex
memoria agent install copilot
```

Or install every guide:

```bash
memoria agent install all
```

## Using Memoria With AI Coding Tools

Memoria works as a local context layer for tools like GitHub Copilot Chat,
Claude Code, Codex, Cursor, Continue, and other LLM coding agents.

Current integration is CLI-first:

1. Create or update project memory with Memoria.
2. Run `memoria recall` for the task.
3. Paste the recalled context into your AI tool.

### Existing Project

```bash
cd existing-project
memoria init
memoria feature start "understand auth flow" -d "Map current auth behavior and token handling."
memoria memory add convention "Follow existing service and repository patterns before adding new abstractions."
memoria ingest
memoria recall "understand auth flow" --budget 4000 --explain
```

Paste the recall output into your AI coding tool with this prompt:

```text
Use the Memoria context below as the source of truth.
Follow the project memories and existing patterns.
Implement the requested task with minimal changes.
Do not invent architecture that conflicts with the retrieved context.

[PASTE MEMORIA RECALL OUTPUT HERE]

Task:
Explain the current auth flow and identify where password reset should fit.
```

### New Project

```bash
mkdir my-app
cd my-app
git init
memoria init
memoria feature start "build initial app" -d "Create the first working version with clean architecture."
memoria memory add decision "Keep the first version small and avoid premature abstractions."
```

After adding code:

```bash
memoria ingest
memoria recall "build initial app" --budget 3000
```

### Feature Workflow

```bash
memoria feature start "add password reset" -d "Add password reset using existing auth patterns."
memoria feature done "add password reset" "1"
memoria feature packet "add password reset"
memoria feature status "add password reset"
```

Then ask your AI coding tool:

```text
Use this Memoria context as the source of truth.
Implement password reset support.
Keep changes scoped and consistent with the recalled files, memories, and skills.

[PASTE MEMORIA RECALL OUTPUT HERE]
```

### Measuring Savings

```bash
memoria savings "add password reset" --baseline all-indexed --save
memoria feature finish "add password reset" --decision "Password reset tokens expire after 15 minutes."
```

This reports baseline tokens, recalled-context tokens, saved tokens, savings
percentage, and estimated cost savings.

### Slash-Command Guides

Memoria can generate instruction files that teach AI coding tools how to map
`/memoria.*` slash commands to real CLI commands:

```bash
memoria agent install all
```

This writes guides under:

```text
.memoria/agents/
|-- README.md
|-- generic.md
|-- claude.md
|-- codex.md
|-- copilot.md
`-- cursor.md
```

Example slash commands for the AI tool:

```text
/memoria.brief add password reset
/memoria.feature.start add password reset
/memoria.feature.list
/memoria.feature.status add password reset
/memoria.feature.done add password reset 1
/memoria.feature.packet add password reset
/memoria.memory decision Password reset tokens expire after 15 minutes
/memoria.ingest
/memoria.recall add password reset
/memoria.feature.finish add password reset
/memoria.savings add password reset
/memoria.doctor
```

The generated guide tells the agent to translate those into commands like:

```bash
memoria brief create "add password reset"
memoria feature start "add password reset"
memoria feature list
memoria feature status "add password reset"
memoria feature done "add password reset" "1"
memoria feature packet "add password reset"
memoria memory add decision "Password reset tokens expire after 15 minutes"
memoria ingest
memoria recall "add password reset" --budget 4000 --explain
memoria feature finish "add password reset"
memoria savings "add password reset" --baseline all-indexed --save
memoria doctor
```

### Recommended Agent Prompt

Use this shape with Claude Code, Codex, Copilot Chat, Cursor, Continue, or any
LLM coding agent:

```text
Use the Memoria context below as the source of truth.
Follow retrieved memories and existing project patterns.
Keep the implementation small and update memory when you learn reusable facts.

[PASTE MEMORIA RECALL OUTPUT HERE]

Task:
[YOUR TASK HERE]
```

## Commands

### Foundation

- `memoria init` - scaffold a `.memoria/` directory.
- `memoria config get|set` - read and edit project settings.

### Workflow

- `memoria brief create <name>` - create one compact `.memoria/briefs/<name>.md` file.
- `memoria brief path <name>` - refresh the implementation path section.
- `memoria brief checklist <name>` - refresh the checklist section.
- `memoria brief list|show` - inspect briefs.
- `memoria feature start <name>` - create or refresh a Feature Memory Packet and recall context.
- `memoria feature list` - list Feature Memory Packets.
- `memoria feature status <name>` - show checklist, related memory, and savings state.
- `memoria feature done <name> <item>` - mark a checklist item done by number or text.
- `memoria feature packet <name>` - print a shareable Feature Memory Packet.
- `memoria feature finish <name>` - save final memory, refresh index, and write a savings report.

### Memory

- `memoria memory add <type> <text>` - add `decision`, `note`, `convention`, or `session`.
- `memoria memory update <id>` - update text, title, tags, or type.
- `memoria memory delete <id> --yes` - delete a memory.
- `memoria memory list` - list saved memories.
- `memoria memory show <id>` - show a memory by id or prefix.
- `memoria memory search <query>` - keyword search memories.

### Skills

- `memoria skill create <name>` - create a reusable Skill-MD file.
- `memoria skill list|show|delete` - manage skills.

### Retrieval

- `memoria ingest [--no-embed] [--full]` - refresh KG and embeddings, including briefs and memories.
- `memoria search <query>` - semantic search code, skills, briefs, and memories.
- `memoria recall <query> --explain` - assemble token-budgeted context and show why sections were selected.
- `memoria ask <query>` - ask an LLM using recalled Memoria context.
- `memoria ask <query> --rerank` - rerank recalled candidates with a cheap LLM before answering.
- `memoria summarize [target]` - summarize source files.
- `memoria cluster` - cluster code embeddings.

### Agent Guides

- `memoria agent install <target>` - generate slash-command guidance for `generic`, `claude`, `codex`, `copilot`, `cursor`, or `all`.
- `memoria doctor` - check workspace setup, index files, agent instructions, and project memory counts.

### Tokens

- `memoria tokens count <input>` - count tokens for a file or string.
- `memoria tokens estimate <input>` - estimate model cost.
- `memoria tokens compress <input>` - lossless whitespace compression.
- `memoria savings <query>` - compare baseline context tokens with Memoria recall tokens.

## `.memoria/` Layout

```text
.memoria/
|-- config.json
|-- briefs/
|   `-- auth-refresh-tokens.md
|-- memory/
|-- agents/
|-- skills/
|-- reports/
|   `-- savings/
|-- knowledge_graph/
|   |-- entities.json
|   |-- relationships.json
|   |-- clusters.json
|   `-- summaries/
`-- embeddings/
    |-- index_metadata.json
    |-- code_embeddings.jsonl
    |-- skill_embeddings.jsonl
    `-- context_embeddings.jsonl
```

## Token Savings

Memoria should not claim a fixed savings percentage for every task. Savings
depend on project size, prompt habits, and recall quality.

Use this formula:

```text
savings_percent = 100 * (baseline_tokens - memoria_context_tokens) / baseline_tokens
```

The `memoria savings` command generates this measurement for a project. A
realistic target is 50%-85% savings for common development workflows after
ingest and summarization, with higher savings possible on large or repetitive
tasks.

## Development

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Open Source

- [Contributing](../CONTRIBUTING.md)
- [Code of Conduct](../CODE_OF_CONDUCT.md)
- [Security Policy](../SECURITY.md)
- [Support](../SUPPORT.md)

## License

MIT. See [LICENSE](LICENSE).
