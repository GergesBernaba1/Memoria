import type { Config } from "../core/config.js";
import { countTokens, type CountResult } from "./counter.js";
import { priceFor } from "./pricing.js";

export interface CostEstimate {
  model: string;
  inputTokens: number;
  outputTokens: number;
  inputCostUsd: number;
  outputCostUsd: number;
  totalCostUsd: number;
  /** True when no price was found and we treated cost as 0. */
  unpriced: boolean;
}

/**
 * Estimate the cost of an LLM call, given input text and a *projected* output
 * token count. If no price is registered for the model, returns zeros and sets
 * `unpriced: true` so callers can surface a warning.
 */
export function estimateCost(
  inputText: string,
  model: string,
  outputTokens: number,
  config?: Config,
): { count: CountResult; estimate: CostEstimate } {
  const count = countTokens(inputText, model);
  const price = priceFor(model, config);
  if (!price) {
    return {
      count,
      estimate: {
        model,
        inputTokens: count.tokens,
        outputTokens,
        inputCostUsd: 0,
        outputCostUsd: 0,
        totalCostUsd: 0,
        unpriced: true,
      },
    };
  }
  const inputCost = (count.tokens / 1_000_000) * price.inputPerMillion;
  const outputCost = (outputTokens / 1_000_000) * price.outputPerMillion;
  return {
    count,
    estimate: {
      model,
      inputTokens: count.tokens,
      outputTokens,
      inputCostUsd: round6(inputCost),
      outputCostUsd: round6(outputCost),
      totalCostUsd: round6(inputCost + outputCost),
      unpriced: false,
    },
  };
}

function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}
