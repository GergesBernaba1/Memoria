# Memoria Use Cases

Memoria helps developers give AI coding agents strong project memory without paying to resend the whole codebase on every request. The CLI creates local memory, indexes project context, recalls only relevant sections, and records decisions that future AI sessions can reuse.

## Memory-First Planning

Memoria helps AI agents implement correctly with the smallest useful context. It keeps planning close to the codebase, project memory, and token budget.

For each feature, Memoria can create a **Feature Memory Packet**:

```text
brief + implementation path + checklist + recalled context + durable decisions + savings report
```

| Packet part | Command | Value |
| --- | --- | --- |
| Start packet | `memoria feature start "<feature>"` | Creates or refreshes the brief, path, checklist, and recall context |
| Status | `memoria feature status "<feature>"` | Shows checklist progress, related memory, and savings reports |
| Finish packet | `memoria feature finish "<feature>" --decision "<text>"` | Saves durable memory, refreshes the index, and writes a savings report |
| Direct recall | `memoria recall "<feature>" --budget 4000 --explain` | Gives the agent relevant context without the full repo |
| Workspace check | `memoria doctor` | Verifies setup, index files, and agent instruction files |

This keeps planning implementation-focused, memory-aware, and measurable instead of becoming a long one-time planning document.

## New Project Setup

When a user creates a new project, Memoria can become the memory layer from day one:

```bash
cd my-new-project
memoria init
memoria ingest
memoria agent install all
memoria doctor
```

| Step | What Memoria does | How it helps |
| --- | --- | --- |
| `memoria init` | Creates the `.memoria/` workspace | Gives the project a local home for memory, briefs, reports, and agent guides |
| `memoria ingest` | Indexes code, docs, configs, skills, briefs, and memory | Lets AI agents retrieve focused context instead of reading everything |
| `memoria agent install all` | Creates instructions for Codex, Claude Code, Copilot, Cursor, Windsurf, and generic tools | Teaches agents how to translate `/memoria.*` chat requests into CLI commands |
| `memoria doctor` | Checks workspace health | Confirms setup and points to missing next steps |

The user can save durable project knowledge early:

```bash
memoria memory add convention "Use TypeScript for all source files" -t architecture
memoria memory add decision "Use SQLite for the first local prototype" -t database
memoria memory add convention "Prefer small composable CLI commands" -t cli
```

Later, instead of asking the agent to inspect the whole project, the user runs:

```bash
memoria recall "build user authentication" --budget 4000 --explain
```

The AI agent receives a compact context pack with relevant files, conventions, decisions, and explanations. This keeps token usage low while making the agent more project-aware.

## Implementing A New Feature

For a new feature, Memoria turns the request into a focused implementation workflow:

```bash
memoria feature start "add password reset" -d "Add password reset email flow using existing auth patterns"
```

| Feature stage | Memoria command | User benefit |
| --- | --- | --- |
| Start feature | `memoria feature start` | Creates the Feature Memory Packet and recalls focused context |
| Check progress | `memoria feature status` | Shows checklist progress, related memory, and savings reports |
| Find context directly | `memoria recall` | Pulls related files, memory, briefs, and summaries into a token budget |
| Save decisions | `memoria feature finish --decision` | Makes feature knowledge reusable in future work |
| Measure value | `memoria feature finish` | Writes a savings report after implementation |

After implementation, the user stores what should persist:

```bash
memoria feature finish "add password reset" --decision "Password reset tokens expire after 15 minutes"
```

Future agents can now recall the implementation pattern and decision without needing the user to explain it again.

The result is a reusable feature memory asset that helps the next AI session start with the right context, known decisions, and a compact execution plan.

## Bug Fixes

For bugs, Memoria helps the user give the AI agent targeted context instead of a full source tree:

```bash
memoria recall "fix login timeout bug" --budget 3000 --explain
```

After the fix, the user records the durable lesson:

```bash
memoria memory add decision "Login timeout was caused by stale session cleanup running before token refresh" -t auth bugfix
memoria ingest
```

Next time a related auth issue appears, the recall can include that bug history.

## Refactoring

Before a refactor, Memoria captures the goal and recalls related architecture:

```bash
memoria feature start "refactor payment service" -d "Split payment service into provider adapter and checkout orchestration"
```

After the refactor, the user saves the new architecture decision:

```bash
memoria feature finish "refactor payment service" --decision "Payment providers now implement a shared provider adapter interface"
```

This keeps later AI work aligned with the new structure.

## Team Handoffs

When a developer pauses work, they can leave concise session memory:

```bash
memoria memory add session "Password reset backend is complete; still need frontend form and email template tests" -t auth handoff
```

The next developer recalls the task:

```bash
memoria recall "continue password reset feature" --budget 4000 --explain
```

They get the previous session context, relevant files, and task memory without needing a long manual handoff.

## Onboarding

A new developer can get curated project context quickly:

```bash
memoria recall "getting started with this project" --budget 8000 --explain
memoria memory list
```

This gives them project conventions, architecture decisions, important files, and existing notes without requiring them to read the whole repository first.

## Daily AI-Agent Workflow

The practical loop is:

```text
init -> ingest -> feature start -> implement -> feature finish -> savings
```

| User need | Command | Result |
| --- | --- | --- |
| Start a task | `memoria feature start "<task>"` | Feature Memory Packet with brief, path, checklist, and recall |
| Check progress | `memoria feature status "<task>"` | Checklist, memory, and savings status |
| Refresh the index | `memoria ingest` | Current project context |
| Ask AI for help | `memoria recall "<task>" --budget 4000 --explain` | Relevant context pack |
| Preserve knowledge | `memoria feature finish "<task>" --decision "<text>"` | Durable project memory and refreshed index |
| Prove value | `memoria feature finish "<task>"` | Saved token and cost report |
| Check setup | `memoria doctor` | Workspace health and setup hints |

## Core Value

Memoria changes the user workflow from:

```text
AI, please read my whole project and figure it out.
```

to:

```text
AI, use this small, relevant, remembered context.
```

| Benefit | Meaning |
| --- | --- |
| Lower token usage | Fewer files and less repeated context |
| Better AI accuracy | Context is relevant and project-specific |
| Durable memory | Decisions and conventions survive across sessions |
| Faster implementation | Agents start from known project context |
| Better teamwork | Handoffs and decisions are searchable |
| Measurable savings | `memoria savings` shows token and cost reduction |
