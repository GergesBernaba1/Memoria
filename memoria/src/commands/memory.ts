import path from "node:path";
import matter from "gray-matter";
import { memoryFilePath } from "../core/paths.js";
import { requireWorkspace } from "../core/workspace.js";
import { listFiles, pathExists, readText, removeFile, writeText } from "../utils/fs.js";
import { logger } from "../utils/logger.js";

type MemoryType = "decision" | "note" | "convention" | "session";

export interface MemoryAddOptions {
  title?: string;
  tags?: string[];
  cwd?: string;
}

export interface MemoryListOptions {
  type?: MemoryType;
  json?: boolean;
  cwd?: string;
}

export interface MemoryUpdateOptions {
  text?: string;
  title?: string;
  tags?: string[];
  type?: MemoryType;
  cwd?: string;
}

interface MemoryRecord {
  id: string;
  type: MemoryType;
  title: string;
  tags: string[];
  createdAt: string;
  body: string;
  path: string;
}

export async function memoryAdd(
  type: MemoryType,
  text: string,
  opts: MemoryAddOptions = {},
): Promise<string> {
  if (!text.trim()) throw new Error("Memory text cannot be empty");
  const ws = await requireWorkspace(opts.cwd);
  const now = new Date();
  const title = opts.title ?? firstSentence(text);
  const id = `${dateId(now)}-${slugify(title)}`;
  const file = memoryFilePath(ws.paths.memoryDir, id);
  if (await pathExists(file)) throw new Error(`Memory '${id}' already exists`);

  const source = matter.stringify(`${text.trim()}\n`, {
    id,
    type,
    title,
    tags: opts.tags ?? [],
    createdAt: now.toISOString(),
  });
  await writeText(file, source);
  logger.success(`Created ${type} memory '${id}' at ${file}`);
  return file;
}

export async function memoryList(opts: MemoryListOptions = {}): Promise<void> {
  const records = await readMemories(opts.cwd);
  const filtered = opts.type ? records.filter((r) => r.type === opts.type) : records;
  if (opts.json) {
    logger.json(filtered.map(({ body: _body, ...rest }) => rest));
    return;
  }
  if (filtered.length === 0) {
    logger.info("No memories yet. Add one with `memoria memory add decision \"...\"`.");
    return;
  }
  for (const r of filtered) {
    const tags = r.tags.length ? ` [${r.tags.join(", ")}]` : "";
    logger.raw(`  ${r.id} (${r.type})${tags}\n      ${r.title}`);
  }
}

export async function memoryShow(id: string, opts: { cwd?: string } = {}): Promise<void> {
  const records = await readMemories(opts.cwd);
  const record = resolveMemory(records, id);
  logger.raw(await readText(record.path));
}

export async function memoryUpdate(id: string, opts: MemoryUpdateOptions = {}): Promise<string> {
  const records = await readMemories(opts.cwd);
  const record = resolveMemory(records, id);
  const body = opts.text === undefined ? record.body : opts.text.trim();
  if (!body) throw new Error("Memory text cannot be empty");

  const source = matter.stringify(`${body}\n`, {
    id: record.id,
    type: opts.type ?? record.type,
    title: opts.title ?? record.title,
    tags: opts.tags ?? record.tags,
    createdAt: record.createdAt,
    updatedAt: new Date().toISOString(),
  });
  await writeText(record.path, source);
  logger.success(`Updated memory '${record.id}'`);
  return record.path;
}

export async function memoryDelete(id: string, opts: { cwd?: string; yes?: boolean } = {}): Promise<void> {
  if (!opts.yes) throw new Error(`Refusing to delete '${id}' without --yes.`);
  const records = await readMemories(opts.cwd);
  const record = resolveMemory(records, id);
  await removeFile(record.path);
  logger.success(`Deleted memory '${record.id}'`);
}

export async function memorySearch(
  query: string,
  opts: MemoryListOptions & { top?: number; silent?: boolean } = {},
): Promise<MemoryRecord[]> {
  const records = await readMemories(opts.cwd);
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const scored = records
    .map((record) => ({
      record,
      score: scoreMemory(record, terms),
    }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.top ?? 10);

  const hits = scored.map((x) => x.record);
  if (opts.json) {
    logger.json(hits);
    return hits;
  }
  if (opts.silent) return hits;
  if (hits.length === 0) {
    logger.info("No matching memories.");
    return hits;
  }
  for (const hit of hits) {
    logger.raw(`  ${hit.id} (${hit.type})\n      ${hit.title}`);
  }
  return hits;
}

async function readMemories(cwd?: string): Promise<MemoryRecord[]> {
  const ws = await requireWorkspace(cwd);
  const files = await listFiles(ws.paths.memoryDir, ".md");
  const records: MemoryRecord[] = [];
  for (const file of files) {
    const raw = await readText(file);
    const parsed = matter(raw);
    const data = parsed.data as Partial<MemoryRecord>;
    records.push({
      id: data.id ?? path.basename(file, ".md"),
      type: parseType(data.type),
      title: data.title ?? path.basename(file, ".md"),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      createdAt: data.createdAt ?? "",
      body: parsed.content.trim(),
      path: file,
    });
  }
  records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return records;
}

function resolveMemory(records: MemoryRecord[], id: string): MemoryRecord {
  const matches = records.filter((r) => r.id === id || r.id.startsWith(id));
  if (matches.length === 0) throw new Error(`Memory '${id}' not found`);
  if (matches.length > 1) {
    throw new Error(`Memory id '${id}' is ambiguous: ${matches.map((m) => m.id).join(", ")}`);
  }
  return matches[0]!;
}

function parseType(value: unknown): MemoryType {
  if (value === "decision" || value === "note" || value === "convention" || value === "session") {
    return value;
  }
  return "note";
}

function scoreMemory(record: MemoryRecord, terms: string[]): number {
  const haystack = `${record.title}\n${record.type}\n${record.tags.join(" ")}\n${record.body}`.toLowerCase();
  return terms.reduce((sum, term) => sum + (haystack.includes(term) ? 1 : 0), 0);
}

function firstSentence(text: string): string {
  const first = text.trim().split(/[.\n]/)[0]?.trim();
  return first || "Untitled memory";
}

function dateId(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "-");
}

function slugify(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug || "memory";
}
