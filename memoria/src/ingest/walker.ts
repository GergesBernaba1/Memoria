import { promises as fs } from "node:fs";
import path from "node:path";
import picomatch from "picomatch";

export interface WalkOptions {
  /** Glob patterns (relative to root) to include. */
  include: string[];
  /** Glob patterns (relative to root) to exclude. */
  exclude: string[];
}

export interface WalkedFile {
  /** Absolute filesystem path. */
  abs: string;
  /** Path relative to the walk root, using forward slashes. */
  rel: string;
}

/**
 * Walk `root` recursively and yield files matching `include` and not
 * `exclude`. Globs are matched against the relative path with forward slashes
 * so authoring patterns is consistent across platforms.
 */
export async function* walk(root: string, opts: WalkOptions): AsyncIterable<WalkedFile> {
  const isMatch = picomatch(opts.include, { dot: false });
  const isExcluded = picomatch(opts.exclude, { dot: true });

  async function* visit(absDir: string, relDir: string): AsyncIterable<WalkedFile> {
    let entries: import("node:fs").Dirent[];
    try {
      entries = await fs.readdir(absDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const abs = path.join(absDir, entry.name);
      const rel = relDir ? `${relDir}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        // Pruning the walk on excluded directories massively speeds up node_modules-heavy repos.
        if (isExcluded(rel) || isExcluded(`${rel}/`)) continue;
        yield* visit(abs, rel);
      } else if (entry.isFile()) {
        if (isExcluded(rel)) continue;
        if (isMatch(rel)) yield { abs, rel };
      }
    }
  }

  yield* visit(path.resolve(root), "");
}

/** Convenience: collect a walk into an array. */
export async function listSourceFiles(root: string, opts: WalkOptions): Promise<WalkedFile[]> {
  const out: WalkedFile[] = [];
  for await (const f of walk(root, opts)) out.push(f);
  out.sort((a, b) => a.rel.localeCompare(b.rel));
  return out;
}
