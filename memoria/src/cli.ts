import { Command } from "commander";
import { runInit } from "./commands/init.js";
import { skillCreate, skillDelete, skillList, skillShow } from "./commands/skill.js";
import { tokensCompress, tokensCount, tokensEstimate } from "./commands/tokens.js";
import { configGet, configSet } from "./commands/config.js";
import { runIngest } from "./commands/ingest.js";
import { runSearch } from "./commands/search.js";
import { runRecall } from "./commands/recall.js";
import { runSummarize } from "./commands/summarize.js";
import { runCluster } from "./commands/cluster.js";
import { briefChecklist, briefCreate, briefList, briefPath, briefShow } from "./commands/brief.js";
import { memoryAdd, memoryDelete, memoryList, memorySearch, memoryShow, memoryUpdate } from "./commands/memory.js";
import { runSavings } from "./commands/savings.js";
import { agentInstall, isAgentTarget } from "./commands/agent.js";
import { logger } from "./utils/logger.js";

const program = new Command();

program
  .name("memoria")
  .description("Contextual Memory and Prompt Optimization Toolkit for LLM-powered development")
  .version("0.2.0");

program
  .command("init")
  .description("Initialize a .memoria/ directory in the current project")
  .option("--force", "Overwrite an existing .memoria/ config")
  .option("--name <name>", "Project name (defaults to current dir name)")
  .action(async (opts: { force?: boolean; name?: string }) => {
    await runInit({ force: opts.force, projectName: opts.name });
  });

const skill = program.command("skill").description("Manage Skill-MD files");
skill
  .command("create <name>")
  .description("Create a new skill from the template")
  .option("-d, --description <text>", "One-line description")
  .option("-t, --tag <tag...>", "Tags (repeatable)")
  .action(async (name: string, opts: { description?: string; tag?: string[] }) => {
    await skillCreate(name, { description: opts.description, tags: opts.tag });
  });

skill
  .command("list")
  .description("List all skills")
  .option("--json", "Output as JSON")
  .action(async (opts: { json?: boolean }) => {
    await skillList({ json: opts.json });
  });

skill
  .command("show <name>")
  .description("Show a single skill")
  .action(async (name: string) => {
    await skillShow(name);
  });

skill
  .command("delete <name>")
  .description("Delete a skill")
  .option("--yes", "Skip confirmation")
  .action(async (name: string, opts: { yes?: boolean }) => {
    await skillDelete(name, { yes: opts.yes });
  });

const tokens = program.command("tokens").description("Token-aware prompt tooling");
tokens
  .command("count <input>")
  .description("Count tokens for a string or file")
  .option("-m, --model <id>", "Model id (default: claude-sonnet-4-6)")
  .option("--json", "Output as JSON")
  .action(async (input: string, opts: { model?: string; json?: boolean }) => {
    await tokensCount(input, { model: opts.model, json: opts.json });
  });

tokens
  .command("estimate <input>")
  .description("Estimate input + output cost in USD for a string or file")
  .requiredOption("-m, --model <id>", "Model id")
  .option("-o, --output-tokens <n>", "Projected output tokens (default 500)", (v) => parseInt(v, 10))
  .option("--json", "Output as JSON")
  .action(
    async (
      input: string,
      opts: { model: string; outputTokens?: number; json?: boolean },
    ) => {
      await tokensEstimate(input, {
        model: opts.model,
        outputTokens: opts.outputTokens,
        json: opts.json,
      });
    },
  );

tokens
  .command("compress <input>")
  .description("Apply lossless whitespace compression and report savings")
  .option("-m, --model <id>", "Model id used for token counts")
  .option("--json", "Output as JSON")
  .action(async (input: string, opts: { model?: string; json?: boolean }) => {
    await tokensCompress(input, { model: opts.model, json: opts.json });
  });

const config = program.command("config").description("Read/write .memoria/config.json");
config
  .command("get [key]")
  .description("Print the full config or a single dotted key path")
  .action(async (key?: string) => {
    await configGet(key);
  });
config
  .command("set <key> <value>")
  .description("Set a dotted key path. Value is JSON-parsed when possible.")
  .action(async (key: string, value: string) => {
    await configSet(key, value);
  });

