/**
 * Knowledge Graph types. The KG is stored as plain JSON in
 * .memoria/knowledge_graph/ — entities and relationships in flat lists,
 * summaries in their own per-entity files, clusters as a single map.
 */

export type EntityKind =
  | "module"
  | "function"
  | "class"
  | "interface"
  | "type"
  | "variable"
  | "skill"
  | "decision";

export interface Entity {
  /** Stable id, e.g. `src/auth/login.ts#loginHandler` or `skill:authenticate-user`. */
  id: string;
  kind: EntityKind;
  /** Human-readable name (often the symbol name). */
  name: string;
  /** Source file relative to project root, with forward slashes. */
  file?: string;
  /** 1-based line range in the source file. */
  range?: { startLine: number; endLine: number };
  /** Free-form metadata (e.g. exported flag, signature, jsdoc). */
  meta?: Record<string, unknown>;
  /** ISO-8601 timestamp of last update. */
  updatedAt?: string;
}

export type RelationKind =
  | "imports"
  | "exports"
  | "extends"
  | "implements"
  | "calls"
  | "references"
  | "summarizes"
  | "tagged_with"
  | "related_to";

export interface Relationship {
  fromId: string;
  toId: string;
  kind: RelationKind;
  meta?: Record<string, unknown>;
}

/**
 * Cluster map: cluster id -> array of entity ids. Centroid is stored alongside
 * so search can warm-start without re-running k-means.
 */
export interface Clusters {
  model: string;
  dimensions: number;
  k: number;
  generatedAt: string;
  clusters: Array<{
    id: number;
    centroid: number[];
    entityIds: string[];
    label?: string;
  }>;
}
