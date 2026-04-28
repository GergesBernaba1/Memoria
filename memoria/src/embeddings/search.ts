import type { EmbeddingRecord } from "./store.js";

/** Compute the cosine similarity between two equal-length vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(`vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i]!;
    const bi = b[i]!;
    dot += ai * bi;
    magA += ai * ai;
    magB += bi * bi;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export interface ScoredRecord {
  record: EmbeddingRecord;
  score: number;
  semanticScore?: number;
  keywordScore?: number;
  matchedTerms?: string[];
}

/**
 * Brute-force top-K cosine search. Fine for stores up to ~100k records;
 * beyond that we'd want HNSW/IVF (planned for v3 — see PLAN.md).
 */
export function topK(query: number[], records: Iterable<EmbeddingRecord>, k: number): ScoredRecord[] {
  const heap: ScoredRecord[] = [];
  for (const record of records) {
    const score = cosineSimilarity(query, record.vector);
    if (heap.length < k) {
      heap.push({ record, score });
      heap.sort((a, b) => a.score - b.score);
    } else if (heap[0]!.score < score) {
      heap[0] = { record, score };
      heap.sort((a, b) => a.score - b.score);
    }
  }
  // Return descending.
  return heap.sort((a, b) => b.score - a.score);
}

export interface HybridSearchOptions {
  queryText: string;
  semanticWeight?: number;
  keywordWeight?: number;
  metadataWeight?: number;
}

/**
 * Hybrid search combines vector similarity with lightweight lexical signals.
 * This keeps exact file/title/tag matches useful even when local embeddings are weak.
 */
export function hybridTopK(
  query: number[],
  records: Iterable<EmbeddingRecord>,
  k: number,
  opts: HybridSearchOptions,
): ScoredRecord[] {
  const terms = tokenize(opts.queryText);
  const semanticWeight = opts.semanticWeight ?? 0.75;
  const keywordWeight = opts.keywordWeight ?? 0.2;
  const metadataWeight = opts.metadataWeight ?? 0.05;

  const scored: ScoredRecord[] = [];
  for (const record of records) {
    const semanticScore = cosineSimilarity(query, record.vector);
    const keyword = lexicalScore(record.text, terms);
    const meta = lexicalScore(metadataText(record), terms);
    const score =
      semanticScore * semanticWeight +
      keyword.score * keywordWeight +
      meta.score * metadataWeight;
    scored.push({
      record,
      score,
      semanticScore,
      keywordScore: keyword.score,
      matchedTerms: Array.from(new Set([...keyword.matchedTerms, ...meta.matchedTerms])),
    });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, k);
}

function lexicalScore(text: string, terms: string[]): { score: number; matchedTerms: string[] } {
  if (terms.length === 0) return { score: 0, matchedTerms: [] };
  const haystack = text.toLowerCase();
  const matchedTerms = terms.filter((term) => haystack.includes(term));
  return {
    score: matchedTerms.length / terms.length,
    matchedTerms,
  };
}

function metadataText(record: EmbeddingRecord): string {
  const meta = record.meta ?? {};
  const values = Object.values(meta).flatMap((value) => {
    if (Array.isArray(value)) return value.map(String);
    if (value && typeof value === "object") return Object.values(value).map(String);
    return value === undefined || value === null ? [] : [String(value)];
  });
  return [record.id, record.sourceId, record.source, ...values].join(" ");
}

function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((term) => term.length >= 2),
    ),
  );
}
