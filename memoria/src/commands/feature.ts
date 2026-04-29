import path from "node:path";
import { briefFilePath } from "../core/paths.js";
import { requireWorkspace } from "../core/workspace.js";
import { runIngest } from "./ingest.js";
import { memoryAdd, memorySearch } from "./memory.js";
import { runRecall } from "./recall.js";
import { runSavings } from "./savings.js";
import { briefChecklist, briefCreate, briefPath } from "./brief.js";
import { listFiles, pathExists, readText } from "../utils/fs.js";
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

export async function featureStatus(name: string, opts: { cwd?: string; json?: boolean } = {}): Promise<FeatureStatus> {
  const ws = await requireWorkspace(opts.cwd);
  const slug = slugify(name);
  const file = briefFilePath(ws.paths.briefsDir, slug);
  if (!(await pathExists(file))) throw new Error(`Feature brief '${slug}' not found. Run \`memoria feature start "${name}"\` first.`);

  const text = await readText(file);
  const checklist = countChecklist(text);
  const memories = await memorySearch(name, { cwd: opts.cwd, silent: true });
  const savingsReports = (await listFiles(ws.paths.savingsReportsDir, ".json")).filter((report) =>
    path.basename(report).includes(slug),
  );

  const status: FeatureStatus = {
    name,
    slug,
    briefPath: file,
    checklist,
    relatedMemories: memories.length,
    savingsReports: savingsReports.length,
  };

  if (opts.json) {
    logger.json(status);
    return status;
  }

  logger.raw(`feature:         ${name}`);
  logger.raw(`brief:           ${file}`);
  logger.raw(`checklist:       ${checklist.done}/${checklist.total} done (${checklist.open} open)`);
  logger.raw(`related memory:  ${memories.length}`);
  logger.raw(`savings reports: ${savingsReports.length}`);
  logger.raw(`next recall:     memoria recall "${name}" --budget 4000 --explain`);
  return status;
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
