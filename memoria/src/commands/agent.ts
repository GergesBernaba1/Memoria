import path from "node:path";
import { requireWorkspace } from "../core/workspace.js";
import { ensureDir, writeText } from "../utils/fs.js";
import { logger } from "../utils/logger.js";

export type AgentTarget = "generic" | "claude" | "codex" | "copilot" | "cursor";

export interface AgentInstallOptions {
  cwd?: string;
  force?: boolean;
}

const TARGETS: AgentTarget[] = ["generic", "claude", "codex", "copilot", "cursor"];

export async function agentInstall(
  target: AgentTarget | "all",
  opts: AgentInstallOptions = {},
): Promise<string[]> {
  const ws = await requireWorkspace(opts.cwd);
  await ensureDir(ws.paths.agentsDir);
  const targets = target === "all" ? TARGETS : [target];
  const written: string[] = [];

  for (const t of targets) {
    const file = path.join(ws.paths.agentsDir, `${t}.md`);
    await writeText(file, agentGuide(t));
    written.push(file);
    logger.success(`Installed Memoria agent guide for ${t} at ${file}`);
  }

  const index = path.join(ws.paths.agentsDir, "README.md");
  await writeText(index, agentsReadme());
  return written;
}

export function isAgentTarget(value: string): value is AgentTarget | "all" {
  return value === "all" || TARGETS.includes(value as AgentTarget);
}

function agentsReadme(): string {
  return `# Memoria Agent Guides

These files teach AI coding tools how to interpret Memoria slash commands.

Use them by attaching, pasting, or referencing the guide for your tool:

- \`generic.md\` - works with any LLM coding assistant.
- \`claude.md\` - Claude Code oriented instructions.
- \`codex.md\` - Codex oriented instructions.
- \`copilot.md\` - GitHub Copilot Chat oriented instructions.
- \`cursor.md\` - Cursor oriented instructions.

The slash commands are a protocol. The AI tool should translate them into the
real \`memoria\` CLI commands listed in each guide.
`;
}

function agentGuide(target: AgentTarget): string {
  const label = labelFor(target);
  return `# Memoria Slash Commands For ${label}

You are working in a project that uses Memoria, a local-first memory and
token-saving context layer for LLM-assisted development.

When the user writes a \`/memoria.*\` command, translate it to the matching
\`memoria\` CLI command. Prefer running the command when tool access is
available. If you cannot run shell commands, tell the user the exact command to
run and ask them to paste the output.

## Core Rule

Use Memoria context as project memory. Prefer \`memoria recall\` output over
guessing, broad file reads, or asking the user to paste many files.

## Slash Command Mapping

| Slash command | CLI command |
| --- | --- |
| \`/memoria.init\` | \`memoria init\` |
| \`/memoria.brief <task>\` | \`memoria brief create "<task>"\` |
| \`/memoria.path <task>\` | \`memoria brief path "<task>"\` |
| \`/memoria.checklist <task>\` | \`memoria brief checklist "<task>"\` |
| \`/memoria.memory <type> <text>\` | \`memoria memory add <type> "<text>"\` |
| \`/memoria.ingest\` | \`memoria ingest\` |
| \`/memoria.recall <task>\` | \`memoria recall "<task>" --budget 4000 --explain\` |
| \`/memoria.search <query>\` | \`memoria search "<query>"\` |
| \`/memoria.savings <task>\` | \`memoria savings "<task>" --baseline all-indexed --save\` |
| \`/memoria.memories <query>\` | \`memoria memory search "<query>"\` |

Allowed memory types:

- \`decision\`
- \`note\`
- \`convention\`
- \`session\`

## Recommended Workflow

For a new task:

1. If no brief exists, run \`memoria brief create "<task>"\`.
2. Run \`memoria ingest\` if code or memory changed.
3. Run \`memoria recall "<task>" --budget 4000 --explain\`.
4. Use the recalled context as the source of truth.
5. After durable decisions are made, store them with \`memoria memory add decision "..."\`.
6. Run \`memoria savings "<task>" --baseline all-indexed --save\` when the user asks for savings.

## Behavior Guidance

- Keep generated briefs compact.
- Do not create long spec documents unless the user explicitly asks.
- Do not paste broad source trees into the prompt when recall can provide focused context.
- Respect memories and conventions as project-level guidance.
- If recall output is insufficient, ask for one additional targeted command or file, not many files.
- Do not store secrets, API keys, credentials, or private tokens in Memoria memory.

## Example

User:

\`\`\`text
/memoria.recall add password reset
\`\`\`

Assistant should run:

\`\`\`bash
memoria recall "add password reset" --budget 4000 --explain
\`\`\`

Then use the returned context before editing code.
`;
}

function labelFor(target: AgentTarget): string {
  switch (target) {
    case "claude":
      return "Claude Code";
    case "codex":
      return "Codex";
    case "copilot":
      return "GitHub Copilot";
    case "cursor":
      return "Cursor";
    case "generic":
      return "Generic AI Agents";
  }
}
