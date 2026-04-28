/**
 * Provider abstractions. v1 only exercises `countTokens`; the rest of the
 * surface is defined so v2 (summarization, embeddings, retrieval) can plug in
 * without redesign.
 */

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatOpts {
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
}

export interface ChatResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

export interface LLMProvider {
  readonly name: string;
  /** Whether this adapter is fully usable in the current environment. */
  isReady(): boolean;
  chat(opts: ChatOpts): Promise<ChatResult>;
  countTokens(text: string, model: string): Promise<number>;
}

export interface EmbeddingProvider {
  readonly name: string;
  isReady(): boolean;
  embed(texts: string[], model: string): Promise<number[][]>;
  dimensions(model: string): number;
}

export class ProviderNotReadyError extends Error {
  constructor(provider: string, reason: string) {
    super(`Provider '${provider}' is not ready: ${reason}`);
    this.name = "ProviderNotReadyError";
  }
}
