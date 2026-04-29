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

interface MemoriaCommand {
  name: string;
  args: string;
  description: string;
  cli: string;
}

const COMMANDS: MemoriaCommand[] = [
  {
    name: "memoria.init",
    args: "",
    description: "Initialize Memoria in this workspace.",
    cli: "memoria init",
  },
  {
    name: "memoria.brief",
    args: "<task>",
    description: "Create a compact Memoria task brief.",
    cli: 'memoria brief create "$ARGUMENTS"',
  },
  {
    name: "memoria.path",
    args: "<task>",
    description: "Refresh the implementation path for a Memoria brief.",
    cli: 'memoria brief path "$ARGUMENTS"',
  },
  {
    name: "memoria.checklist",
    args: "<task>",
    description: "Refresh the checklist for a Memoria brief.",
    cli: 'memoria brief checklist "$ARGUMENTS"',
  },
  {
    name: "memoria.feature.start",
    args: "<feature>",
    description: "Create or refresh a Feature Memory Packet.",
    cli: 'memoria feature start "$ARGUMENTS"',
  },
  {
    name: "memoria.feature.list",
    args: "",
    description: "List Feature Memory Packets.",
    cli: "memoria feature list",
  },
  {
    name: "memoria.feature.status",
    args: "<feature>",
    description: "Show Feature Memory Packet status.",
    cli: 'memoria feature status "$ARGUMENTS"',
  },
  {
    name: "memoria.feature.done",
    args: "<feature> <item>",
    description: "Mark a Feature Memory Packet checklist item done.",
    cli: 'memoria feature done "$ARGUMENTS"',
  },
  {
    name: "memoria.feature.packet",
    args: "<feature>",
    description: "Print a shareable Feature Memory Packet.",
    cli: 'memoria feature packet "$ARGUMENTS"',
  },
  {
    name: "memoria.feature.finish",
    args: "<feature>",
    description: "Finish a feature with ingest and savings report.",
    cli: 'memoria feature finish "$ARGUMENTS"',
  },
  {
    name: "memoria.ingest",
    args: "",
    description: "Refresh Memoria's code graph and embeddings.",
    cli: "memoria ingest",
  },
  {
    name: "memoria.recall",
    args: "<task>",
    description: "Recall token-budgeted Memoria context for a task.",
    cli: 'memoria recall "$ARGUMENTS" --budget 4000 --explain',
  },
  {
    name: "memoria.ask",
    args: "<question>",
    description: "Ask an LLM using Memoria recalled context.",
    cli: 'memoria ask "$ARGUMENTS"',
  },
  {
    name: "memoria.search",
    args: "<query>",
    description: "Search Memoria code, skills, briefs, and memory.",
    cli: 'memoria search "$ARGUMENTS"',
  },
  {
    name: "memoria.savings",
    args: "<task>",
    description: "Estimate token savings from Memoria recall.",
    cli: 'memoria savings "$ARGUMENTS" --baseline all-indexed --save',
  },
  {
    name: "memoria.memories",
    args: "<query>",
    description: "Search durable Memoria memory records.",
    cli: 'memoria memory search "$ARGUMENTS"',
  },
  {
    name: "memoria.doctor",
    args: "",
    description: "Check Memoria workspace health.",
    cli: "memoria doctor",
  },
];

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

  // Create tool-specific instruction files that get auto-loaded
  const projectRoot = path.join(ws.paths.root, "..");
  
  if (target === "all" || target === "copilot") {
    // GitHub Copilot reads .github/copilot-instructions.md
    const githubDir = path.join(projectRoot, ".github");
    await ensureDir(githubDir);
    const copilotInstructions = path.join(githubDir, "copilot-instructions.md");
    await writeText(copilotInstructions, getInstructionsFile("copilot"));
    written.push(copilotInstructions);
    logger.success(`Created .github/copilot-instructions.md (auto-loaded by Copilot)`);

    const promptsDir = path.join(githubDir, "prompts");
    await ensureDir(promptsDir);
    for (const command of COMMANDS) {
      const promptFile = path.join(promptsDir, `${command.name}.prompt.md`);
      await writeText(promptFile, copilotPrompt(command));
      written.push(promptFile);
    }
    logger.success(`Created GitHub Copilot prompt files in .github/prompts/`);
  }

  if (target === "all" || target === "cursor") {
    // Cursor reads .cursorrules
    const cursorRules = path.join(projectRoot, ".cursorrules");
    await writeText(cursorRules, getInstructionsFile("cursor"));
    written.push(cursorRules);
    logger.success(`Created .cursorrules (auto-loaded by Cursor)`);
  }

  if (target === "all" || target === "claude") {
    // Claude Code reads project commands from .claude/commands/.
    const claudeDir = path.join(projectRoot, ".claude");
    await ensureDir(claudeDir);
    const claudeInstructions = path.join(claudeDir, "instructions.md");
    await writeText(claudeInstructions, getInstructionsFile("claude"));
    written.push(claudeInstructions);
    logger.success(`Created .claude/instructions.md (may be auto-loaded by Claude Code)`);

    const commandsDir = path.join(claudeDir, "commands");
    await ensureDir(commandsDir);
    for (const command of COMMANDS) {
      const commandFile = path.join(commandsDir, `${command.name}.md`);
      await writeText(commandFile, claudeCommand(command));
      written.push(commandFile);
    }
    logger.success(`Created Claude Code slash commands in .claude/commands/`);
  }

  if (target === "all" || target === "codex") {
    const agentsFile = path.join(projectRoot, "AGENTS.md");
    await writeText(agentsFile, codexAgentsFile());
    written.push(agentsFile);
    logger.success(`Created AGENTS.md (auto-loaded by Codex)`);

    const codexSkillDir = path.join(projectRoot, ".agents", "skills", "memoria");
    await ensureDir(codexSkillDir);
    const codexSkillFile = path.join(codexSkillDir, "SKILL.md");
    await writeText(codexSkillFile, codexSkill());
    written.push(codexSkillFile);
    logger.success(`Created Codex Memoria skill at .agents/skills/memoria/SKILL.md`);
  }

  if (target === "all") {
    // Windsurf reads .windsurfrules
    const windsurfRules = path.join(projectRoot, ".windsurfrules");
    await writeText(windsurfRules, getInstructionsFile("generic"));
    written.push(windsurfRules);
    logger.success(`Created .windsurfrules (auto-loaded by Windsurf)`);
  }

  return written;
}

