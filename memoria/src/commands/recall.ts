import { loadConfig } from "../core/config.js";
import { requireWorkspace } from "../core/workspace.js";
import { assembleRecall } from "../recall/assembler.js";
import { logger } from "../utils/logger.js";

export interface RecallCommandOptions {
  budgetTokens?: number;
  topK?: number;
  hops?: number;
  budgetModel?: string;
  json?: boolean;
  explain?: boolean;
  cwd?: string;
}

export async function runRecall(query: string, opts: RecallCommandOptions = {}): Promise<void> {
  const ws = await requireWorkspace(opts.cwd);
  const config = await loadConfig(ws.paths.configFile);

  const result = await assembleRecall(ws.paths, config, {
    query,
    budgetTokens: opts.budgetTokens,
    topK: opts.topK,
    expandHops: opts.hops,
    budgetModel: opts.budgetModel,
  });

  if (opts.json) {
    logger.json({
      query: result.query,
      budgetTokens: result.budgetTokens,
      usedTokens: result.usedTokens,
      sections: result.sections.map((s) => ({
        title: s.title,
        tokens: s.tokens,
        source: s.source,
        sourceId: s.sourceId,
        score: s.score,
        reason: s.reason,
        meta: s.meta,
      })),
      droppedSections: result.droppedSections.map((s) => ({
        title: s.title,
        tokens: s.tokens,
        source: s.source,
        sourceId: s.sourceId,
        score: s.score,
        reason: s.reason,
      })),
      hits: result.hits.map((h) => ({
        score: h.score,
        semanticScore: h.semanticScore,
        keywordScore: h.keywordScore,
        matchedTerms: h.matchedTerms,
        sourceId: h.record.sourceId,
        source: h.record.source,
      })),
      expandedEntityIds: result.expandedEntityIds,
      context: result.context,
    });
    return;
  }

  logger.info(`budget: ${result.usedTokens}/${result.budgetTokens} tokens, ${result.sections.length} sections`);
  if (opts.explain) {
    logger.raw("");
    logger.raw("Explain:");
    for (const s of result.sections) {
      if (s.source === "query") continue;
      const score = typeof s.score === "number" ? ` score=${s.score.toFixed(3)}` : "";
      logger.raw(`  + ${s.title} (${s.tokens} tokens${score})`);
      if (s.reason) logger.raw(`    ${s.reason}`);
    }
    for (const s of result.droppedSections) {
      logger.raw(`  - dropped ${s.title} (${s.tokens} tokens): over budget`);
    }
  }
  logger.raw("");
  logger.raw(result.context);
}
