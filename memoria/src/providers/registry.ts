import type { Config } from "../core/config.js";
import { AnthropicAdapter } from "./anthropic.js";
import { OpenAIAdapter } from "./openai.js";
import { LocalEmbeddingAdapter } from "./local.js";
import type { EmbeddingProvider, LLMProvider } from "./types.js";

export interface ProviderRegistry {
  llm: Map<string, LLMProvider>;
  embedding: Map<string, EmbeddingProvider>;
}

/** Build a registry of all known providers, wired with env-based credentials. */
export function buildRegistry(config?: Config): ProviderRegistry {
  const anthropicKey = process.env[config?.providers.anthropic.apiKeyEnv ?? "ANTHROPIC_API_KEY"];
  const openaiKey = process.env[config?.providers.openai.apiKeyEnv ?? "OPENAI_API_KEY"];
  const anthropic = new AnthropicAdapter({ apiKey: anthropicKey });
  const openai = new OpenAIAdapter({ apiKey: openaiKey });
  const local = new LocalEmbeddingAdapter();

  return {
    llm: new Map<string, LLMProvider>([
      ["anthropic", anthropic],
      ["openai", openai],
    ]),
    embedding: new Map<string, EmbeddingProvider>([
      ["openai", openai],
      ["local", local],
    ]),
  };
}

/** Pick the LLM provider that owns a given model id, by prefix. */
export function llmProviderFor(model: string, registry: ProviderRegistry): LLMProvider | null {
  if (model.startsWith("claude")) return registry.llm.get("anthropic") ?? null;
  if (model.startsWith("gpt") || model.startsWith("o1") || model.startsWith("o3")) {
    return registry.llm.get("openai") ?? null;
  }
  return null;
}
