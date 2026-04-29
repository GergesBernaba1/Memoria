import type { LLMProvider } from "../providers/types.js";
import type { ScoredRecord } from "./search.js";

export interface RerankOptions {
  query: string;
  /** LLM provider used for reranking — must be ready (API key set). */
  provider: LLMProvider;
  /** Model id for the rerank call (typically a cheap/fast model). */
  model: string;
  /** Cap how many candidates are sent to the LLM. */
  topNToRerank?: number;
  /** Truncate each candidate's text before sending. */
  charsPerCandidate?: number;
}

const RERANK_SYSTEM = `You rerank a list of search results by relevance to a developer's query.

Reply with ONLY a comma-separated list of the result indices, most relevant first.
Example reply: 3,0,5,1,2,4
Do not include any prose, code fences, or explanation. Indices not in your reply are kept in their original order at the end.`;

/**
 * Use a cheap LLM to reorder the top-N candidates by relevance to the query.
 * The remaining (un-reranked) candidates are appended in their original order.
 *
 * On any failure (API error, parse failure, all-zero output) the original
 * ordering is returned unchanged — reranking is best-effort.
 */
export async function rerankWithLLM(
  hits: ScoredRecord[],
  opts: RerankOptions,
): Promise<ScoredRecord[]> {
  if (hits.length <= 1) return hits;
  const topN = Math.min(opts.topNToRerank ?? 16, hits.length);
  const charLimit = opts.charsPerCandidate ?? 600;
  const candidates = hits.slice(0, topN);
  const tail = hits.slice(topN);

  const numbered = candidates
    .map((h, i) => {
      const snippet = h.record.text.replace(/\s+/g, " ").slice(0, charLimit);
      return `[${i}] (${h.record.source}: ${h.record.sourceId})\n${snippet}`;
    })
    .join("\n\n");

  let raw: string;
  try {
    const result = await opts.provider.chat({
      model: opts.model,
      messages: [
        { role: "system", content: RERANK_SYSTEM },
        { role: "user", content: `Query: ${opts.query}\n\nResults:\n${numbered}\n\nReply with the comma-separated indices.` },
      ],
      maxTokens: 80,
      temperature: 0,
    });
    raw = result.content;
  } catch {
    return hits;
  }

  const order = parseOrder(raw, candidates.length);
  if (order.length === 0) return hits;

  const reordered: ScoredRecord[] = [];
  const seen = new Set<number>();
  for (const idx of order) {
    if (idx < 0 || idx >= candidates.length || seen.has(idx)) continue;
    reordered.push(candidates[idx]!);
    seen.add(idx);
  }
  // Append any candidates the model didn't mention, in original order.
  for (let i = 0; i < candidates.length; i++) {
    if (!seen.has(i)) reordered.push(candidates[i]!);
  }
  return [...reordered, ...tail];
}

/**
 * Best-effort parser for the rerank response. Accepts comma- or
 * whitespace-separated indices, ignores anything non-numeric.
 */
export function parseOrder(text: string, max: number): number[] {
  const matches = text.match(/-?\d+/g);
  if (!matches) return [];
  const out: number[] = [];
  for (const m of matches) {
    const n = parseInt(m, 10);
    if (Number.isFinite(n) && n >= 0 && n < max) out.push(n);
  }
  return out;
}
