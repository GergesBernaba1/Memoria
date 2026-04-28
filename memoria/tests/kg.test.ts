import { describe, it, expect } from "vitest";
import { buildIndex, expand } from "../src/kg/traverse.js";
import type { Entity, Relationship } from "../src/kg/types.js";

const ENTS: Entity[] = [
  { id: "a", kind: "module", name: "a" },
  { id: "b", kind: "module", name: "b" },
  { id: "c", kind: "module", name: "c" },
  { id: "d", kind: "module", name: "d" },
];
const RELS: Relationship[] = [
  { fromId: "a", toId: "b", kind: "imports" },
  { fromId: "b", toId: "c", kind: "imports" },
  { fromId: "d", toId: "a", kind: "imports" },
];

describe("KG traversal", () => {
  it("expand 0 hops returns just the seeds", () => {
    const idx = buildIndex(ENTS, RELS);
    expect(expand(["a"], idx, 0)).toEqual(["a"]);
  });

  it("expand 1 hop includes neighbors in both directions", () => {
    const idx = buildIndex(ENTS, RELS);
    const got = expand(["a"], idx, 1).sort();
    expect(got).toEqual(["a", "b", "d"].sort());
  });

  it("expand 2 hops reaches transitive neighbors", () => {
    const idx = buildIndex(ENTS, RELS);
    const got = expand(["a"], idx, 2).sort();
    expect(got).toEqual(["a", "b", "c", "d"].sort());
  });

  it("respects maxNodes cap", () => {
    const idx = buildIndex(ENTS, RELS);
    const got = expand(["a"], idx, 5, 2);
    expect(got.length).toBe(2);
  });

  it("ignores seeds not in the index", () => {
    const idx = buildIndex(ENTS, RELS);
    expect(expand(["nonexistent"], idx, 1)).toEqual([]);
  });
});
