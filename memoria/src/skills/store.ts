import path from "node:path";
import { skillFilePath } from "../core/paths.js";
import { listFiles, pathExists, readText, removeFile, writeText } from "../utils/fs.js";
import { parseSkill, stringifySkill } from "./parser.js";
import { SkillNameSchema, type SkillFile } from "./schema.js";

export class SkillNotFoundError extends Error {
  constructor(name: string) {
    super(`Skill '${name}' not found`);
    this.name = "SkillNotFoundError";
  }
}

export class SkillAlreadyExistsError extends Error {
  constructor(name: string) {
    super(`Skill '${name}' already exists`);
    this.name = "SkillAlreadyExistsError";
  }
}

export class SkillStore {
  constructor(private readonly skillsDir: string) {}

  private fileFor(name: string): string {
    return skillFilePath(this.skillsDir, SkillNameSchema.parse(name));
  }

  /** Read a single skill by name. */
  async get(name: string): Promise<SkillFile> {
    const file = this.fileFor(name);
    if (!(await pathExists(file))) throw new SkillNotFoundError(name);
    const text = await readText(file);
    return parseSkill(text, file);
  }

  async exists(name: string): Promise<boolean> {
    return pathExists(this.fileFor(name));
  }

  /** List all skills, sorted by name. */
  async list(): Promise<SkillFile[]> {
    const files = await listFiles(this.skillsDir, ".md");
    const skills: SkillFile[] = [];
    for (const file of files) {
      try {
        const text = await readText(file);
        skills.push(parseSkill(text, file));
      } catch (err) {
        // Skip malformed skills but surface the filename.
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`! skipping ${path.basename(file)}: ${message}`);
      }
    }
    skills.sort((a, b) => a.frontmatter.skill_name.localeCompare(b.frontmatter.skill_name));
    return skills;
  }

  /** Create a new skill. Throws SkillAlreadyExistsError if one with that name exists. */
  async create(skill: SkillFile): Promise<string> {
    const name = skill.frontmatter.skill_name;
    const file = this.fileFor(name);
    if (await pathExists(file)) throw new SkillAlreadyExistsError(name);
    await writeText(file, stringifySkill(skill));
    return file;
  }

  async delete(name: string): Promise<void> {
    const file = this.fileFor(name);
    if (!(await pathExists(file))) throw new SkillNotFoundError(name);
    await removeFile(file);
  }
}
