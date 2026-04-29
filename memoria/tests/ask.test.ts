import { describe, expect, it, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { runAsk } from "../src/commands/ask.js";
import { runInit } from "../src/commands/init.js";
import { memoriaPathsFor } from "../src/core/paths.js";
import { loadConfig, saveConfig } from "../src/core/config.js";
import { EmbeddingStore } from "../src/embeddings/store.js";
import type { ChatOpts, ChatResult, EmbeddingProvider, LLMProvider } from "../src/providers/types.js";
import type { ProviderRegistry } from "../src/providers/registry.js";

vi.mock("../src/embeddings/provider.js", () => {
  const fake = {
    name: "fake-embed",
    isReady: () => true,
    async embed(texts: string[]) {
      return texts.map((text) => fakeVec(text));
    },
    dimensions: () => 2,
  };
  return {
    resolveEmbedder: () => ({ provider: fake, model: "fake-embed", dimensions: 2 }),
  };
});

class FakeLLM implements LLMProvider {
  readonly name = "fake-llm";
  lastOpts: ChatOpts | null = null;

  constructor(private readonly answer: string) {}

  isReady(): boolean {
    return true;
  }

  async chat(opts: ChatOpts): Promise<ChatResult> {
    this.lastOpts = opts;
    return {
      content: this.answer,
      inputTokens: 123,
      outputTokens: 45,
      cacheCreationTokens: 100,
      cacheReadTokens: 23,
    };
  }

  async countTokens(text: string): Promise<number> {
    return text.split(/\s+/).filter(Boolean).length;
  }
}

describe("runAsk", () => {
  it("answers with recalled context and reports cache stats", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "memoria-ask-"));
    await runInit({ cwd: dir });
    const paths = memoriaPathsFor(dir);
    const config = await loadConfig(paths.configFile);
    config.ask.model = "claude-test";
    config.recall.topK = 2;
    await saveConfig(paths.configFile, config);

    const codeStore = new EmbeddingStore(paths.embeddingsCodeFile);
    await codeStore.write([
      {
        id: "src/auth.ts:0",
        sourceId: "src/auth.ts",
        source: "code",
        vector: fakeVec("auth login password"),
        text: "export function login() { return 'token'; }",
        meta: { file: "src/auth.ts" },
      },
    ]);

    const llm = new FakeLLM("Use the login helper.");
    const registry: ProviderRegistry = {
      llm: new Map([["anthropic", llm]]),
      embedding: new Map<string, EmbeddingProvider>(),
    };

    const result = await runAsk("How does login work?", {
      cwd: dir,
      registry,
      json: true,
      budgetTokens: 1000,
    });

    expect(result.answer).toBe("Use the login helper.");
    expect(result.usage.cacheCreationTokens).toBe(100);
    expect(result.usage.cacheReadTokens).toBe(23);
    expect(result.recall.sections.some((section) => section.title.startsWith("Code: src/auth.ts"))).toBe(true);
    expect(llm.lastOpts?.systemBlocks?.[1]).toContain("export function login");
    expect(llm.lastOpts?.cacheBreakpoints).toEqual([{ systemBlockIndex: 1, ttl: "ephemeral" }]);
  });
});

function fakeVec(text: string): number[] {
  const lower = text.toLowerCase();
  return [lower.includes("auth") || lower.includes("login") ? 1 : 0, lower.includes("other") ? 1 : 0];
}
