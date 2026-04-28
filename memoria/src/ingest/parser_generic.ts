import path from "node:path";
import type { Entity, Relationship } from "../kg/types.js";

export interface ParseResult {
  entities: Entity[];
  relationships: Relationship[];
}

/**
 * Generic fallback parser for non-TS/JS files (Python, Go, Rust, etc.).
 * Produces a single `module` entity for the file — no symbol extraction.
 * The raw source is left to the chunker/embedder for semantic indexing.
 */
export function parseGenericFile(opts: {
  abs: string;
  rel: string;
  source: string;
}): ParseResult {
  const { rel, source } = opts;
  const now = new Date().toISOString();
  const ext = path.extname(rel).toLowerCase().replace(".", "") || "text";

  const entity: Entity = {
    id: rel,
    kind: "module",
    name: path.basename(rel),
    file: rel,
    range: { startLine: 1, endLine: source.split("\n").length },
    meta: { language: ext },
    updatedAt: now,
  };

  return { entities: [entity], relationships: [] };
}

/** Extensions handled by the TS/JS AST parser. */
const TS_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

export function isTsFile(rel: string): boolean {
  return TS_EXTENSIONS.has(path.extname(rel).toLowerCase());
}
