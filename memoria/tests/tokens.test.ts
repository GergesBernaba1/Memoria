import { describe, it, expect } from "vitest";
import { countTokens, selectTokenizer } from "../src/tokens/counter.js";
import { estimateCost } from "../src/tokens/estimator.js";
import { priceFor, BUILTIN_PRICES } from "../src/tokens/pricing.js";
import { compress } from "../src/tokens/compress.js";

describe("selectTokenizer", () => {
  it("picks claude tokenizer for claude models", () => {
    expect(selectTokenizer("claude-sonnet-4-6")).toBe("claude");
    expect(selectTokenizer("claude-opus-4-6")).toBe("claude");
  });
  it("picks openai tokenizer for gpt models", () => {
    expect(selectTokenizer("gpt-4o")).toBe("openai");
    expect(selectTokenizer("gpt-4o-mini")).toBe("openai");
  });
  it("falls back to approx for unknown ids", () => {
    expect(selectTokenizer("mistral-large")).toBe("approx");
  });
});

describe("countTokens", () => {
  it("returns positive counts for non-empty text on each tokenizer", () => {
    const text = "The quick brown fox jumps over the lazy dog.";
    const claude = countTokens(text, "claude-sonnet-4-6");
    const openai = countTokens(text, "gpt-4o");
    const approx = countTokens(text, "mistral-large");
    expect(claude.tokens).toBeGreaterThan(0);
    expect(openai.tokens).toBeGreaterThan(0);
    expect(approx.tokens).toBeGreaterThan(0);
    expect(claude.tokenizer).toBe("claude");
    expect(openai.tokenizer).toBe("openai");
    expect(approx.tokenizer).toBe("approx");
  });

  it("returns 0 for empty input", () => {
    expect(countTokens("", "gpt-4o").tokens).toBe(0);
  });

  it("scales with input length", () => {
    const small = countTokens("hello", "gpt-4o").tokens;
    const big = countTokens("hello ".repeat(100), "gpt-4o").tokens;
    expect(big).toBeGreaterThan(small);
  });
});

describe("priceFor / estimateCost", () => {
  it("resolves built-in prices", () => {
    const p = priceFor("claude-sonnet-4-6");
    expect(p).not.toBeNull();
    expect(p!.inputPerMillion).toBe(3);
    expect(p!.outputPerMillion).toBe(15);
  });

  it("returns null for unknown models", () => {
    expect(priceFor("totally-made-up-model-9000")).toBeNull();
  });

  it("computes cost = (input/1M)*inPrice + (output/1M)*outPrice", () => {
    const text = "x".repeat(4000); // ~1k tokens by approx; not relied upon
    const { count, estimate } = estimateCost(text, "gpt-4o", 500);
    const expectedInput = (count.tokens / 1_000_000) * BUILTIN_PRICES["gpt-4o"]!.inputPerMillion;
    const expectedOutput = (500 / 1_000_000) * BUILTIN_PRICES["gpt-4o"]!.outputPerMillion;
    expect(estimate.inputCostUsd).toBeCloseTo(expectedInput, 6);
    expect(estimate.outputCostUsd).toBeCloseTo(expectedOutput, 6);
    expect(estimate.totalCostUsd).toBeCloseTo(expectedInput + expectedOutput, 6);
    expect(estimate.unpriced).toBe(false);
  });

  it("flags unknown models as unpriced", () => {
    const { estimate } = estimateCost("hello", "no-such-model", 100);
    expect(estimate.unpriced).toBe(true);
    expect(estimate.totalCostUsd).toBe(0);
  });
});

describe("compress", () => {
  it("collapses repeated whitespace and dedups consecutive lines", () => {
    const input = "hello   world\n\n\n\nhello   world\nhello   world\nbye\n";
    const out = compress(input);
    expect(out.text).toContain("hello world");
    expect(out.text.split("hello world").length).toBeLessThan(input.split("hello   world").length);
    expect(out.savedChars).toBeGreaterThan(0);
  });

  it("preserves line indentation", () => {
    const input = "    function   foo() {\n      return    1;\n    }\n";
    const out = compress(input);
    // leading spaces preserved
    expect(out.text.startsWith("    function foo()")).toBe(true);
  });
});