export function isAgentTarget(value: string): value is AgentTarget | "all" {
  return value === "all" || TARGETS.includes(value as AgentTarget);
}

function agentsReadme(): string {
  return `# Memoria Agent Guides

These files teach AI coding tools how to interpret Memoria commands.

## Agent Guide Files (Manual Reference)

These detailed guides are in \`.memoria/agents/\`:

- \`generic.md\` - works with any LLM coding assistant
- \`claude.md\` - Claude Code oriented instructions
- \`codex.md\` - Codex oriented instructions
- \`copilot.md\` - GitHub Copilot Chat oriented instructions
- \`cursor.md\` - Cursor oriented instructions

## Auto-Loaded Instruction Files

These files are automatically read by each tool on startup where supported:

- \`.github/copilot-instructions.md\` - **Auto-loaded by GitHub Copilot**
- \`.cursorrules\` - **Auto-loaded by Cursor**
- \`.claude/instructions.md\` - Auto-loaded by Claude Code (may vary)
- \`.windsurfrules\` - **Auto-loaded by Windsurf**
- \`AGENTS.md\` - **Auto-loaded by Codex**

## Real Command Files

For tools with reusable prompt or command discovery, Memoria also creates:

- \`.claude/commands/memoria.recall.md\` and related files for Claude Code.
- \`.github/prompts/memoria.recall.prompt.md\` and related files for GitHub Copilot prompt files.
- \`.agents/skills/memoria/SKILL.md\` for Codex. Codex uses skills and built-in slash commands; repo-level custom \`/memoria.*\` slash commands are not currently a stable Codex feature.

## How It Works

1. User runs: \`memoria agent install all\`
2. Memoria creates detailed guides, instruction files, and supported command/prompt files.
3. AI tools either show real commands or learn to translate Memoria requests into CLI calls.

The slash commands are a protocol. The AI tool translates them into the
real \`memoria\` CLI commands and asks the user to run them.
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
| \`/memoria.feature.start <feature>\` | \`memoria feature start "<feature>"\` |
| \`/memoria.feature.list\` | \`memoria feature list\` |
| \`/memoria.feature.status <feature>\` | \`memoria feature status "<feature>"\` |
| \`/memoria.feature.done <feature> <item>\` | \`memoria feature done "<feature>" "<item>"\` |
| \`/memoria.feature.packet <feature>\` | \`memoria feature packet "<feature>"\` |
| \`/memoria.feature.finish <feature>\` | \`memoria feature finish "<feature>"\` |
| \`/memoria.memory <type> <text>\` | \`memoria memory add <type> "<text>"\` |
| \`/memoria.ingest\` | \`memoria ingest\` |
| \`/memoria.recall <task>\` | \`memoria recall "<task>" --budget 4000 --explain\` |
| \`/memoria.ask <question>\` | \`memoria ask "<question>"\` |
| \`/memoria.search <query>\` | \`memoria search "<query>"\` |
| \`/memoria.savings <task>\` | \`memoria savings "<task>" --baseline all-indexed --save\` |
| \`/memoria.memories <query>\` | \`memoria memory search "<query>"\` |
| \`/memoria.doctor\` | \`memoria doctor\` |

Allowed memory types:

- \`decision\`
- \`note\`
- \`convention\`
- \`session\`

## Recommended Workflow

For a new task:

1. If no brief exists, run \`memoria brief create "<task>"\`.
2. Prefer \`memoria feature start "<task>"\` when the user wants a complete Feature Memory Packet.
3. Run \`memoria ingest\` if code or memory changed.
4. Run \`memoria recall "<task>" --budget 4000 --explain\`.
5. Use the recalled context as the source of truth.
6. After durable decisions are made, store them with \`memoria memory add decision "..."\`.
7. Run \`memoria feature finish "<task>" --decision "..."\` when the feature is complete.

## Behavior Guidance

- Keep generated briefs compact.
- Do not create long planning documents unless the user explicitly asks.
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

function commandUsage(command: MemoriaCommand): string {
  return `/${command.name}${command.args ? ` ${command.args}` : ""}`;
}

function cliForPrompt(command: MemoriaCommand): string {
  return command.cli.replaceAll("$ARGUMENTS", "<arguments>");
}

function claudeCommand(command: MemoriaCommand): string {
  return `---
description: ${command.description}
allowed-tools: Bash(memoria:*)
---

# ${command.name}

The user invoked \`${commandUsage(command)}\`.

Run this command from the workspace root:

\`\`\`bash
${command.cli}
\`\`\`

Use the command output as the source of truth for the next response. If the command fails because Memoria is not installed or initialized, report the exact failure and suggest the next \`memoria\` command to run.
`;
}

