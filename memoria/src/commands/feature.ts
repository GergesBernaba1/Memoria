import path from "node:path";
import { briefFilePath } from "../core/paths.js";
import { requireWorkspace } from "../core/workspace.js";
import { runIngest } from "./ingest.js";
import { memoryAdd, memorySearch } from "./memory.js";
import { runRecall } from "./recall.js";
import { runSavings } from "./savings.js";
import { briefChecklist, briefCreate, briefPath } from "./brief.js";
import { listFiles, pathExists, readText, writeText } from "../utils/fs.js";
import { logger } from "../utils/logger.js";

export interface FeatureStartOptions {
  description?: string;
  budgetTokens?: number;
  explain?: boolean;
  recall?: boolean;
  json?: boolean;
  cwd?: string;
}

export interface FeatureFinishOptions {
  decision?: string;
  ingest?: boolean;
  savings?: boolean;
  budgetTokens?: number;
  json?: boolean;
  cwd?: string;
}

export interface FeatureStatus {
  name: string;
  slug: string;
  briefPath: string;
  checklist: {
    total: number;
    done: number;
    open: number;
  };
  relatedMemories: number;
  savingsReports: number;
}

export interface FeatureListItem {
  name: string;
  slug: string;
  briefPath: string;
  checklist: FeatureStatus["checklist"];
}

export async function featureStart(name: string, opts: FeatureStartOptions = {}): Promise<string> {
  const ws = await requireWorkspace(opts.cwd);
  const slug = slugify(name);
  const file = briefFilePath(ws.paths.briefsDir, slug);
  let created = false;

  if (await pathExists(file)) {
    logger.warn(`Feature brief '${slug}' already exists; refreshing path and checklist.`);
  } else {
    await briefCreate(name, { cwd: opts.cwd, description: opts.description });
    created = true;
  }

  await briefPath(name, { cwd: opts.cwd });
  await briefChecklist(name, { cwd: opts.cwd });

  if (opts.json) {
    logger.json({
      name,
      slug,
      briefPath: file,
      created,
      recallCommand: `memoria recall "${name}" --budget ${opts.budgetTokens ?? 4000} --explain`,
    });
  } else {
    logger.success(`Feature Memory Packet ${created ? "created" : "refreshed"} for '${slug}'`);
    logger.raw(`brief: ${file}`);
    logger.raw(`path: refreshed`);
    logger.raw(`checklist: refreshed`);
    logger.raw(`recall: memoria recall "${name}" --budget ${opts.budgetTokens ?? 4000} --explain`);
  }

  if (opts.recall !== false) {
    await runRecall(name, {
      cwd: opts.cwd,
      budgetTokens: opts.budgetTokens ?? 4000,
      explain: opts.explain ?? true,
    });
  }

  return file;
}

export async function featureList(opts: { cwd?: string; json?: boolean } = {}): Promise<FeatureListItem[]> {
  const ws = await requireWorkspace(opts.cwd);
  const files = (await listFiles(ws.paths.briefsDir, ".md")).sort();
  const items: FeatureListItem[] = [];

  for (const file of files) {
    const slug = path.basename(file, ".md");
    const text = await readText(file);
    items.push({
      name: titleFromName(slug),
      slug,
      briefPath: file,
      checklist: countChecklist(text),
    });
  }

  if (opts.json) {
    logger.json(items);
    return items;
  }

  if (items.length === 0) {
    logger.info("No feature packets yet. Run `memoria feature start \"<name>\"`.");
    return items;
  }

  for (const item of items) {
    logger.raw(`  ${item.slug} (${item.checklist.done}/${item.checklist.total} done)`);
  }
  return items;
}

export async function featureStatus(name: string, opts: { cwd?: string; json?: boolean } = {}): Promise<FeatureStatus> {
  const status = await getFeatureStatus(name, opts.cwd);

  if (opts.json) {
    logger.json(status);
    return status;
  }

  printFeatureStatus(status);
  return status;
}

