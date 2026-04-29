import { describe, expect, it } from "vitest";
import { parseOrder, rerankWithLLM } from "../src/embeddings/rerank.js";
import type { ScoredRecord } from "../src/embeddings/search.js";
import type { ChatOpts, ChatResult, LLMProvider } from "../src/providers/types.js";

class FakeReranker implements LLMProvider {
  readonly name = "fake";

  constructor(private readonly response: string) {}

  isReady(): boolean {
    return true;
  }

  async chat(_opts: ChatOpts): Promise<ChatResult> {
    return {
      content: this.response,
      inputTokens: 10,
      outputTokens: 2,
    };
  }

  async countTokens(text: string): Promise<number> {
    return text.split(/\s+/).filter(Boolean).length;
  }
}

const hits: ScoredRecord[] = [
  hit("a", "first result"),
  hit("b", "second result"),
  hit("c", "third result"),
  hit("d", "tail result"),
];

describe("LLM reranker", () => {
  it("parses loose index output", () => {
    expect(parseOrder("2, 0\nignored 9 -1 1", 3)).toEqual([2, 0, 1]);
  });

  it("reorders top candidates and keeps unmentioned candidates", async () => {
    const reranked = await rerankWithLLM(hits, {
      query: "important",
      provider: new FakeReranker("2,0"),
      model: "fake-rerank",
      topNToRerank: 3,
    });

    expect(reranked.map((item) => item.record.id)).toEqual(["c", "a", "b", "d"]);
  });

  it("keeps original order when reranker output cannot be parsed", async () => {
    const reranked = await rerankWithLLM(hits, {
      query: "important",
      provider: new FakeReranker("no indices here"),
      model: "fake-rerank",
    });

    expect(reranked.map((item) => item.record.id)).toEqual(["a", "b", "c", "d"]);
  });
});

function hit(id: string, text: string): ScoredRecord {
  return {
    record: {
      id,
      sourceId: id,
      source: "code",
      vector: [1, 0],
      text,
    },
    score: 1,
  };
}
