import { describe, it, expect, beforeEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { hashContent, summarizeFile } from "../src/summarize/code.js";
import { SummaryStore } from "../src/summarize/store.js";
import { ConfigSchema } from "../src/core/config.js";
import type { LLMProvider } from "../src/providers/types.js";

class FakeLLM implements LLMProvider {
  readonly name = "fake";
  isReady() { return true; }
  async chat() {
    return {
      content:
        "## Purpose\nDoes a thing.\n\n## Exports\n- `foo` — does foo.\n\n## Dependencies\n- node:path\n",
      inputTokens: 42,
      outputTokens: 30,
    };
  }
  async countTokens() { return 0; }
}

describe("summarizeFile", () => {
  it("returns null for files exceeding maxInputTokens", async () => {
    const config = ConfigSchema.parse({});
    config.summarize.maxInputTokens = 5;
    const r = await summarizeFile(
      { entityId: "x.ts", file: "x.ts", source: "a b c d e f g h i j k l m n o p" },
      { provider: new FakeLLM(), model: "gpt-4o", config },
    );
    expect(r).toBeNull();
  });

  it("produces a structured summary frontmatter + body", async () => {
    const config = ConfigSchema.parse({});
    const r = await summarizeFile(
      { entityId: "x.ts", file: "x.ts", source: "export const foo = 1;" },
      { provider: new FakeLLM(), model: "gpt-4o", config },
    );
    expect(r).not.toBeNull();
    expect(r!.summary.frontmatter.entityId).toBe("x.ts");
    expect(r!.summary.frontmatter.contentHash).toBe(hashContent("export const foo = 1;"));
    expect(r!.summary.body).toContain("## Purpose");
  });
});

describe("SummaryStore", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), "memoria-summary-"));
  });

  it("put + get + list", async () => {
    const store = new SummaryStore(dir);
    await store.put({
      frontmatter: {
        entityId: "src/foo.ts",
        file: "src/foo.ts",
        contentHash: "abc123",
        model: "claude-haiku-4-5",
        generatedAt: "2026-04-29T00:00:00Z",
      },
      body: "## Purpose\nx.\n",
    });
    const back = await store.get("src/foo.ts");
    expect(back).not.toBeNull();
    expect(back!.frontmatter.entityId).toBe("src/foo.ts");
    expect(back!.body).toContain("## Purpose");

    const list = await store.list();
    expect(list.length).toBe(1);
  });
});
