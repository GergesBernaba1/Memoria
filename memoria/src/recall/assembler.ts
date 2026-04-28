import type { Config } from "../core/config.js";
import type { MemoriaPaths } from "../core/paths.js";
import { EmbeddingStore, type EmbeddingRecord } from "../embeddings/store.js";
import { resolveEmbedder } from "../embeddings/provider.js";
import { hybridTopK, type ScoredRecord } from "../embeddings/search.js";
import { KgStore } from "../kg/store.js";
import { buildIndex, expand } from "../kg/traverse.js";
import { SummaryStore } from "../summarize/store.js";
import { countTokens } from "../tokens/counter.js";
import type { Entity } from "../kg/types.js";

export interface RecallOptions {
  query: string;
  budgetTokens?: number;
  topK?: number;
  expandHops?: number;
  /** Tokenizer model id used for budgeting (default: config.defaultModel). */
  budgetModel?: string;
}

export interface RecallSection {
  title: string;
  content: string;
  tokens: number;
  source?: EmbeddingRecord["source"] | "query";
  sourceId?: string;
  score?: number;
  reason?: string;
  meta?: Record<string, unknown>;
}

export interface RecallResult {
  query: string;
  budgetTokens: number;
  usedTokens: number;
  sections: RecallSection[];
  /** The fully assembled context, ready to paste into a prompt. */
  context: string;
  /** Per-source diagnostics. */
  hits: ScoredRecord[];
  expandedEntityIds: string[];
  droppedSections: RecallSection[];
}

/**
 * Assemble a token-budgeted context for an LLM query.
 *
 * Pipeline:
 *   1. Embed the query (using the configured embedder; same model as the index).
 *   2. Top-K cosine search across code + skill + summary embeddings.
 *   3. Expand 1-hop in the KG from each hit's source entity.
 *   4. Pull summaries first (compressed, high-signal), then code chunks.
 *   5. Append matching skills.
 *   6. Pack sections greedily until the token budget is exhausted.
 */
