import Anthropic from "@anthropic-ai/sdk";
import { countTokens as anthropicCountTokens } from "@anthropic-ai/tokenizer";
import {
  ProviderNotReadyError,
  type CacheBreakpoint,
  type ChatOpts,
  type ChatResult,
  type LLMProvider,
} from "./types.js";

export interface AnthropicAdapterOpts {
  apiKey?: string;
}

/**
 * Anthropic chat adapter. Supports prompt caching via `systemBlocks` +
 * `cacheBreakpoints` on `ChatOpts` — see Anthropic docs on `cache_control`.
 *
 * Caching cuts repeated input cost dramatically (~90% off cache-read tokens)
 * for stable system prompts like a recalled context bundle.
 */
export class AnthropicAdapter implements LLMProvider {
  readonly name = "anthropic";
  private client: Anthropic | null;

  constructor(opts: AnthropicAdapterOpts = {}) {
    const key = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
    this.client = key ? new Anthropic({ apiKey: key }) : null;
  }

  isReady(): boolean {
    return this.client !== null;
  }

  async chat(opts: ChatOpts): Promise<ChatResult> {
    if (!this.client) {
      throw new ProviderNotReadyError("anthropic", "ANTHROPIC_API_KEY not set");
    }

    const systemParam = buildSystemParam(opts);
    const conversationMessages = opts.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const resp = await this.client.messages.create({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature,
      system: systemParam,
      messages: conversationMessages,
    });

    const text = resp.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    // The SDK exposes cache stats on the usage object when caching is in use.
    const usage = resp.usage as Anthropic.Usage & {
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };

    return {
      content: text,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      cacheCreationTokens: usage.cache_creation_input_tokens ?? 0,
      cacheReadTokens: usage.cache_read_input_tokens ?? 0,
    };
  }

  async countTokens(text: string, _model: string): Promise<number> {
    return anthropicCountTokens(text);
  }
}

/**
 * Build the SDK's `system` field. If `systemBlocks` is provided, return an
 * array of TextBlockParam (with cache_control where requested). Otherwise
 * fall back to joining `role: "system"` messages into a single string for
 * back-compat.
 *
 * Exposed as a non-class export so tests can verify the shape without a real
 * Anthropic client.
 */
export function buildSystemParam(
  opts: ChatOpts,
): string | Anthropic.TextBlockParam[] | undefined {
  if (opts.systemBlocks && opts.systemBlocks.length > 0) {
    const breakpointSet = breakpointIndexSet(opts.cacheBreakpoints);
    return opts.systemBlocks.map((text, i): Anthropic.TextBlockParam => {
      const block: Anthropic.TextBlockParam & { cache_control?: { type: "ephemeral" } } = { type: "text", text };
      if (breakpointSet.has(i)) {
        block.cache_control = { type: "ephemeral" };
      }
      return block;
    });
  }
  const inline = opts.messages.filter((m) => m.role === "system").map((m) => m.content);
  if (inline.length === 0) return undefined;
  return inline.join("\n\n");
}

function breakpointIndexSet(bps: CacheBreakpoint[] | undefined): Set<number> {
  const set = new Set<number>();
  if (!bps) return set;
  for (const bp of bps) set.add(bp.systemBlockIndex);
  return set;
}
