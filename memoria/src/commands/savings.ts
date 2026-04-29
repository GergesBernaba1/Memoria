import path from "node:path";
import { promises as fs } from "node:fs";
import { loadConfig } from "../core/config.js";
import { requireWorkspace } from "../core/workspace.js";
import { listSourceFiles } from "../ingest/walker.js";
import { assembleRecall } from "../recall/assembler.js";
import { countTokens } from "../tokens/counter.js";
import { estimateCost } from "../tokens/estimator.js";
import { ensureDir, pathExists, readText, writeJson } from "../utils/fs.js";
import { logger } from "../utils/logger.js";

type BaselineMode = "all-indexed" | "file" | "directory" | "manual";

export interface SavingsOptions {
  baseline?: BaselineMode;
  input?: string;
  budgetTokens?: number;
  topK?: number;
  model?: string;
  outputTokens?: number;
  save?: boolean;
  json?: boolean;
  silent?: boolean;
  cwd?: string;
}

export interface SavingsReport {
  query: string;
  baselineMode: BaselineMode;
  model: string;
  baselineTokens: number;
  memoriaTokens: number;
  savedTokens: number;
  savingsPercent: number;
  baselineCostUsd: number;
  memoriaCostUsd: number;
  savedCostUsd: number;
  recallSections: Array<{ title: string; tokens: number }>;
  savedAt?: string;
  reportPath?: string;
}

export async function runSavings(query: string, opts: SavingsOptions = {}): Promise<SavingsReport> {
  const ws = await requireWorkspace(opts.cwd);
  const config = await loadConfig(ws.paths.configFile);
  const model = opts.model ?? config.defaultModel;
  const outputTokens = opts.outputTokens ?? 500;
  const baselineMode = opts.baseline ?? "all-indexed";

  const baselineText = await baselineFor(ws.projectRoot, config, {
    mode: baselineMode,
    input: opts.input,
  });
  const recall = await assembleRecall(ws.paths, config, {
    query,
    budgetTokens: opts.budgetTokens,
    topK: opts.topK,
    budgetModel: model,
  });

  const baselineTokens = countTokens(baselineText, model).tokens;
  const memoriaTokens = countTokens(recall.context, model).tokens;
  const savedTokens = Math.max(0, baselineTokens - memoriaTokens);
  const savingsPercent = baselineTokens === 0 ? 0 : round2((savedTokens / baselineTokens) * 100);
  const baselineCost = estimateCost(baselineText, model, outputTokens, config).estimate.totalCostUsd;
  const memoriaCost = estimateCost(recall.context, model, outputTokens, config).estimate.totalCostUsd;

  const report: SavingsReport = {
    query,
    baselineMode,
    model,
    baselineTokens,
    memoriaTokens,
    savedTokens,
    savingsPercent,
    baselineCostUsd: baselineCost,
    memoriaCostUsd: memoriaCost,
    savedCostUsd: round6(Math.max(0, baselineCost - memoriaCost)),
    recallSections: recall.sections.map((s) => ({ title: s.title, tokens: s.tokens })),
  };

  if (opts.save) {
    const savedAt = new Date().toISOString();
    const file = path.join(ws.paths.savingsReportsDir, `${savedAt.replace(/[-:]/g, "").replace(/\..+$/, "")}-${slugify(query)}.json`);
    await ensureDir(ws.paths.savingsReportsDir);
    await writeJson(file, { ...report, savedAt, reportPath: file });
    report.savedAt = savedAt;
    report.reportPath = file;
  }

  if (opts.json) {
    logger.json(report);
    return report;
  }
  if (opts.silent) return report;

  logger.raw(`query:           ${query}`);
  logger.raw(`baseline:        ${baselineMode}`);
  logger.raw(`model:           ${model}`);
  logger.raw(`baseline tokens: ${baselineTokens.toLocaleString()}`);
  logger.raw(`memoria tokens:  ${memoriaTokens.toLocaleString()}`);
  logger.raw(`saved tokens:    ${savedTokens.toLocaleString()} (${savingsPercent.toFixed(2)}%)`);
  logger.raw(`cost saved:      $${report.savedCostUsd.toFixed(6)}`);
  if (report.reportPath) logger.raw(`report:          ${report.reportPath}`);
  return report;
}

async function baselineFor(
  projectRoot: string,
  config: Awaited<ReturnType<typeof loadConfig>>,
  opts: { mode: BaselineMode; input?: string },
): Promise<string> {
  if (opts.mode === "manual") {
    if (!opts.input) throw new Error("--input is required with --baseline manual");
    return opts.input;
  }

  if (opts.mode === "file") {
    if (!opts.input) throw new Error("--input <path> is required with --baseline file");
    const abs = path.resolve(projectRoot, opts.input);
    if (!(await pathExists(abs))) throw new Error(`Baseline file not found: ${opts.input}`);
    return readText(abs);
  }

  if (opts.mode === "directory") {
    if (!opts.input) throw new Error("--input <path> is required with --baseline directory");
    const absDir = path.resolve(projectRoot, opts.input);
    const files = await listSourceFiles(projectRoot, {
      include: config.include,
      exclude: config.exclude,
    });
    const texts: string[] = [];
    for (const file of files.filter((f) => f.abs.startsWith(absDir + path.sep) || f.abs === absDir)) {
      texts.push(`### ${file.rel}\n${await fs.readFile(file.abs, "utf8")}`);
    }
    return texts.join("\n\n");
  }

  const files = await listSourceFiles(projectRoot, {
    include: config.include,
    exclude: config.exclude,
  });
  if (files.length === 0) {
    throw new Error("No source files found for --baseline all-indexed. Use --baseline file|directory|manual.");
  }
  const texts: string[] = [];
  for (const file of files) {
    texts.push(`### ${file.rel}\n${await fs.readFile(file.abs, "utf8")}`);
  }
  return texts.join("\n\n");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

function slugify(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "query";
}
