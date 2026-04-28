import path from "node:path";
import matter from "gray-matter";
import { ensureDir, listFiles, pathExists, readText, writeText } from "../utils/fs.js";

export interface SummaryFrontmatter {
  /** Entity id this summary describes (e.g. `src/auth/login.ts#loginHandler`). */
  entityId: string;
  /** Source file relative path. */
  file: string;
  /** Hash of the source content; used to skip re-summarizing unchanged code. */
  contentHash: string;
  model: string;
  generatedAt: string;
}

export interface SummaryFile {
  frontmatter: SummaryFrontmatter;
  body: string;
  path?: string;
}

/** Filesystem-safe slug for a summary filename derived from an entity id. */
export function summaryIdToFilename(entityId: string): string {
  return entityId.replace(/[^a-zA-Z0-9._-]+/g, "_") + ".md";
}

export class SummaryStore {
  constructor(private readonly dir: string) {}

  private fileFor(entityId: string): string {
    return path.join(this.dir, summaryIdToFilename(entityId));
  }

  async exists(entityId: string): Promise<boolean> {
    return pathExists(this.fileFor(entityId));
  }

  async get(entityId: string): Promise<SummaryFile | null> {
    const f = this.fileFor(entityId);
    if (!(await pathExists(f))) return null;
    const raw = await readText(f);
    const parsed = matter(raw);
    return {
      frontmatter: parsed.data as SummaryFrontmatter,
      body: parsed.content.replace(/^\n+/, ""),
      path: f,
    };
  }

  async put(summary: SummaryFile): Promise<string> {
    await ensureDir(this.dir);
    const f = this.fileFor(summary.frontmatter.entityId);
    const text = matter.stringify(summary.body, summary.frontmatter as unknown as Record<string, unknown>);
    await writeText(f, text);
    return f;
  }

  async list(): Promise<SummaryFile[]> {
    const files = await listFiles(this.dir, ".md");
    const out: SummaryFile[] = [];
    for (const f of files) {
      const raw = await readText(f);
      const parsed = matter(raw);
      out.push({
        frontmatter: parsed.data as SummaryFrontmatter,
        body: parsed.content.replace(/^\n+/, ""),
        path: f,
      });
    }
    return out;
  }
}
