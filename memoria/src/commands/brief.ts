import path from "node:path";
import { briefFilePath } from "../core/paths.js";
import { requireWorkspace } from "../core/workspace.js";
import { listFiles, pathExists, readText, writeText } from "../utils/fs.js";
import { logger } from "../utils/logger.js";

export interface BriefOptions {
  description?: string;
  json?: boolean;
  cwd?: string;
}

export async function briefCreate(name: string, opts: BriefOptions = {}): Promise<string> {
  const ws = await requireWorkspace(opts.cwd);
  const slug = slugify(name);
  const file = briefFilePath(ws.paths.briefsDir, slug);
  if (await pathExists(file)) throw new Error(`Brief '${slug}' already exists`);

  const title = titleFromName(name);
  const body = `# ${title}

## Intent

${opts.description ?? "Describe the smallest useful outcome."}

## Recall

- Budget: 4000 tokens
- Command: \`memoria recall "${title}" --budget 4000\`
- Measure: \`memoria savings "${title}" --baseline all-indexed --save\`

## Memory Links

- Decisions:
- Conventions:
- Skills:
- Files:

## Path

- First useful change:
- Test signal:
- Durable memory to save:

## Checklist

- [ ] Recall relevant context.
- [ ] Implement the first useful change.
- [ ] Run tests.
- [ ] Measure token savings.
- [ ] Save durable memory only if something should be reused.
`;

  await writeText(file, body);
  logger.success(`Created compact brief '${slug}' at ${file}`);
  return file;
}

export async function briefPath(name: string, opts: BriefOptions = {}): Promise<string> {
  const ws = await requireWorkspace(opts.cwd);
  const file = await requireBriefFile(ws.paths.briefsDir, name);
  const current = await readText(file);
  const next = replaceSection(
    current,
    "Path",
    [
      "- Recall first; do not paste broad code context.",
      "- Change only the files needed for the first useful outcome.",
      "- Test the behavior changed by this brief.",
      "- Save only durable decisions or conventions as memory.",
    ].join("\n"),
  );
  await writeText(file, next);
  logger.success(`Updated path section in ${file}`);
  return file;
}

export async function briefChecklist(name: string, opts: BriefOptions = {}): Promise<string> {
  const ws = await requireWorkspace(opts.cwd);
  const file = await requireBriefFile(ws.paths.briefsDir, name);
  const current = await readText(file);
  const next = replaceSection(
    current,
    "Checklist",
    [
      "- [ ] Recall relevant context.",
      "- [ ] Implement the first useful change.",
      "- [ ] Run tests.",
      "- [ ] Measure token savings.",
      "- [ ] Save durable memory only if something should be reused.",
    ].join("\n"),
  );
  await writeText(file, next);
  logger.success(`Updated checklist section in ${file}`);
  return file;
}

export async function briefList(opts: BriefOptions = {}): Promise<void> {
  const ws = await requireWorkspace(opts.cwd);
  const briefs = (await listFiles(ws.paths.briefsDir, ".md"))
    .map((f) => path.basename(f, ".md"))
    .sort();

  if (opts.json) {
    logger.json(briefs);
    return;
  }
  if (briefs.length === 0) {
    logger.info("No briefs yet. Create one with `memoria brief create <name>`.");
    return;
  }
  for (const brief of briefs) logger.raw(`  ${brief}`);
}

export async function briefShow(name: string, opts: BriefOptions & { section?: string } = {}): Promise<void> {
  const ws = await requireWorkspace(opts.cwd);
  const file = await requireBriefFile(ws.paths.briefsDir, name);
  const text = await readText(file);
  const section = opts.section ?? "all";
  if (section === "all") {
    logger.raw(text);
    return;
  }
  const title = titleFromName(section);
  logger.raw(extractSection(text, title) ?? "");
}

async function requireBriefFile(briefsDir: string, name: string): Promise<string> {
  const slug = slugify(name);
  const file = briefFilePath(briefsDir, slug);
  if (!(await pathExists(file))) throw new Error(`Brief '${slug}' not found`);
  return file;
}

function replaceSection(source: string, title: string, body: string): string {
  const section = `## ${title}\n\n${body.trim()}\n`;
  const pattern = new RegExp(`((?:^|\\n)## ${escapeRegExp(title)}\\s*\\n)[\\s\\S]*?(?=\\n## |$)`);
  if (!pattern.test(source)) return `${source.trim()}\n\n${section}`;
  return source.replace(pattern, (match) => (match.startsWith("\n") ? `\n${section}` : section));
}

function extractSection(source: string, title: string): string | null {
  const pattern = new RegExp(`(?:^|\\n)(## ${escapeRegExp(title)}\\s*\\n[\\s\\S]*?)(?=\\n## |$)`);
  return source.match(pattern)?.[1]?.trim() ?? null;
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slugify(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!slug) throw new Error("Brief name must contain at least one letter or number");
  return slug;
}

function titleFromName(input: string): string {
  return input
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
