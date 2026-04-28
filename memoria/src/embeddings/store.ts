import { promises as fs } from "node:fs";
import readline from "node:readline";
import { createReadStream, createWriteStream } from "node:fs";
import { ensureDir, pathExists } from "../utils/fs.js";
import path from "node:path";

/** A single embedded chunk persisted to JSONL. */
export interface EmbeddingRecord {
  /** Stable identifier — typically `${entityId}:${chunkIndex}` or `skill:${name}`. */
  id: string;
  /** Origin entity id (a node in the KG). */
  sourceId: string;
  /** What this chunk covers — `code`, `summary`, `skill`, etc. */
  source: "code" | "summary" | "skill" | "brief" | "memory";
  /** The unit-length embedding vector. */
  vector: number[];
  /** The text that was embedded — kept for explainability + recall snippets. */
  text: string;
  /** Token count of the chunk under whatever tokenizer was used. */
  tokens?: number;
  /** Free-form metadata (file, line range, model, etc.). */
  meta?: Record<string, unknown>;
}

export interface EmbeddingIndexMetadata {
  model: string | null;
  dimensions: number | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export class EmbeddingStore {
  constructor(private readonly file: string) {}

  /** Append records (does not deduplicate). For full rewrites use `write`. */
  async append(records: EmbeddingRecord[]): Promise<void> {
    if (records.length === 0) return;
    await ensureDir(path.dirname(this.file));
    const out = createWriteStream(this.file, { flags: "a" });
    for (const r of records) out.write(JSON.stringify(r) + "\n");
    await new Promise<void>((resolve, reject) => {
      out.end((err?: Error | null) => (err ? reject(err) : resolve()));
    });
  }

  /** Replace the entire file with `records`. */
  async write(records: EmbeddingRecord[]): Promise<void> {
    await ensureDir(path.dirname(this.file));
    const out = createWriteStream(this.file, { flags: "w" });
    for (const r of records) out.write(JSON.stringify(r) + "\n");
    await new Promise<void>((resolve, reject) => {
      out.end((err?: Error | null) => (err ? reject(err) : resolve()));
    });
  }

  /** Stream records lazily — preferable for large stores. */
  async *iterate(): AsyncIterable<EmbeddingRecord> {
    if (!(await pathExists(this.file))) return;
    const stream = createReadStream(this.file, { encoding: "utf8" });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    for await (const line of rl) {
      if (!line.trim()) continue;
      yield JSON.parse(line) as EmbeddingRecord;
    }
  }

  async readAll(): Promise<EmbeddingRecord[]> {
    const out: EmbeddingRecord[] = [];
    for await (const r of this.iterate()) out.push(r);
    return out;
  }

  /** Delete records whose `meta.file` (or sourceId starting with `<file>#`) matches the given files. */
  async dropByFiles(files: Set<string>): Promise<void> {
    if (!(await pathExists(this.file))) return;
    const all = await this.readAll();
    const kept = all.filter((r) => {
      const f = (r.meta as { file?: string } | undefined)?.file;
      if (f && files.has(f)) return false;
      // Heuristic for parser-generated ids like `src/foo.ts#bar:0`
      const hashIdx = r.sourceId.indexOf("#");
      if (hashIdx > 0) {
        const fileFromId = r.sourceId.slice(0, hashIdx);
        if (files.has(fileFromId)) return false;
      }
      return true;
    });
    await this.write(kept);
  }

  async exists(): Promise<boolean> {
    return pathExists(this.file);
  }
}

export async function readIndexMetadata(file: string): Promise<EmbeddingIndexMetadata | null> {
  if (!(await pathExists(file))) return null;
  const raw = await fs.readFile(file, "utf8");
  return JSON.parse(raw) as EmbeddingIndexMetadata;
}

export async function writeIndexMetadata(
  file: string,
  meta: EmbeddingIndexMetadata,
): Promise<void> {
  await ensureDir(path.dirname(file));
  await fs.writeFile(file, JSON.stringify(meta, null, 2) + "\n", "utf8");
}
