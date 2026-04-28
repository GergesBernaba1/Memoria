import { describe, it, expect } from "vitest";
import { kmeans } from "../src/cluster/kmeans.js";

function normalize(v: number[]): number[] {
  const m = Math.sqrt(v.reduce((a, x) => a + x * x, 0));
  return v.map((x) => x / m);
}

describe("kmeans", () => {
  it("separates two well-separated clusters", () => {
    const left = Array.from({ length: 20 }, () => normalize([1 + Math.random() * 0.05, 0.05, 0]));
    const right = Array.from({ length: 20 }, () => normalize([0.05, 1 + Math.random() * 0.05, 0]));
    const result = kmeans([...left, ...right], { k: 2, maxIterations: 30, seed: 42 });
    expect(result.k).toBe(2);
    // The first 20 should agree on a label and so should the last 20.
    const leftLabel = result.assignments[0]!;
    const rightLabel = result.assignments[20]!;
    expect(leftLabel).not.toBe(rightLabel);
    expect(result.assignments.slice(0, 20).every((l) => l === leftLabel)).toBe(true);
    expect(result.assignments.slice(20).every((l) => l === rightLabel)).toBe(true);
  });

  it("auto picks k = ~sqrt(n/2)", () => {
    const vecs = Array.from({ length: 18 }, () => normalize([Math.random(), Math.random(), Math.random()]));
    const result = kmeans(vecs, { k: "auto", seed: 1 });
    expect(result.k).toBe(3); // sqrt(9) = 3
  });

  it("returns empty for empty input", () => {
    const result = kmeans([], { k: 3 });
    expect(result.k).toBe(0);
    expect(result.assignments).toEqual([]);
  });
});