function copilotPrompt(command: MemoriaCommand): string {
  return `---
description: ${command.description}
mode: agent
tools: ["codebase", "terminal"]
---

# ${command.name}

The user invoked \`${commandUsage(command)}\`.

Run this command in the workspace terminal:

\`\`\`bash
${cliForPrompt(command)}
\`\`\`

Use the Memoria output as the source of truth. If terminal execution is unavailable, tell the user the exact command to run and ask them to paste the output.
`;
}

function codexAgentsFile(): string {
  return `# Memoria

This project uses Memoria for local-first project memory and token-budgeted recall.

When the user writes a \`/memoria.*\` request, treat it as a Memoria protocol command and run the matching CLI command when shell access is available:

| User request | CLI command |
| --- | --- |
${COMMANDS.map((command) => `| \`${commandUsage(command)}\` | \`${cliForPrompt(command)}\` |`).join("\n")}

Prefer \`memoria recall "<task>" --budget 4000 --explain\` before broad source reads. Store durable decisions with \`memoria memory add decision "<text>"\`.

Codex currently exposes built-in slash commands and skills. This file teaches Codex how to respond to \`/memoria.*\` text, while \`.agents/skills/memoria/SKILL.md\` exposes the same workflow as a project skill.
`;
}

function codexSkill(): string {
  return `---
name: memoria
description: Use Memoria recall, search, briefs, and durable memory before broad project exploration.
---

# Memoria

Use this skill when the user asks for Memoria context, writes \`/memoria.*\`, wants project memory recalled, or asks to save a durable decision.

## Commands

| User request | CLI command |
| --- | --- |
${COMMANDS.map((command) => `| \`${commandUsage(command)}\` | \`${cliForPrompt(command)}\` |`).join("\n")}