const brief = program.command("brief").description("Manage compact memory-first workflow briefs");
brief
  .command("create <name>")
  .description("Create .memoria/briefs/<name>.md")
  .option("-d, --description <text>", "Short goal description")
  .action(async (name: string, opts: { description?: string }) => {
    await briefCreate(name, { description: opts.description });
  });
brief
  .command("path <name>")
  .description("Refresh the implementation path section")
  .action(async (name: string) => {
    await briefPath(name);
  });
brief
  .command("checklist <name>")
  .description("Refresh the checklist section")
  .action(async (name: string) => {
    await briefChecklist(name);
  });
brief
  .command("list")
  .description("List briefs")
  .option("--json", "Output as JSON")
  .action(async (opts: { json?: boolean }) => {
    await briefList({ json: opts.json });
  });
brief
  .command("show <name>")
  .description("Show a brief or one section")
  .option("--section <section>", "intent | recall | memory-links | path | checklist | all", "all")
  .action(async (name: string, opts: { section?: string }) => {
    await briefShow(name, { section: opts.section });
  });

const memory = program.command("memory").description("Manage durable project memories");
memory
  .command("add <type> <text>")
  .description("Add a memory: decision | note | convention | session")
  .option("--title <title>", "Memory title")
  .option("-t, --tag <tag...>", "Tags")
  .action(async (type: string, text: string, opts: { title?: string; tag?: string[] }) => {
    if (!["decision", "note", "convention", "session"].includes(type)) {
      throw new Error("type must be one of: decision, note, convention, session");
    }
    await memoryAdd(type as "decision" | "note" | "convention" | "session", text, {
      title: opts.title,
      tags: opts.tag,
    });
  });
memory
  .command("list")
  .description("List memories")
  .option("--type <type>", "decision | note | convention | session")
  .option("--json", "Output as JSON")
  .action(async (opts: { type?: "decision" | "note" | "convention" | "session"; json?: boolean }) => {
    await memoryList({ type: opts.type, json: opts.json });
  });
memory
  .command("show <id>")
  .description("Show a memory by id or id prefix")
  .action(async (id: string) => {
    await memoryShow(id);
  });
memory
  .command("update <id>")
  .description("Update a memory by id or id prefix")
  .option("--text <text>", "Replacement memory body")
  .option("--title <title>", "Replacement title")
  .option("-t, --tag <tag...>", "Replacement tags")
  .option("--type <type>", "decision | note | convention | session")
  .action(
    async (
      id: string,
      opts: { text?: string; title?: string; tag?: string[]; type?: "decision" | "note" | "convention" | "session" },
    ) => {
      if (opts.type && !["decision", "note", "convention", "session"].includes(opts.type)) {
        throw new Error("type must be one of: decision, note, convention, session");
      }
      await memoryUpdate(id, {
        text: opts.text,
        title: opts.title,
        tags: opts.tag,
        type: opts.type,
      });
    },
  );
memory
  .command("delete <id>")
  .description("Delete a memory by id or id prefix")
  .option("--yes", "Confirm deletion")
  .action(async (id: string, opts: { yes?: boolean }) => {
    await memoryDelete(id, { yes: opts.yes });
  });
memory
  .command("search <query>")
  .description("Search memories with lightweight keyword matching")
  .option("-k, --top <n>", "Top results", (v) => parseInt(v, 10))
  .option("--json", "Output as JSON")
  .action(async (query: string, opts: { top?: number; json?: boolean }) => {
    await memorySearch(query, { top: opts.top, json: opts.json });
  });

