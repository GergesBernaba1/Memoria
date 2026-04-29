/**
 * Provider abstractions.
 */

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * A cache breakpoint marks where a span of system content can be cached by the
 * provider (Anthropic prompt caching). Providers that don't support caching
 * ignore these — the option is purely advisory.
 */
export interface CacheBreakpoint {
  /** Index into the `system` content blocks where this breakpoint applies. */
  systemBlockIndex: number;
  /** Cache scope. "ephemeral" maps to Anthropic's 5-minute cache. */
  ttl?: "ephemeral" | "extended";
}

export interface ChatOpts {
  model: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  /**
   * Optional system content blocks. When provided, this REPLACES any system
   * messages in `messages` (which are passed via the role-based API for
   * back-compat). Use this when you need cache_control or multiple system
   * spans.
   */
  systemBlocks?: string[];
  /** Cache breakpoints into `systemBlocks`. Ignored by providers without caching. */
  cacheBreakpoints?: CacheBreakpoint[];
}

export interface ChatResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
  /** Tokens billed at cache-write rate (Anthropic only; 0 elsewhere). */
  cacheCreationTokens?: number;
  /** Tokens served from cache at the discounted rate (Anthropic only). */
  cacheReadTokens?: number;
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
