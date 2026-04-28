import path from "node:path";

export const MEMORIA_DIR = ".memoria";
export const CONFIG_FILE = "config.json";
export const README_FILE = "README.md";
export const SKILLS_DIR = "skills";
export const BRIEFS_DIR = "briefs";
export const MEMORY_DIR = "memory";
export const AGENTS_DIR = "agents";
export const REPORTS_DIR = "reports";
export const SAVINGS_REPORTS_DIR = "savings";
export const KG_DIR = "knowledge_graph";
export const KG_ENTITIES_FILE = "entities.json";
export const KG_RELATIONSHIPS_FILE = "relationships.json";
export const KG_CLUSTERS_FILE = "clusters.json";
export const KG_SUMMARIES_DIR = "summaries";
export const EMBEDDINGS_DIR = "embeddings";
export const EMBEDDINGS_INDEX_FILE = "index_metadata.json";
export const EMBEDDINGS_CODE_FILE = "code_embeddings.jsonl";
export const EMBEDDINGS_SKILL_FILE = "skill_embeddings.jsonl";
export const EMBEDDINGS_CONTEXT_FILE = "context_embeddings.jsonl";

export interface MemoriaPaths {
  root: string;
  configFile: string;
  readmeFile: string;
  skillsDir: string;
  briefsDir: string;
  memoryDir: string;
  agentsDir: string;
  reportsDir: string;
  savingsReportsDir: string;
  kgDir: string;
  kgEntitiesFile: string;
  kgRelationshipsFile: string;
  kgClustersFile: string;
  kgSummariesDir: string;
  embeddingsDir: string;
  embeddingsIndexFile: string;
  embeddingsCodeFile: string;
  embeddingsSkillFile: string;
  embeddingsContextFile: string;
}

/** Build the canonical set of paths for a `.memoria/` directory at `root`. */
export function memoriaPathsFor(projectRoot: string): MemoriaPaths {
  const root = path.join(projectRoot, MEMORIA_DIR);
  const kgDir = path.join(root, KG_DIR);
  const embeddingsDir = path.join(root, EMBEDDINGS_DIR);
  const reportsDir = path.join(root, REPORTS_DIR);
  return {
    root,
    configFile: path.join(root, CONFIG_FILE),
    readmeFile: path.join(root, README_FILE),
    skillsDir: path.join(root, SKILLS_DIR),
    briefsDir: path.join(root, BRIEFS_DIR),
    memoryDir: path.join(root, MEMORY_DIR),
    agentsDir: path.join(root, AGENTS_DIR),
    reportsDir,
    savingsReportsDir: path.join(reportsDir, SAVINGS_REPORTS_DIR),
    kgDir,
    kgEntitiesFile: path.join(kgDir, KG_ENTITIES_FILE),
    kgRelationshipsFile: path.join(kgDir, KG_RELATIONSHIPS_FILE),
    kgClustersFile: path.join(kgDir, KG_CLUSTERS_FILE),
    kgSummariesDir: path.join(kgDir, KG_SUMMARIES_DIR),
    embeddingsDir,
    embeddingsIndexFile: path.join(embeddingsDir, EMBEDDINGS_INDEX_FILE),
    embeddingsCodeFile: path.join(embeddingsDir, EMBEDDINGS_CODE_FILE),
    embeddingsSkillFile: path.join(embeddingsDir, EMBEDDINGS_SKILL_FILE),
    embeddingsContextFile: path.join(embeddingsDir, EMBEDDINGS_CONTEXT_FILE),
  };
}

/** Path to a specific skill file inside a `.memoria/skills/` directory. */
export function skillFilePath(skillsDir: string, name: string): string {
  return path.join(skillsDir, `${name}.md`);
}

export function briefFilePath(briefsDir: string, name: string): string {
  return path.join(briefsDir, `${name}.md`);
}

export function memoryFilePath(memoryDir: string, id: string): string {
  return path.join(memoryDir, `${id}.md`);
}
