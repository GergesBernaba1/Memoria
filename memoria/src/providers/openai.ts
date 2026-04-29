import OpenAI from "openai";
import { encodingForModel, getEncoding, type Tiktoken } from "js-tiktoken";
import {
  ProviderNotReadyError,
  type ChatOpts,
  type ChatResult,
  type EmbeddingProvider,
  type LLMProvider,
} from "./types.js";

export interface OpenAIAdapterOpts {
  apiKey?: string;
}

export class OpenAIAdapter implements LLMProvider, EmbeddingProvider {
  readonly name = "openai";
  private client: OpenAI | null;
  private encodingCache = new Map<string, Tiktoken>();

  constructor(opts: OpenAIAdapterOpts = {}) {
    const key = opts.apiKey ?? process.env.OPENAI_API_KEY;
    this.client = key ? new OpenAI({ apiKey: key }) : null;
  }

  isReady(): boolean {
    return this.client !== null;
  }

  async chat(opts: ChatOpts): Promise<ChatResult> {
    if (!this.client) throw new ProviderNotReadyError("openai", "OPENAI_API_KEY not set");
    const messages = opts.systemBlocks && opts.systemBlocks.length > 0
      ? [
          ...opts.systemBlocks.map((content) => ({ role: "system" as const, content })),
          ...opts.messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content })),
        ]
      : opts.messages.map((m) => ({ role: m.role, content: m.content }));
    const resp = await this.client.chat.completions.create({
      model: opts.model,
      messages,
      max_tokens: opts.maxTokens,
      temperature: opts.temperature,
    });
    const choice = resp.choices[0];
    return {
      content: choice?.message?.content ?? "",
      inputTokens: resp.usage?.prompt_tokens ?? 0,
      outputTokens: resp.usage?.completion_tokens ?? 0,
    };
  }

  async countTokens(text: string, model: string): Promise<number> {
    const enc = this.encoding(model);
    return enc.encode(text).length;
  }

  async embed(texts: string[], model: string): Promise<number[][]> {
    if (!this.client) throw new ProviderNotReadyError("openai", "OPENAI_API_KEY not set");
    const resp = await this.client.embeddings.create({ model, input: texts });
    return resp.data.map((d) => d.embedding);
  }

  dimensions(model: string): number {
    // Best-effort defaults for OpenAI's current embedding family.
    if (model === "text-embedding-3-small") return 1536;
    if (model === "text-embedding-3-large") return 3072;
    if (model === "text-embedding-ada-002") return 1536;
    return 1536;
  }

  private encoding(model: string): Tiktoken {
    const cached = this.encodingCache.get(model);
    if (cached) return cached;
    let enc: Tiktoken;
    try {
      enc = encodingForModel(model as Parameters<typeof encodingForModel>[0]);
    } catch {
      enc = getEncoding("o200k_base");
    }
    this.encodingCache.set(model, enc);
    return enc;
  }
}
