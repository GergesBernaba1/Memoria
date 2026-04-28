import path from "node:path";
import { MEMORIA_DIR, memoriaPathsFor, type MemoriaPaths } from "./paths.js";
import { isDirectory } from "../utils/fs.js";

export interface Workspace {
  projectRoot: string;
  paths: MemoriaPaths;
}

/**
 * Walk upward from `start` looking for a directory that contains `.memoria/`.
 * Returns null if none is found before the filesystem root.
 */
export async function findWorkspace(start: string = process.cwd()): Promise<Workspace | null> {
  let current = path.resolve(start);
  // Walk up to filesystem root.
  while (true) {
    const candidate = path.join(current, MEMORIA_DIR);
    if (await isDirectory(candidate)) {
      return { projectRoot: current, paths: memoriaPathsFor(current) };
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

/** Find a workspace or throw a descriptive error. */
export async function requireWorkspace(start?: string): Promise<Workspace> {
  const ws = await findWorkspace(start);
  if (!ws) {
    throw new Error(
      `No .memoria/ directory found in the current directory or any parent. ` +
        `Run \`memoria init\` first.`,
    );
  }
  return ws;
}
