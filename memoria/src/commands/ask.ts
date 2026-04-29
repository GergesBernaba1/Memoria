import { loadConfig } from "../core/config.js";
import { requireWorkspace } from "../core/workspace.js";
import { assembleRecall, type RecallResult } from "../recall/assembler.js";
import { buildRegistry, llmProviderFor, type ProviderRegistry } from "../providers/registry.js";
import { ProviderNotReadyError, type ChatResult, type LLMProvider } from "../providers/types.js";
import { logger } from "../utils/logger.js";

const ASK_SYSTEM = `You are an AI coding assistant using Memoria context.

Answer the user's question using the recalled context as the source of truth.
If the context is insufficient, say what is missing and suggest one targeted Memoria command or file to inspect.
Keep the answer concrete and implementation-oriented.`;

export interface AskOptions {
  budgetTokens?: number;
  topK?: number;
  hops?: number;
  model?: string;
  maxOutputTokens?: number;
  temperature?: number;
  cache?: boolean;
  rerank?: boolean;
  json?: boolean;
  cwd?: string;
  registry?: ProviderRegistry;
}

export interface AskResult {
  query: string;
  answer: string;
  model: string;
  recall: {
    budgetTokens: number;
    usedTokens: number;
    sections: Array<{ title: string; tokens: number; source?: string; sourceId?: string }>;
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationTokens: number;
    cacheReadTokens: number;
  };
  rerank: {
    enabled: boolean;
    model?: string;
  };
}

export async function runAsk(query: string, opts: AskOptions = {}): Promise<AskResult> {
  const ws = await requireWorkspace(opts.cwd);
  const config = await loadConfig(ws.paths.configFile);
  const registry = opts.registry ?? buildRegistry(config);

  const model = opts.model ?? config.ask.model;
  const provider = readyProvider(model, registry);
  const rerankEnabled = opts.rerank ?? config.ask.rerank.enabled;
  const rerankModel = config.ask.rerank.model;
  const rerankProvider = rerankEnabled ? readyProvider(rerankModel, registry) : null;

  const recall = await assembleRecall(ws.paths, config, {
    query,
    budgetTokens: opts.budgetTokens,
    topK: opts.topK,
    expandHops: opts.hops,
    budgetModel: model,
    rerank: rerankProvider
      ? {
          provider: rerankProvider,
          model: rerankModel,
          topNToRerank: config.ask.rerank.topNToRerank,
        }
      : undefined,
  });

  const cacheEnabled = opts.cache ?? config.ask.cache.enabled;
  const chat = await provider.chat({
    model,
    messages: [{ role: "user", content: query }],
    systemBlocks: [
      ASK_SYSTEM,
      `Memoria recalled context:\n\n${recall.context}`,
    ],
    cacheBreakpoints: cacheEnabled ? [{ systemBlockIndex: 1, ttl: "ephemeral" }] : undefined,
    maxTokens: opts.maxOutputTokens ?? config.ask.maxOutputTokens,
    temperature: opts.temperature ?? config.ask.temperature,
  });

  const result = toAskResult(query, model, recall, chat, {
    enabled: rerankEnabled,
    model: rerankEnabled ? rerankModel : undefined,
  });

  if (opts.json) {
    logger.json(result);
    return result;
  }

  logger.raw(result.answer);
  logger.raw("");
  logger.raw("Usage:");
  logger.raw(`  model:          ${result.model}`);
  logger.raw(`  input tokens:   ${result.usage.inputTokens.toLocaleString()}`);
  logger.raw(`  output tokens:  ${result.usage.outputTokens.toLocaleString()}`);
  if (result.usage.cacheCreationTokens || result.usage.cacheReadTokens) {
    logger.raw(`  cache write:    ${result.usage.cacheCreationTokens.toLocaleString()}`);
    logger.raw(`  cache read:     ${result.usage.cacheReadTokens.toLocaleString()}`);
  }
  logger.raw(`  recall budget:  ${result.recall.usedTokens}/${result.recall.budgetTokens}`);
  logger.raw(`  recall sections:${result.recall.sections.length}`);
  if (result.rerank.enabled) logger.raw(`  rerank model:   ${result.rerank.model}`);
  return result;
}

function readyProvider(model: string, registry: ProviderRegistry): LLMProvider {
  const provider = llmProviderFor(model, registry);
  if (!provider) throw new Error(`No LLM provider found for model '${model}'.`);
  if (!provider.isReady()) {
    throw new ProviderNotReadyError(provider.name, `model '${model}' is configured but provider credentials are not available`);
  }
  return provider;
}

function toAskResult(
  query: string,
  model: string,
  recall: RecallResult,
  chat: ChatResult,
  rerank: AskResult["rerank"],
): AskResult {
  return {
    query,
    answer: chat.content,
    model,
    recall: {
      budgetTokens: recall.budgetTokens,
      usedTokens: recall.usedTokens,
      sections: recall.sections.map((section) => ({
        title: section.title,
        tokens: section.tokens,
        source: section.source,
        sourceId: section.sourceId,
      })),
    },
    usage: {
      inputTokens: chat.inputTokens,
      outputTokens: chat.outputTokens,
      cacheCreationTokens: chat.cacheCreationTokens ?? 0,
      cacheReadTokens: chat.cacheReadTokens ?? 0,
    },
    rerank,
  };
}
