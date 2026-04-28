import { loadConfig } from "../core/config.js";
import { requireWorkspace } from "../core/workspace.js";
import { EmbeddingStore } from "../embeddings/store.js";
import { resolveEmbedder } from "../embeddings/provider.js";
import { hybridTopK, type ScoredRecord } from "../embeddings/search.js";
import { logger } from "../utils/logger.js";

export interface SearchOptions {
  k?: number;
  source?: "code" | "skill" | "brief" | "memory" | "all";
  json?: boolean;
  cwd?: string;
}

export async function runSearch(query: string, opts: SearchOptions = {}): Promise<ScoredRecord[]> {
  const ws = await requireWorkspace(opts.cwd);
  const config = await loadConfig(ws.paths.configFile);
  const k = opts.k ?? config.recall.topK;
  const source = opts.source ?? "all";

  const { provider, model } = resolveEmbedder(config);
  const [queryVec] = await provider.embed([query], model);
  if (!queryVec) throw new Error("Failed to embed query");

  const codeStore = new EmbeddingStore(ws.paths.embeddingsCodeFile);
  const skillStore = new EmbeddingStore(ws.paths.embeddingsSkillFile);
  const contextStore = new EmbeddingStore(ws.paths.embeddingsContextFile);
  const records = [];
  if (source === "code" || source === "all") {
    for await (const r of codeStore.iterate()) records.push(r);
  }
  if (source === "skill" || source === "all") {
    for await (const r of skillStore.iterate()) records.push(r);
  }
  if (source === "brief" || source === "memory" || source === "all") {
    for await (const r of contextStore.iterate()) {
      if (source === "all" || r.source === source) records.push(r);
    }
  }
  if (records.length === 0) {
    logger.warn("No embeddings yet. Run `memoria ingest` first.");
    return [];
  }

  const hits = hybridTopK(queryVec, records, k, { queryText: query });
  if (opts.json) {
    logger.json(
      hits.map((h) => ({
        score: h.score,
        semanticScore: h.semanticScore,
        keywordScore: h.keywordScore,
        matchedTerms: h.matchedTerms,
        id: h.record.id,
        sourceId: h.record.sourceId,
        source: h.record.source,
        meta: h.record.meta,
        text: h.record.text,
      })),
    );
    return hits;
  }
  for (const h of hits) {
    const where =
      h.record.source === "code"
        ? `${h.record.meta?.file}:${h.record.meta?.startLine}-${h.record.meta?.endLine}`
        : h.record.sourceId;
    logger.raw(`  ${h.score.toFixed(3)}  [${h.record.source}] ${where}`);
    if (h.matchedTerms?.length) {
      logger.raw(`      matched: ${h.matchedTerms.join(", ")}`);
    }
    const preview = h.record.text.split("\n").slice(0, 4).join("\n").replace(/\s+$/, "");
    if (preview) {
      logger.raw(
        preview
          .split("\n")
          .map((l) => `      ${l}`)
          .join("\n"),
      );
    }
    logger.raw("");
  }
  return hits;
}
