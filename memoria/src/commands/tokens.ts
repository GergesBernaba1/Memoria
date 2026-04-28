import { findWorkspace } from "../core/workspace.js";
import { loadConfig, type Config } from "../core/config.js";
import { countTokens } from "../tokens/counter.js";
import { estimateCost } from "../tokens/estimator.js";
import { compress } from "../tokens/compress.js";
import { listKnownModels } from "../tokens/pricing.js";
import { pathExists, readText } from "../utils/fs.js";
import { logger } from "../utils/logger.js";

const DEFAULT_MODEL = "claude-sonnet-4-6";

export interface TokensCountOptions {
  model?: string;
  json?: boolean;
  cwd?: string;
}

/** Resolve `<input>` as either a file path (if it exists) or a literal string. */
async function resolveInput(input: string): Promise<string> {
  if (await pathExists(input)) {
    return readText(input);
  }
  return input;
}

async function resolveModelAndConfig(
  opts: { model?: string; cwd?: string },
): Promise<{ model: string; config?: Config }> {
  const ws = await findWorkspace(opts.cwd);
  let config: Config | undefined;
  if (ws) {
    try {
      config = await loadConfig(ws.paths.configFile);
    } catch {
      // ignore — count works without a config
    }
  }
  const model = opts.model ?? config?.defaultModel ?? DEFAULT_MODEL;
  return { model, config };
}

export async function tokensCount(input: string, opts: TokensCountOptions = {}): Promise<void> {
  const text = await resolveInput(input);
  const { model } = await resolveModelAndConfig(opts);
  const result = countTokens(text, model);
  if (opts.json) {
    logger.json({ ...result, chars: text.length });
    return;
  }
  logger.raw(`model:     ${result.model}`);
  logger.raw(`tokenizer: ${result.tokenizer}`);
  logger.raw(`tokens:    ${result.tokens.toLocaleString()}`);
  logger.raw(`chars:     ${text.length.toLocaleString()}`);
}

export interface TokensEstimateOptions {
  model: string;
  outputTokens?: number;
  json?: boolean;
  cwd?: string;
}

export async function tokensEstimate(
  input: string,
  opts: TokensEstimateOptions,
): Promise<void> {
  const text = await resolveInput(input);
  const { config } = await resolveModelAndConfig(opts);
  const outputTokens = opts.outputTokens ?? 500;
  const { count, estimate } = estimateCost(text, opts.model, outputTokens, config);

  if (opts.json) {
    logger.json({ count, estimate });
    return;
  }
  logger.raw(`model:        ${estimate.model}`);
  logger.raw(`tokenizer:    ${count.tokenizer}`);
  logger.raw(`input tokens: ${estimate.inputTokens.toLocaleString()}`);
  logger.raw(`output (est): ${estimate.outputTokens.toLocaleString()}`);
  if (estimate.unpriced) {
    logger.warn(
      `No price registered for '${estimate.model}'. Known models: ${listKnownModels(config).join(", ")}`,
    );
    logger.warn("You can add a price to .memoria/config.json under `pricing.<model>`.");
    return;
  }
  logger.raw(`input  cost:  $${estimate.inputCostUsd.toFixed(6)}`);
  logger.raw(`output cost:  $${estimate.outputCostUsd.toFixed(6)}`);
  logger.raw(`total  cost:  $${estimate.totalCostUsd.toFixed(6)}`);
}

export interface TokensCompressOptions {
  model?: string;
  json?: boolean;
  cwd?: string;
}

export async function tokensCompress(
  input: string,
  opts: TokensCompressOptions = {},
): Promise<void> {
  const text = await resolveInput(input);
  const { model } = await resolveModelAndConfig(opts);
  const before = countTokens(text, model);
  const result = compress(text);
  const after = countTokens(result.text, model);
  if (opts.json) {
    logger.json({
      model,
      tokensBefore: before.tokens,
      tokensAfter: after.tokens,
      charsBefore: result.before,
      charsAfter: result.after,
      output: result.text,
    });
    return;
  }
  logger.raw(`model:         ${model}`);
  logger.raw(`tokens before: ${before.tokens.toLocaleString()}`);
  logger.raw(`tokens after:  ${after.tokens.toLocaleString()}`);
  logger.raw(`chars  saved:  ${result.savedChars.toLocaleString()}`);
  logger.raw("--- compressed ---");
  logger.raw(result.text);
}
