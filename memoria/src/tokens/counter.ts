import { encodingForModel, getEncoding, type Tiktoken } from "js-tiktoken";
import { countTokens as anthropicCountTokens } from "@anthropic-ai/tokenizer";

export type Tokenizer = "claude" | "openai" | "approx";

export interface CountResult {
  tokens: number;
  tokenizer: Tokenizer;
  model: string;
}

/**
 * Pick the appropriate tokenizer for a model id.
 * - claude-* → Anthropic's tokenizer (close approximation; exact Claude
 *   tokenization is server-side only).
 * - gpt-*    → tiktoken via js-tiktoken.
 * - other    → length/4 heuristic so the CLI never crashes on unknown ids.
 */
export function selectTokenizer(model: string): Tokenizer {
  if (model.startsWith("claude")) return "claude";
  if (model.startsWith("gpt") || model.startsWith("o1") || model.startsWith("o3")) return "openai";
  return "approx";
}

const openaiEncodingCache: Map<string, Tiktoken> = new Map();

function openaiEncoding(model: string): Tiktoken {
  const cached = openaiEncodingCache.get(model);
  if (cached) return cached;
  let enc: Tiktoken;
  try {
    enc = encodingForModel(model as Parameters<typeof encodingForModel>[0]);
  } catch {
    // Unknown OpenAI model → fall back to o200k_base (used by gpt-4o family).
    enc = getEncoding("o200k_base");
  }
  openaiEncodingCache.set(model, enc);
  return enc;
}

export function countTokens(text: string, model: string): CountResult {
  const tokenizer = selectTokenizer(model);
  switch (tokenizer) {
    case "claude":
      return { tokens: anthropicCountTokens(text), tokenizer, model };
    case "openai":
      return { tokens: openaiEncoding(model).encode(text).length, tokenizer, model };
    case "approx":
      // 4 chars/token is a widely-used rough heuristic.
      return { tokens: Math.ceil(text.length / 4), tokenizer, model };
  }
}
