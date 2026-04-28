import path from "node:path";
import { defaultConfig, saveConfig } from "../core/config.js";
import { memoriaPathsFor } from "../core/paths.js";
import { ensureDir, pathExists, writeJson, writeText } from "../utils/fs.js";
import { logger } from "../utils/logger.js";

export interface InitOptions {
  cwd?: string;
  force?: boolean;
  projectName?: string;
}

const README_BODY = `# .memoria/

This directory is managed by [Memoria](../PLAN.md). It stores the project's
LLM-facing context: briefs, skills, memories, knowledge graph data, and embeddings.

- \`config.json\`           - project-level settings, model defaults, exclusions, pricing overrides.
- \`skills/\`                - Skill-MD files (YAML frontmatter + markdown body).
- \`briefs/\`                - compact intent, budget, plan, and task briefs.
- \`memory/\`                - decisions, notes, conventions, and session memories.
- \`agents/\`                - slash-command guidance for AI coding tools.
- \`knowledge_graph/\`       - entities, relationships, summaries, and clusters.
- \`embeddings/\`            - JSONL files with vector embeddings + index metadata.
- \`reports/\`               - generated reports such as token savings analysis.

Everything here is plain text and meant to be committed to Git alongside your
code.
`;

const DEFAULT_INDEX_METADATA = {
  model: null,
  dimensions: null,
  createdAt: null as string | null,
  updatedAt: null as string | null,
};

export async function runInit(opts: InitOptions = {}): Promise<{ projectRoot: string }> {
  const projectRoot = path.resolve(opts.cwd ?? process.cwd());
  const paths = memoriaPathsFor(projectRoot);

  if (await pathExists(paths.root)) {
    if (!opts.force) {
      throw new Error(
        `${paths.root} already exists. Re-run with --force to overwrite the config (skills are preserved).`,
      );
    }
    logger.warn(`Overwriting existing ${paths.root} (--force).`);
  }

  await ensureDir(paths.root);
  await ensureDir(paths.skillsDir);
  await ensureDir(paths.briefsDir);
  await ensureDir(paths.memoryDir);
  await ensureDir(paths.agentsDir);
  await ensureDir(paths.reportsDir);
  await ensureDir(paths.savingsReportsDir);
  await ensureDir(paths.kgDir);
  await ensureDir(paths.kgSummariesDir);
  await ensureDir(paths.embeddingsDir);

  await writeText(paths.readmeFile, README_BODY);

  const projectName = opts.projectName ?? path.basename(projectRoot);
  const cfg = defaultConfig(projectName);
  await saveConfig(paths.configFile, cfg);

  await writeJson(paths.kgEntitiesFile, []);
  await writeJson(paths.kgRelationshipsFile, []);
  if (!(await pathExists(paths.kgClustersFile))) {
    await writeJson(paths.kgClustersFile, {
      model: null,
      dimensions: null,
      k: 0,
      generatedAt: null,
      clusters: [],
    });
  }

  await writeJson(paths.embeddingsIndexFile, DEFAULT_INDEX_METADATA);
  if (!(await pathExists(paths.embeddingsCodeFile))) {
    await writeText(paths.embeddingsCodeFile, "");
  }
  if (!(await pathExists(paths.embeddingsSkillFile))) {
    await writeText(paths.embeddingsSkillFile, "");
  }
  if (!(await pathExists(paths.embeddingsContextFile))) {
    await writeText(paths.embeddingsContextFile, "");
  }

  logger.success(`Initialized .memoria/ at ${paths.root}`);
  return { projectRoot };
}