export async function featureDone(
  name: string,
  item: string,
  opts: { cwd?: string; json?: boolean } = {},
): Promise<FeatureStatus> {
  const ws = await requireWorkspace(opts.cwd);
  const slug = slugify(name);
  const file = briefFilePath(ws.paths.briefsDir, slug);
  if (!(await pathExists(file))) throw new Error(`Feature brief '${slug}' not found. Run \`memoria feature start "${name}"\` first.`);

  const text = await readText(file);
  const checklistItems = checklistLines(text);
  if (checklistItems.length === 0) throw new Error(`Feature brief '${slug}' has no checklist items.`);

  const target = resolveChecklistItem(checklistItems, item);
  const next = `${text.slice(0, target.index)}- [x] ${target.body}${text.slice(target.index + target.raw.length)}`;
  await writeText(file, next);

  if (opts.json) {
    const status = await getFeatureStatus(name, opts.cwd);
    logger.json({ ...status, markedDone: target.body });
    return status;
  }
  const status = await getFeatureStatus(name, opts.cwd);
  logger.success(`Marked done: ${target.body}`);
  printFeatureStatus(status);
  return status;
}

export async function featurePacket(
  name: string,
  opts: { cwd?: string; json?: boolean } = {},
): Promise<{ status: FeatureStatus; brief: string; memories: Array<{ id: string; type: string; title: string; body: string }> }> {
  const ws = await requireWorkspace(opts.cwd);
  const slug = slugify(name);
  const file = briefFilePath(ws.paths.briefsDir, slug);
  if (!(await pathExists(file))) throw new Error(`Feature brief '${slug}' not found. Run \`memoria feature start "${name}"\` first.`);

  const brief = await readText(file);
  const status = await getFeatureStatus(name, opts.cwd);
  const memories = (await memorySearch(name, { cwd: opts.cwd, silent: true })).map((memory) => ({
    id: memory.id,
    type: memory.type,
    title: memory.title,
    body: memory.body,
  }));
  const packet = { status, brief, memories };

  if (opts.json) {
    logger.json(packet);
    return packet;
  }

  logger.raw(`# Feature Memory Packet: ${titleFromName(name)}`);
  logger.raw("");
  logger.raw(`Brief: ${file}`);
  logger.raw(`Checklist: ${status.checklist.done}/${status.checklist.total} done (${status.checklist.open} open)`);
  logger.raw(`Related memories: ${memories.length}`);
  logger.raw(`Savings reports: ${status.savingsReports}`);
  logger.raw("");
  logger.raw("## Brief");
  logger.raw("");
  logger.raw(brief.trim());
  if (memories.length > 0) {
    logger.raw("");
    logger.raw("## Related Memories");
    for (const memory of memories) {
      logger.raw("");
      logger.raw(`### ${memory.title} (${memory.type})`);
      logger.raw(memory.body);
    }
  }
  logger.raw("");
  logger.raw("## Next Commands");
  logger.raw("");
  logger.raw(`- Recall: \`memoria recall "${name}" --budget 4000 --explain\``);
  logger.raw(`- Status: \`memoria feature status "${name}"\``);
  logger.raw(`- Finish: \`memoria feature finish "${name}" --decision "<decision>"\``);
  return packet;
}

