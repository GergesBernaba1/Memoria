import { describe, it, expect } from "vitest";
import { parseTsFile } from "../src/ingest/parser_ts.js";

describe("parseTsFile", () => {
  it("captures module + exports + imports", () => {
    const source = `
import path from "node:path";
import { foo } from "./util";

export function greet(name: string): string {
  return path.join(name, "world");
}

export const PI = 3.14;
`;
    const r = parseTsFile({ abs: "/tmp/x/sample.ts", rel: "src/sample.ts", source });
    const ids = r.entities.map((e) => e.id).sort();
    expect(ids).toContain("src/sample.ts");
    expect(ids).toContain("src/sample.ts#greet");
    expect(ids).toContain("src/sample.ts#PI");

    // imports → relationships
    const imports = r.relationships.filter((rel) => rel.kind === "imports");
    expect(imports.map((i) => i.toId).sort()).toEqual(["pkg:node:path", "src/util"]);

    // exports → relationships
    const exportsRels = r.relationships.filter((rel) => rel.kind === "exports");
    const exportedTargets = exportsRels.map((rel) => rel.toId).sort();
    expect(exportedTargets).toEqual(["src/sample.ts#PI", "src/sample.ts#greet"]);
  });

  it("captures classes with extends + implements", () => {
    const source = `
export interface Animal { name: string }
export class Dog extends Pet implements Animal {
  bark() { return "woof"; }
}
`;
    const r = parseTsFile({ abs: "/x.ts", rel: "x.ts", source });
    const heritage = r.relationships.filter(
      (rel) => rel.kind === "extends" || rel.kind === "implements",
    );
    const pairs = heritage.map((h) => `${h.fromId}-${h.kind}->${h.toId}`).sort();
    expect(pairs).toEqual(["x.ts#Dog-extends->x.ts#Pet", "x.ts#Dog-implements->x.ts#Animal"]);
  });

  it("does not crash on syntax errors", () => {
    const source = "function broken( {";
    expect(() => parseTsFile({ abs: "/b.ts", rel: "b.ts", source })).not.toThrow();
  });
});
