import path from "node:path";
import { loadConfig } from "../core/config.js";
import { findWorkspace } from "../core/workspace.js";
import { listFiles, pathExists } from "../utils/fs.js";
import { logger } from "../utils/logger.js";

interface DoctorCheck {
  name: string;
  ok: boolean;
  detail: string;
}

export interface DoctorReport {
  ok: boolean;
  projectRoot?: string;
  checks: DoctorCheck[];
}

export async function runDoctor(opts: { json?: boolean; cwd?: string } = {}): Promise<DoctorReport> {
  const ws = await findWorkspace(opts.cwd);
  const checks: DoctorCheck[] = [];

  if (!ws) {
    const report = {
      ok: false,
      checks: [
        {
          name: "workspace",
          ok: false,
          detail: "No .memoria/ directory found. Run `memoria init` first.",
        },
      ],
    };
    output(report, opts.json);
    return report;
  }

  checks.push({ name: "workspace", ok: true, detail: ws.paths.root });

  let configOk = false;
  try {
    const config = await loadConfig(ws.paths.configFile);
    configOk = true;
    checks.push({ name: "config", ok: true, detail: `${ws.paths.configFile} (${config.projectName})` });
  } catch (err) {
    checks.push({ name: "config", ok: false, detail: err instanceof Error ? err.message : String(err) });
  }

  checks.push(await existsCheck("briefs directory", ws.paths.briefsDir));
  checks.push(await existsCheck("memory directory", ws.paths.memoryDir));
  checks.push(await existsCheck("reports directory", ws.paths.reportsDir));
  checks.push(await existsCheck("knowledge graph directory", ws.paths.kgDir));
  checks.push(await existsCheck("embeddings directory", ws.paths.embeddingsDir));

  const contextEmbeddings = await pathExists(ws.paths.embeddingsContextFile);
  checks.push({
    name: "context embeddings",
    ok: contextEmbeddings,
    detail: contextEmbeddings ? ws.paths.embeddingsContextFile : "Missing embeddings. Run `memoria ingest`.",
  });

  const entities = await pathExists(ws.paths.kgEntitiesFile);
  const relationships = await pathExists(ws.paths.kgRelationshipsFile);
  checks.push({
    name: "knowledge graph files",
    ok: entities && relationships,
    detail: entities && relationships ? ws.paths.kgDir : "Missing graph files. Run `memoria ingest`.",
  });

  const agents = await agentFiles(ws.projectRoot);
  checks.push({
    name: "agent instructions",
    ok: agents.present.length > 0,
    detail: agents.present.length
      ? `${agents.present.length} installed (${agents.present.join(", ")})`
      : "No agent instruction files found. Run `memoria agent install all`.",
  });

  const briefs = await listFiles(ws.paths.briefsDir, ".md");
  const memories = await listFiles(ws.paths.memoryDir, ".md");
  const savings = await listFiles(ws.paths.savingsReportsDir, ".json");
  checks.push({ name: "brief count", ok: true, detail: `${briefs.length}` });
  checks.push({ name: "memory count", ok: true, detail: `${memories.length}` });
  checks.push({ name: "savings report count", ok: true, detail: `${savings.length}` });

  const report: DoctorReport = {
    ok: configOk && checks.every((check) => check.ok || ["agent instructions", "context embeddings", "knowledge graph files"].includes(check.name)),
    projectRoot: ws.projectRoot,
    checks,
  };
  output(report, opts.json);
  return report;
}

async function existsCheck(name: string, target: string): Promise<DoctorCheck> {
  const ok = await pathExists(target);
  return {
    name,
    ok,
    detail: ok ? target : `Missing ${target}`,
  };
}

async function agentFiles(projectRoot: string): Promise<{ present: string[] }> {
  const candidates = [
    "AGENTS.md",
    ".agents/skills/memoria/SKILL.md",
    ".github/copilot-instructions.md",
    ".cursorrules",
    ".claude/instructions.md",
    ".windsurfrules",
  ];
  const present: string[] = [];
  for (const candidate of candidates) {
    if (await pathExists(path.join(projectRoot, candidate))) present.push(candidate);
  }
  return { present };
}

function output(report: DoctorReport, json?: boolean): void {
  if (json) {
    logger.json(report);
    return;
  }

  if (report.projectRoot) logger.raw(`project: ${report.projectRoot}`);
  for (const check of report.checks) {
    const mark = check.ok ? "ok" : "warn";
    logger.raw(`${mark} ${check.name}: ${check.detail}`);
  }
  if (report.ok) logger.success("doctor passed");
  else logger.warn("doctor found issues");
}