program
  .command("savings <query>")
  .description("Compare baseline prompt tokens with Memoria recall tokens")
  .option("--baseline <mode>", "all-indexed | file | directory | manual", "all-indexed")
  .option("--input <value>", "Path or literal text for file/directory/manual baselines")
  .option("-b, --budget <n>", "Recall token budget", (v) => parseInt(v, 10))
  .option("-k, --top <n>", "Recall top-K", (v) => parseInt(v, 10))
  .option("-m, --model <id>", "Tokenizer/pricing model")
  .option("-o, --output-tokens <n>", "Projected output tokens", (v) => parseInt(v, 10))
  .option("--save", "Write report under .memoria/reports/savings/")
  .option("--json", "Output as JSON")
  .action(
    async (
      query: string,
      opts: {
        baseline?: "all-indexed" | "file" | "directory" | "manual";
        input?: string;
        budget?: number;
        top?: number;
        model?: string;
        outputTokens?: number;
        save?: boolean;
        json?: boolean;
      },
    ) => {
      await runSavings(query, {
        baseline: opts.baseline,
        input: opts.input,
        budgetTokens: opts.budget,
        topK: opts.top,
        model: opts.model,
        outputTokens: opts.outputTokens,
        save: opts.save,
        json: opts.json,
      });
    },
  );

const agent = program.command("agent").description("Install Memoria slash-command guides for AI coding tools");
agent
  .command("install <target>")
  .description("Install guide: generic | claude | codex | copilot | cursor | all")
  .action(async (target: string) => {
    if (!isAgentTarget(target)) {
      throw new Error("target must be one of: generic, claude, codex, copilot, cursor, all");
    }
    await agentInstall(target);
  });

// ---- v2 commands ----
program
  .command("ingest")
  .description("Walk the project, refresh KG, and (re)build embeddings")
  .option("--no-embed", "Skip embedding generation; only refresh KG")
  .option("--full", "Wipe and rebuild instead of incremental update")
  .action(async (opts: { embed?: boolean; full?: boolean }) => {
    const result = await runIngest({ noEmbed: opts.embed === false, full: opts.full });
    logger.success(
      `ingest complete: ${result.filesScanned} files, ${result.entities} entities, ${result.relationships} relationships, ${result.embeddings} embeddings`,
    );
  });

program
  .command("search <query>")
  .description("Semantic search across code + skills")
  .option("-k, --top <n>", "Top-K results", (v) => parseInt(v, 10))
  .option("--source <which>", "code | skill | brief | memory | all", "all")
  .option("--json", "Output as JSON")
  .action(
    async (
      query: string,
      opts: { top?: number; source?: "code" | "skill" | "brief" | "memory" | "all"; json?: boolean },
    ) => {
      await runSearch(query, { k: opts.top, source: opts.source, json: opts.json });
    },
  );

program
  .command("recall <query>")
  .description("Assemble a token-budgeted context for an LLM prompt")
  .option("-b, --budget <n>", "Token budget for the context", (v) => parseInt(v, 10))
  .option("-k, --top <n>", "Top-K hits", (v) => parseInt(v, 10))
  .option("--hops <n>", "KG expansion hops", (v) => parseInt(v, 10))
  .option("-m, --model <id>", "Tokenizer model used for budget accounting")
  .option("--explain", "Show why each context section was selected or dropped")
  .option("--json", "Output as JSON")
  .action(
    async (
      query: string,
      opts: { budget?: number; top?: number; hops?: number; model?: string; explain?: boolean; json?: boolean },
    ) => {
      await runRecall(query, {
        budgetTokens: opts.budget,
        topK: opts.top,
        hops: opts.hops,
        budgetModel: opts.model,
        explain: opts.explain,
        json: opts.json,
      });
    },
  );

program
  .command("summarize [target]")
  .description("LLM-summarize source files into .memoria/knowledge_graph/summaries/")
  .option("--force", "Re-summarize even if the content hash matches")
  .option("--limit <n>", "Cap on files summarized this run", (v) => parseInt(v, 10))
  .action(async (target: string | undefined, opts: { force?: boolean; limit?: number }) => {
    await runSummarize({ target, force: opts.force, limit: opts.limit });
  });

program
  .command("cluster")
  .description("k-means cluster the code embeddings; writes clusters.json")
  .option("-k, --clusters <n>", "Number of clusters (default: auto)", (v) => parseInt(v, 10))
  .option("--json", "Output as JSON")
  .action(async (opts: { clusters?: number; json?: boolean }) => {
    await runCluster({ k: opts.clusters, json: opts.json });
  });

async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(msg);
    process.exit(1);
  }
}

void main();