## Workflow

1. For implementation tasks, run \`memoria recall "<task>" --budget 4000 --explain\` before broad file reads.
2. Use recalled context as the starting source of truth.
3. Run \`memoria ingest\` after meaningful code or memory changes.
4. Save durable decisions with \`memoria memory add decision "<text>"\`.
5. Do not store secrets, API keys, credentials, or private tokens in Memoria memory.
`;
}

function getInstructionsFile(tool: AgentTarget | "generic"): string {
  const toolName = labelFor(tool as AgentTarget);
  
  return `# Memoria Integration for ${toolName}

This project uses **Memoria** - a context optimization tool for AI coding that saves tokens and money.

## Quick Reference: Memoria Slash Commands

When the user types \`/memoria.*\` commands, map them to Memoria CLI commands:

| User Command | Run in Terminal |
|--------------|-----------------|
| \`/memoria.recall <task>\` | \`memoria recall "<task>"\` |
| \`/memoria.brief <task>\` | \`memoria brief create "<task>"\` |
| \`/memoria.feature.start <feature>\` | \`memoria feature start "<feature>"\` |
| \`/memoria.feature.list\` | \`memoria feature list\` |
| \`/memoria.feature.status <feature>\` | \`memoria feature status "<feature>"\` |
| \`/memoria.feature.done <feature> <item>\` | \`memoria feature done "<feature>" "<item>"\` |
| \`/memoria.feature.packet <feature>\` | \`memoria feature packet "<feature>"\` |
| \`/memoria.feature.finish <feature>\` | \`memoria feature finish "<feature>"\` |
| \`/memoria.ingest\` | \`memoria ingest\` |
| \`/memoria.memory decision "<text>"\` | \`memoria memory add decision "<text>"\` |
| \`/memoria.memory note "<text>"\` | \`memoria memory add note "<text>"\` |
| \`/memoria.memory convention "<text>"\` | \`memoria memory add convention "<text>"\` |
| \`/memoria.search <query>\` | \`memoria search "<query>"\` |
| \`/memoria.savings <task>\` | \`memoria savings "<task>"\` |
| \`/memoria.doctor\` | \`memoria doctor\` |
| \`/memoria.ask <question>\` | \`memoria ask "<question>"\` |

## How to Use Memoria with ${toolName}

### Workflow

1. **User types:** \`/memoria.recall add user authentication\`
2. **You respond:** "Please run this command in your terminal:
   \`\`\`bash
   memoria recall "add user authentication"
   \`\`\`
   Then paste the output here and I'll help you implement it."
3. **User pastes context** (optimized, token-budgeted)
4. **You use that context** to help them code

### Core Principle

**Always prefer Memoria-optimized context over reading many files:**
- Don't read 20+ files from the workspace when recall can provide focused context.
- Ask the user to run \`memoria recall "query"\` and paste results when terminal access is unavailable.
- Memoria gives you the RIGHT context within a token budget.

### Example

User: \`/memoria.recall fix login bug\`

You: "I see you want to work on fixing a login bug. Please run:
\`\`\`bash
memoria recall "fix login bug"
\`\`\`
Then paste the output here so I have the optimized context."

User: [pastes recalled context with relevant code, decisions, patterns]

You: "Great! Based on this context, I can see the issue is in \`src/auth/login.ts\`..."

## Why This Saves Money

- **Without Memoria:** You might read 50,000 tokens of code
- **With Memoria:** User gets 4,000 tokens of RELEVANT code
- **Savings:** 46,000 tokens = ~$0.50-$1.50 per request

## Memory Types

When user saves learnings:
- \`decision\` - Important choices made (e.g., "Use JWT for auth")
- \`convention\` - Team standards (e.g., "Always use Zod validation")
- \`note\` - General observations
- \`session\` - Temporary context for current work

## Full Command Reference

See \`.memoria/agents/${tool}.md\` for complete documentation.
`;
}
