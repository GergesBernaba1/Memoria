import type { Config, Price } from "../core/config.js";

/**
 * Built-in pricing table. USD per 1 million tokens.
 *
 * NOTE: Pricing is current as of 2026-04-29 to the best of our knowledge but
 * vendors change pricing without warning. Override per-model in
 * `.memoria/config.json` under `pricing.<model-id>`.
 */
export const BUILTIN_PRICES: Record<string, Price> = {
  // Anthropic
  "claude-opus-4-6": { inputPerMillion: 15, outputPerMillion: 75 },
  "claude-sonnet-4-6": { inputPerMillion: 3, outputPerMillion: 15 },
  "claude-haiku-4-5": { inputPerMillion: 1, outputPerMillion: 5 },
  // Older Anthropic ids people still pass — keep around so estimator doesn't fail.
  "claude-3-5-sonnet-latest": { inputPerMillion: 3, outputPerMillion: 15 },
  "claude-3-5-haiku-latest": { inputPerMillion: 0.8, outputPerMillion: 4 },
  // OpenAI
  "gpt-4o": { inputPerMillion: 2.5, outputPerMillion: 10 },
  "gpt-4o-mini": { inputPerMillion: 0.15, outputPerMillion: 0.6 },
  "gpt-4-turbo": { inputPerMillion: 10, outputPerMillion: 30 },
  "gpt-4": { inputPerMillion: 30, outputPerMillion: 60 },
};

/**
 * Resolve the price for a model, preferring user overrides in `config.pricing`.
 * Returns null if unknown so callers can warn the user.
 */
export function priceFor(model: string, config?: Config): Price | null {
  const override = config?.pricing?.[model];
  if (override) return override;
  return BUILTIN_PRICES[model] ?? null;
}

export function listKnownModels(config?: Config): string[] {
  const set = new Set<string>(Object.keys(BUILTIN_PRICES));
  if (config?.pricing) for (const k of Object.keys(config.pricing)) set.add(k);
  return [...set].sort();
}
