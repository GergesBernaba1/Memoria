import Anthropic from "@anthropic-ai/sdk";
import { countTokens as anthropicCountTokens } from "@anthropic-ai/tokenizer";
import {
  ProviderNotReadyError,
  type ChatOpts,
  type ChatResult,
  type LLMProvider,
} from "./types.js";

export interface AnthropicAdapterOpts {
  apiKey?: string;
}

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
    // Anthropic puts system prompts in a top-level `system` field.
    const systemMessages = opts.messages.filter((m) => m.role === "system").map((m) => m.content);
    const conversationMessages = opts.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const resp = await this.client.messages.create({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature,
      system: systemMessages.length ? systemMessages.join("\n\n") : undefined,
      messages: conversationMessages,
    });

    const text = resp.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    return {
      content: text,
      inputTokens: resp.usage.input_tokens,
      outputTokens: resp.usage.output_tokens,
    };
  }

  async countTokens(text: string, _model: string): Promise<number> {
    // The local @anthropic-ai/tokenizer is an approximation. Anthropic's own
    // server-side count is exact but requires an API call; we keep it offline
    // here since counting is hot-path for the CLI.
    return anthropicCountTokens(text);
  }
}
