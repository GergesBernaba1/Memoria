import { z } from "zod";
import { readJson, writeJson, pathExists } from "../utils/fs.js";

export const PriceSchema = z.object({
  inputPerMillion: z.number().nonnegative(),
  outputPerMillion: z.number().nonnegative(),
});

export const ConfigSchema = z.object({
  version: z.literal(1).default(1),
  projectName: z.string().default("untitled"),
  defaultModel: z.string().default("claude-sonnet-4-6"),
  exclude: z
    .array(z.string())
    .default(["**/node_modules/**", "**/.git/**", "**/dist/**", "**/build/**"]),
  include: z
    .array(z.string())
    .default(["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"]),
  pricing: z.record(z.string(), PriceSchema).default({}),
  providers: z
    .object({
      anthropic: z
        .object({
          apiKeyEnv: z.string().default("ANTHROPIC_API_KEY"),
          defaultModel: z.string().default("claude-sonnet-4-6"),
        })
        .default({}),
      openai: z
        .object({
          apiKeyEnv: z.string().default("OPENAI_API_KEY"),
          defaultModel: z.string().default("gpt-4o"),
          embeddingModel: z.string().default("text-embedding-3-small"),
        })
        .default({}),
      local: z
        .object({
          embeddingModel: z.string().default("Xenova/all-MiniLM-L6-v2"),
        })
        .default({}),
    })
    .default({}),
  embeddings: z
    .object({
      provider: z.enum(["local", "openai"]).default("local"),
      model: z.string().default("Xenova/all-MiniLM-L6-v2"),
      chunkTokens: z.number().int().positive().default(512),
      chunkOverlapTokens: z.number().int().nonnegative().default(64),
    })
    .default({}),
  summarize: z
    .object({
      provider: z.enum(["anthropic", "openai"]).default("anthropic"),
      model: z.string().default("claude-haiku-4-5"),
      maxInputTokens: z.number().int().positive().default(20000),
      maxOutputTokens: z.number().int().positive().default(400),
    })
    .default({}),
  cluster: z
    .object({
      k: z.union([z.literal("auto"), z.number().int().positive()]).default("auto"),
      maxIterations: z.number().int().positive().default(50),
    })
    .default({}),
  recall: z
    .object({
      defaultBudgetTokens: z.number().int().positive().default(4000),
      topK: z.number().int().positive().default(8),
      expandHops: z.number().int().nonnegative().default(1),
    })
    .default({}),
  /**
   * v0.3 ask command: send a question to the configured LLM along with a
   * recalled context bundle. Supports Anthropic prompt caching of the context
   * span, plus an optional LLM reranker step before context assembly.
   */
  ask: z
    .object({
      /** LLM model used to answer questions. */
      model: z.string().default("claude-sonnet-4-6"),
      /** Output token cap for the answer. */
      maxOutputTokens: z.number().int().positive().default(1024),
      /** Sampling temperature. 0 favors determinism. */
      temperature: z.number().min(0).max(2).default(0.2),
      /**
       * Prompt-caching settings. When enabled, Memoria marks the recalled
       * context block with cache_control so repeat asks within ~5 minutes
       * are billed at the cache-read rate.
       */
      cache: z
        .object({
          enabled: z.boolean().default(true),
        })
        .default({}),
      /**
       * Optional LLM reranker: after hybrid top-K retrieval, ask a cheap
       * model to reorder the top N candidates by relevance. Disabled by
       * default since it costs an extra round-trip.
       */
      rerank: z
        .object({
          enabled: z.boolean().default(false),
          /** Model used for reranking; should be a cheap, fast model. */
          model: z.string().default("claude-haiku-4-5"),
          /** Max number of candidates to send to the reranker. */
          topNToRerank: z.number().int().positive().default(16),
        })
        .default({}),
    })
    .default({}),
});

export type Config = z.infer<typeof ConfigSchema>;
export type Price = z.infer<typeof PriceSchema>;

export function defaultConfig(projectName: string): Config {
  return ConfigSchema.parse({ projectName });
}

export async function loadConfig(configFile: string): Promise<Config> {
  if (!(await pathExists(configFile))) {
    throw new Error(`Config not found at ${configFile}. Run \`memoria init\` first.`);
  }
  const raw = await readJson(configFile);
  return ConfigSchema.parse(raw);
}

export async function saveConfig(configFile: string, config: Config): Promise<void> {
  await writeJson(configFile, ConfigSchema.parse(config));
}

export function getKey(config: Config, key: string): unknown {
  const parts = key.split(".");
  let cur: unknown = config;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return cur;
}

export function setKey(config: Config, key: string, rawValue: string): Config {
  const parts = key.split(".");
  if (parts.length === 0) throw new Error("empty key");
  const value = coerceValue(rawValue);
  const next = JSON.parse(JSON.stringify(config)) as Record<string, unknown>;
  let cur: Record<string, unknown> = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]!;
    if (typeof cur[p] !== "object" || cur[p] === null) {
      cur[p] = {};
    }
    cur = cur[p] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]!] = value;
  return ConfigSchema.parse(next);
}

function coerceValue(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}
