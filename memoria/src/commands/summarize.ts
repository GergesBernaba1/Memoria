import { promises as fs } from "node:fs";
import path from "node:path";
import { loadConfig } from "../core/config.js";
import { requireWorkspace } from "../core/workspace.js";
import { listSourceFiles } from "../ingest/walker.js";
import { buildRegistry, llmProviderFor } from "../providers/registry.js";
import { hashContent, summarizeFile } from "../summarize/code.js";
import { SummaryStore } from "../summarize/store.js";
import { logger } from "../utils/logger.js";

export interface SummarizeOptions {
  /** Optional path filter — relative or absolute. If a directory, all files in it. */
  target?: string;
  /** Re-summarize even when the content hash matches. */
  force?: boolean;
  /** Cap on number of files to summarize this run. */
  limit?: number;
  cwd?: string;
}

export async function runSummarize(opts: SummarizeOptions = {}): Promise<{ written: number; skipped: number }> {
  const ws = await requireWorkspace(opts.cwd);
  const config = await loadConfig(ws.paths.configFile);

  const files = await listSourceFiles(ws.projectRoot, {
    include: config.include,
    exclude: config.exclude,
  });

  let candidates = files;
  if (opts.target) {
    const abs = path.resolve(opts.target);
    candidates = files.filter((f) => f.abs === abs || f.abs.startsWith(abs + path.sep));
    if (candidates.length === 0) {
      logger.warn(`No matching source files under ${opts.target}`);
      return { written: 0, skipped: 0 };
    }
  }
  if (opts.limit) candidates = candidates.slice(0, opts.limit);

  const registry = buildRegistry(config);
  const model = config.summarize.model;
  const provider = llmProviderFor(model, registry);
  if (!provider) {
    throw new Error(`No LLM provider can serve model '${model}'.`);
  }
  if (!provider.isReady()) {
    throw new Error(
      `Provider '${provider.name}' is not ready (set the API key env var). Configured model: ${model}`,
    );
  }

  const store = new SummaryStore(ws.paths.kgSummariesDir);
  let written = 0;
  let skipped = 0;

  for (const f of candidates) {
    const source = await fs.readFile(f.abs, "utf8");
    const entityId = f.rel; // file-level summary
    const existing = await store.get(entityId);
    if (!opts.force && existing && existing.frontmatter.contentHash === hashContent(source)) {
      skipped++;
      continue;
    }
    logger.info(`summarize ${f.rel}`);
    const result = await summarizeFile({ entityId, file: f.rel, source }, {
      provider,
      model,
      config,
    });
    if (!result) {
      logger.warn(
        `  skipped (input exceeds summarize.maxInputTokens=${config.summarize.maxInputTokens})`,
      );
      skipped++;
      continue;
    }
    await store.put(result.summary);
    written++;
  }

  logger.success(`summaries written: ${written}, skipped: ${skipped}`);
  return { written, skipped };
}
