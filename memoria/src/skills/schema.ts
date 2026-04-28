import { z } from "zod";

/**
 * Skill names are filesystem-safe slugs.
 * lowercase letters, digits, hyphens; 2-64 chars; no leading/trailing hyphens.
 */
export const SkillNameSchema = z
  .string()
  .min(2)
  .max(64)
  .regex(
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/,
    "skill name must be lowercase letters/digits/hyphens, 2-64 chars",
  );

/** YAML frontmatter for a Skill-MD file. */
export const SkillFrontmatterSchema = z.object({
  skill_name: SkillNameSchema,
  version: z
    .string()
    .regex(/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/, "version must be semver-ish (e.g. 0.1.0)"),
  description: z.string().min(1),
  tags: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]),
  /** JSON-Schema-shaped objects; left loose intentionally for v1. */
  input_schema: z.record(z.string(), z.unknown()).optional(),
  output_schema: z.record(z.string(), z.unknown()).optional(),
});

export type SkillFrontmatter = z.infer<typeof SkillFrontmatterSchema>;

export interface SkillFile {
  frontmatter: SkillFrontmatter;
  /** Raw markdown body (everything after the `---` block). */
  body: string;
  /** Absolute filesystem path the skill was loaded from, if applicable. */
  path?: string;
}