export async function featureFinish(name: string, opts: FeatureFinishOptions = {}): Promise<void> {
  const ws = await requireWorkspace(opts.cwd);
  const slug = slugify(name);
  const file = briefFilePath(ws.paths.briefsDir, slug);
  if (!(await pathExists(file))) throw new Error(`Feature brief '${slug}' not found. Run \`memoria feature start "${name}"\` first.`);

  const actions: string[] = [];

  if (opts.decision?.trim()) {
    const memory = await memoryAdd("decision", opts.decision, {
      cwd: opts.cwd,
      title: `${titleFromName(name)} decision`,
      tags: ["feature", slug],
    });
    actions.push(`saved decision: ${memory}`);
  }

  if (opts.ingest !== false) {
    const result = await runIngest({ cwd: opts.cwd });
    actions.push(`ingested: ${result.filesScanned} files, ${result.embeddings} embeddings`);
  }

  if (opts.savings !== false) {
    const report = await runSavings(name, {
      cwd: opts.cwd,
      budgetTokens: opts.budgetTokens ?? 4000,
      baseline: "all-indexed",
      save: true,
      silent: true,
    });
    if (report.reportPath) actions.push(`savings report: ${report.reportPath}`);
  }

  if (opts.json) {
    logger.json({ name, slug, briefPath: file, actions });
    return;
  }

  logger.success(`Feature '${slug}' finished`);
  if (actions.length === 0) {
    logger.info("No finish actions were requested.");
    return;
  }
  for (const action of actions) logger.raw(`- ${action}`);
}

function countChecklist(text: string): FeatureStatus["checklist"] {
  const matches = Array.from(text.matchAll(/^- \[( |x|X)\] /gm));
  const done = matches.filter((m) => m[1]?.toLowerCase() === "x").length;
  return {
    total: matches.length,
    done,
    open: matches.length - done,
  };
}

async function getFeatureStatus(name: string, cwd?: string): Promise<FeatureStatus> {
  const ws = await requireWorkspace(cwd);
  const slug = slugify(name);
  const file = briefFilePath(ws.paths.briefsDir, slug);
  if (!(await pathExists(file))) throw new Error(`Feature brief '${slug}' not found. Run \`memoria feature start "${name}"\` first.`);

  const text = await readText(file);
  const checklist = countChecklist(text);
  const memories = await memorySearch(name, { cwd, silent: true });
  const savingsReports = (await listFiles(ws.paths.savingsReportsDir, ".json")).filter((report) =>
    path.basename(report).includes(slug),
  );

  return {
    name,
    slug,
    briefPath: file,
    checklist,
    relatedMemories: memories.length,
    savingsReports: savingsReports.length,
  };
}

function printFeatureStatus(status: FeatureStatus): void {
  logger.raw(`feature:         ${status.name}`);
  logger.raw(`brief:           ${status.briefPath}`);
  logger.raw(`checklist:       ${status.checklist.done}/${status.checklist.total} done (${status.checklist.open} open)`);
  logger.raw(`related memory:  ${status.relatedMemories}`);
  logger.raw(`savings reports: ${status.savingsReports}`);
  logger.raw(`next recall:     memoria recall "${status.name}" --budget 4000 --explain`);
}

interface ChecklistLine {
  number: number;
  index: number;
  raw: string;
  body: string;
  done: boolean;
}

function checklistLines(text: string): ChecklistLine[] {
  return Array.from(text.matchAll(/^- \[( |x|X)\] (.+)$/gm)).map((match, index) => ({
    number: index + 1,
    index: match.index ?? 0,
    raw: match[0] ?? "",
    body: match[2] ?? "",
    done: match[1]?.toLowerCase() === "x",
  }));
}

function resolveChecklistItem(items: ChecklistLine[], item: string): ChecklistLine {
  const trimmed = item.trim();
  const n = Number.parseInt(trimmed, 10);
  if (Number.isInteger(n) && String(n) === trimmed) {
    const byNumber = items.find((candidate) => candidate.number === n);
    if (!byNumber) throw new Error(`Checklist item #${n} not found.`);
    return byNumber;
  }

  const normalized = trimmed.toLowerCase();
  const matches = items.filter((candidate) => candidate.body.toLowerCase().includes(normalized));
  if (matches.length === 0) throw new Error(`Checklist item matching '${item}' not found.`);
  if (matches.length > 1) {
    throw new Error(`Checklist item '${item}' is ambiguous: ${matches.map((match) => `#${match.number}`).join(", ")}`);
  }
  return matches[0]!;
}

function slugify(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) throw new Error("Feature name must contain at least one letter or number");
  return slug;
}

function titleFromName(input: string): string {
  return input
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
