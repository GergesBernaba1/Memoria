import matter from "gray-matter";
import { SkillFrontmatterSchema, type SkillFile } from "./schema.js";

/**
 * Parse a Skill-MD source string.
 * Throws if the YAML frontmatter doesn't satisfy SkillFrontmatterSchema.
 */
export function parseSkill(source: string, sourcePath?: string): SkillFile {
  const parsed = matter(source);
  const frontmatter = SkillFrontmatterSchema.parse(parsed.data);
  return {
    frontmatter,
    body: parsed.content.replace(/^\n+/, ""),
    path: sourcePath,
  };
}

/** Serialize a SkillFile back to a Skill-MD string. */
export function stringifySkill(skill: SkillFile): string {
  // gray-matter's stringify produces `---\n...\n---\n<body>` format.
  return matter.stringify(skill.body, skill.frontmatter);
}
