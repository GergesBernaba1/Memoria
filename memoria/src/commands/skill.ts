import { requireWorkspace } from "../core/workspace.js";
import { SkillStore } from "../skills/store.js";
import { newSkillFromTemplate } from "../skills/template.js";
import { logger } from "../utils/logger.js";

export interface SkillCreateOptions {
  description?: string;
  tags?: string[];
  cwd?: string;
}

export async function skillCreate(name: string, opts: SkillCreateOptions = {}): Promise<string> {
  const ws = await requireWorkspace(opts.cwd);
  const store = new SkillStore(ws.paths.skillsDir);
  const skill = newSkillFromTemplate({ name, description: opts.description, tags: opts.tags });
  const filePath = await store.create(skill);
  logger.success(`Created skill '${name}' at ${filePath}`);
  return filePath;
}

export interface SkillListOptions {
  json?: boolean;
  cwd?: string;
}

export async function skillList(opts: SkillListOptions = {}): Promise<void> {
  const ws = await requireWorkspace(opts.cwd);
  const store = new SkillStore(ws.paths.skillsDir);
  const skills = await store.list();

  if (opts.json) {
    logger.json(
      skills.map((s) => ({
        name: s.frontmatter.skill_name,
        version: s.frontmatter.version,
        description: s.frontmatter.description,
        tags: s.frontmatter.tags,
        path: s.path,
      })),
    );
    return;
  }

  if (skills.length === 0) {
    logger.info("No skills yet. Create one with `memoria skill create <name>`.");
    return;
  }
  for (const s of skills) {
    const tags = s.frontmatter.tags.length ? `  [${s.frontmatter.tags.join(", ")}]` : "";
    logger.raw(
      `  ${s.frontmatter.skill_name}@${s.frontmatter.version}${tags}\n      ${s.frontmatter.description}`,
    );
  }
}

export interface SkillShowOptions {
  cwd?: string;
}

export async function skillShow(name: string, opts: SkillShowOptions = {}): Promise<void> {
  const ws = await requireWorkspace(opts.cwd);
  const store = new SkillStore(ws.paths.skillsDir);
  const skill = await store.get(name);
  logger.raw("---");
  logger.raw(`skill_name: ${skill.frontmatter.skill_name}`);
  logger.raw(`version:    ${skill.frontmatter.version}`);
  logger.raw(`description: ${skill.frontmatter.description}`);
  if (skill.frontmatter.tags.length) {
    logger.raw(`tags:       ${skill.frontmatter.tags.join(", ")}`);
  }
  if (skill.frontmatter.dependencies.length) {
    logger.raw(`deps:       ${skill.frontmatter.dependencies.join(", ")}`);
  }
  logger.raw("---");
  logger.raw(skill.body);
}

export interface SkillDeleteOptions {
  yes?: boolean;
  cwd?: string;
}

export async function skillDelete(name: string, opts: SkillDeleteOptions = {}): Promise<void> {
  if (!opts.yes) {
    throw new Error(`Refusing to delete '${name}' without --yes.`);
  }
  const ws = await requireWorkspace(opts.cwd);
  const store = new SkillStore(ws.paths.skillsDir);
  await store.delete(name);
  logger.success(`Deleted skill '${name}'`);
}
