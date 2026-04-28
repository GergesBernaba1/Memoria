import { describe, it, expect } from "vitest";
import { defaultConfig, getKey, setKey } from "../src/core/config.js";

describe("config dotted-key helpers", () => {
  it("getKey reads a nested value", () => {
    const cfg = defaultConfig("p");
    expect(getKey(cfg, "projectName")).toBe("p");
    expect(getKey(cfg, "providers.openai.embeddingModel")).toBe("text-embedding-3-small");
    expect(getKey(cfg, "does.not.exist")).toBeUndefined();
  });

  it("setKey JSON-parses primitives", () => {
    const cfg = defaultConfig("p");
    const a = setKey(cfg, "defaultModel", '"claude-haiku-4-5"');
    expect(a.defaultModel).toBe("claude-haiku-4-5");
  });

  it("setKey accepts strings without quotes via fallback", () => {
    const cfg = defaultConfig("p");
    const a = setKey(cfg, "defaultModel", "claude-haiku-4-5");
    expect(a.defaultModel).toBe("claude-haiku-4-5");
  });

  it("setKey can write a nested pricing override", () => {
    const cfg = defaultConfig("p");
    const a = setKey(
      cfg,
      "pricing.my-model",
      '{"inputPerMillion": 2, "outputPerMillion": 10}',
    );
    expect(a.pricing["my-model"]).toEqual({ inputPerMillion: 2, outputPerMillion: 10 });
  });

  it("setKey re-validates and rejects bad shapes", () => {
    const cfg = defaultConfig("p");
    expect(() => setKey(cfg, "pricing.bad", '{"inputPerMillion": -1}')).toThrow();
  });
});