export async function assembleRecall(
  paths: MemoriaPaths,
  config: Config,
  opts: RecallOptions,
): Promise<RecallResult> {
  const budgetTokens = opts.budgetTokens ?? config.recall.defaultBudgetTokens;
  const k = opts.topK ?? config.recall.topK;
  const hops = opts.expandHops ?? config.recall.expandHops;
  const budgetModel = opts.budgetModel ?? config.defaultModel;

  // 1. Embed the query.
  const { provider: embedder, model: embedModel } = resolveEmbedder(config);
  const [queryVec] = await embedder.embed([opts.query], embedModel);
  if (!queryVec) throw new Error("Failed to embed query");

  // 2. Combined top-K across code + skills (both files share the same vector space).
  const codeStore = new EmbeddingStore(paths.embeddingsCodeFile);
  const skillStore = new EmbeddingStore(paths.embeddingsSkillFile);
  const contextStore = new EmbeddingStore(paths.embeddingsContextFile);
  const all: EmbeddingRecord[] = [];
  for await (const r of codeStore.iterate()) all.push(r);
  for await (const r of skillStore.iterate()) all.push(r);
  for await (const r of contextStore.iterate()) all.push(r);

  let hits: ScoredRecord[] = [];
  if (all.length > 0) {
    hits = hybridTopK(queryVec, all, k * 2, { queryText: opts.query });
    hits = dedupeHits(hits).slice(0, k);
  }

  // 3. KG expansion.
  const kg = new KgStore(paths.kgEntitiesFile, paths.kgRelationshipsFile, paths.kgClustersFile);
  const entities = await kg.readEntities();
  const rels = await kg.readRelationships();
  const index = buildIndex(entities, rels);
  const seedIds = uniq(hits.map((h) => h.record.sourceId));
  const expandedIds = expand(seedIds, index, hops, k * 4);
  const expandedEntities = expandedIds
    .map((id) => index.entities.get(id))
    .filter((e): e is Entity => Boolean(e));

  // 4-5. Build candidate sections (summaries → code → skills).
  const summaryStore = new SummaryStore(paths.kgSummariesDir);
  const sections: RecallSection[] = [];

  // Header
  sections.push(makeSection("Query", opts.query, budgetModel, {
    source: "query",
    reason: "original user query",
  }));

  // Summaries for each expanded entity.
  for (const ent of expandedEntities) {
    const summary = await summaryStore.get(ent.id);
    if (!summary) continue;
    sections.push(
      makeSection(
        `Summary: ${ent.id}`,
        summary.body.trim(),
        budgetModel,
        {
          source: "summary",
          sourceId: ent.id,
          reason: "included because KG expansion found a related entity summary",
          meta: { entityId: ent.id, file: ent.file },
        },
      ),
    );
  }

  // Context, code, and skills, grouped by source.
  const briefHits = hits.filter((h) => h.record.source === "brief");
  const memoryHits = hits.filter((h) => h.record.source === "memory");
  const skillHits = hits.filter((h) => h.record.source === "skill");
  const codeHits = hits.filter((h) => h.record.source === "code" || h.record.source === "summary");

  for (const h of briefHits) {
    sections.push(
      makeSection(
        `Brief: ${h.record.sourceId}`,
        h.record.text.trim(),
        budgetModel,
        sectionMeta(h, "brief matched the query"),
      ),
    );
  }
  for (const h of memoryHits) {
    sections.push(
      makeSection(
        `Memory: ${h.record.sourceId}`,
        h.record.text.trim(),
        budgetModel,
        sectionMeta(h, "memory matched the query"),
      ),
    );
  }
  for (const h of codeHits) {
    sections.push(
      makeSection(
        `Code: ${h.record.sourceId}`,
        h.record.text.trim(),
        budgetModel,
        sectionMeta(h, "code or summary chunk ranked by hybrid search"),
      ),
    );
  }
  for (const h of skillHits) {
    sections.push(
      makeSection(
        `Skill: ${h.record.sourceId}`,
        h.record.text.trim(),
        budgetModel,
        sectionMeta(h, "skill matched the query"),
      ),
    );
  }

  // 6. Greedy pack within budget. The Query section is always kept.
  const packed: RecallSection[] = [];
  const dropped: RecallSection[] = [];
  let used = 0;
  for (const s of sections) {
    if (packed.length === 0 || used + s.tokens <= budgetTokens) {
      packed.push(s);
      used += s.tokens;
    } else {
      dropped.push(s);
    }
  }

  const context = packed
    .map((s) => `### ${s.title}\n${s.content}`)
    .join("\n\n");

  return {
    query: opts.query,
    budgetTokens,
    usedTokens: used,
    sections: packed,
    context,
    hits,
    expandedEntityIds: expandedIds,
    droppedSections: dropped,
  };
}

function makeSection(
  title: string,
  content: string,
  model: string,
  meta?: Omit<RecallSection, "title" | "content" | "tokens">,
): RecallSection {
  // ~10 tokens of overhead for the header + spacing — close enough.
  const tokens = countTokens(`### ${title}\n${content}\n\n`, model).tokens;
  return { title, content, tokens, ...meta };
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function sectionMeta(h: ScoredRecord, reason: string): Omit<RecallSection, "title" | "content" | "tokens"> {
  return {
    source: h.record.source,
    sourceId: h.record.sourceId,
    score: h.score,
    reason: h.matchedTerms?.length ? `${reason}; matched terms: ${h.matchedTerms.join(", ")}` : reason,
    meta: h.record.meta,
  };
}

function dedupeHits(hits: ScoredRecord[]): ScoredRecord[] {
  const seen = new Set<string>();
  const out: ScoredRecord[] = [];
  for (const hit of hits) {
    const key = dedupeKey(hit.record);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hit);
  }
  return out;
}

function dedupeKey(record: EmbeddingRecord): string {
  const file = (record.meta as { file?: string } | undefined)?.file;
  if (record.source === "code" || record.source === "summary") {
    return `${record.source}:${file ?? record.sourceId}`;
  }
  return `${record.source}:${record.sourceId}`;
}
