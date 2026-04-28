import type { SkillFile } from "./schema.js";

export interface SkillTemplateOptions {
  name: string;
  description?: string;
  tags?: string[];
  version?: string;
}

const DEFAULT_BODY = `## Purpose

Describe what this skill does and when to use it.

## Steps

1. First, ...
2. Then, ...
3. Finally, ...

## Examples

\`\`\`
Input: ...
Output: ...
\`\`\`

## References

- Link to relevant code or docs
`;

export function newSkillFromTemplate(opts: SkillTemplateOptions): SkillFile {
  return {
    frontmatter: {
      skill_name: opts.name,
      version: opts.version ?? "0.1.0",
      description: opts.description ?? `TODO: describe ${opts.name}`,
      tags: opts.tags ?? [],
      dependencies: [],
    },
    body: DEFAULT_BODY,
  };
}
