import { promises as fs } from "node:fs";
import path from "node:path";

export async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

export async function isDirectory(p: string): Promise<boolean> {
  try {
    const stat = await fs.stat(p);
    return stat.isDirectory();
  } catch {
    return false;
  }
}

export async function ensureDir(p: string): Promise<void> {
  await fs.mkdir(p, { recursive: true });
}

export async function readJson<T = unknown>(p: string): Promise<T> {
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw) as T;
}

export async function writeJson(p: string, data: unknown): Promise<void> {
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, JSON.stringify(data, null, 2) + "\n", "utf8");
}

export async function writeText(p: string, content: string): Promise<void> {
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, content, "utf8");
}

export async function readText(p: string): Promise<string> {
  return fs.readFile(p, "utf8");
}

export async function listFiles(dir: string, ext?: string): Promise<string[]> {
  if (!(await isDirectory(dir))) return [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && (ext ? e.name.endsWith(ext) : true))
    .map((e) => path.join(dir, e.name));
}

export async function removeFile(p: string): Promise<void> {
  await fs.unlink(p);
}
