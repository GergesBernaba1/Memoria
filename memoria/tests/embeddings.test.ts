import { describe, it, expect, beforeEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import {
  EmbeddingStore,
  type EmbeddingRecord,
} from "../src/embeddings/store.js";
import { cosineSimilarity, topK } from "../src/embeddings/search.js";
import { chunkText } from "../src/embeddings/chunker.js";

async function tmpFile(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "memoria-embed-"));
  return path.join(dir, "store.jsonl");
}

const VECS: EmbeddingRecord[] = [
  { id: "a:0", sourceId: "src/a.ts", source: "code", vector: [1, 0, 0], text: "alpha" },
  { id: "b:0", sourceId: "src/b.ts", source: "code", vector: [0, 1, 0], text: "beta" },
  { id: "c:0", sourceId: "src/c.ts", source: "code", vector: [0.7, 0.7, 0], text: "gamma" },
];

describe("cosineSimilarity / topK", () => {
  it("computes 1.0 for identical vectors and 0 for orthogonal", () => {
    expect(cosineSimilarity([1, 0, 0], [1, 0, 0])).toBeCloseTo(1, 6);
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0, 6);
  });

  it("ranks similar vectors higher", () => {
    const hits = topK([1, 0, 0], VECS, 3);
    expect(hits.map((h) => h.record.id)).toEqual(["a:0", "c:0", "b:0"]);
    expect(hits[0]!.score).toBeGreaterThan(hits[1]!.score);
  });

  it("respects k", () => {
    const hits = topK([1, 0, 0], VECS, 1);
    expect(hits.length).toBe(1);
    expect(hits[0]!.record.id).toBe("a:0");
  });

  it("rejects mismatched dimensions", () => {
    expect(() => cosineSimilarity([1, 0], [1, 0, 0])).toThrow();
  });
});

describe("EmbeddingStore JSONL roundtrip", () => {
  let file: string;
  beforeEach(async () => {
    file = await tmpFile();
  });

  it("write + readAll roundtrips", async () => {
    const store = new EmbeddingStore(file);
    await store.write(VECS);
    const back = await store.readAll();
    expect(back).toEqual(VECS);
  });

  it("append accumulates", async () => {
    const store = new EmbeddingStore(file);
    await store.append([VECS[0]!]);
    await store.append([VECS[1]!]);
    const back = await store.readAll();
    expect(back.map((r) => r.id)).toEqual(["a:0", "b:0"]);
  });

  it("dropByFiles removes records by sourceId prefix", async () => {
    const store = new EmbeddingStore(file);
    await store.write([
      { ...VECS[0]!, sourceId: "src/a.ts", id: "src/a.ts#x:0", meta: { file: "src/a.ts" } },
      { ...VECS[1]!, sourceId: "src/b.ts", id: "src/b.ts#y:0", meta: { file: "src/b.ts" } },
    ]);
    await store.dropByFiles(new Set(["src/a.ts"]));
    const back = await store.readAll();
    expect(back.map((r) => r.id)).toEqual(["src/b.ts#y:0"]);
  });
});

describe("chunkText", () => {
  it("returns 1 chunk for tiny input", () => {
    const chunks = chunkText("hello world", { chunkTokens: 100, overlapTokens: 0, model: "gpt-4o" });
    expect(chunks.length).toBe(1);
    expect(chunks[0]!.text).toBe("hello world");
  });

  it("splits when a single chunk exceeds the budget", () => {
    const text = Array.from({ length: 50 }, (_, i) => `line ${i}`).join("\n");
    const chunks = chunkText(text, { chunkTokens: 30, overlapTokens: 5, model: "gpt-4o" });
    expect(chunks.length).toBeGreaterThan(1);
    // Each chunk is non-empty.
    for (const c of chunks) expect(c.text.length).toBeGreaterThan(0);
    // Overall coverage: every line appears at least once across chunks.
    const all = chunks.map((c) => c.text).join("\n");
    expect(all).toContain("line 0");
    expect(all).toContain("line 49");
  });
});
