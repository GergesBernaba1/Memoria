import type { Config } from "../core/config.js";
import { buildRegistry, type ProviderRegistry } from "../providers/registry.js";
import type { EmbeddingProvider } from "../providers/types.js";

export interface ResolvedEmbedder {
  provider: EmbeddingProvider;
  model: string;
  dimensions: number;
}

/**
 * Pick the embedding provider + model the user configured. Falls back to
 * `local` if the configured provider isn't ready (e.g. OpenAI without a key).
 */
export function resolveEmbedder(
  config: Config,
  registry: ProviderRegistry = buildRegistry(config),
): ResolvedEmbedder {
  const providerName = config.embeddings.provider;
  let provider = registry.embedding.get(providerName);
  let model = config.embeddings.model;

  if (!provider || !provider.isReady()) {
    const fallback = registry.embedding.get("local");
    if (!fallback) throw new Error(`No embedding provider available (configured: ${providerName})`);
    provider = fallback;
    // If the user picked OpenAI's model id but we fell back to local, switch
    // to a sensible local default.
    if (providerName === "openai") model = "Xenova/all-MiniLM-L6-v2";
  }
  return { provider, model, dimensions: provider.dimensions(model) };
}
