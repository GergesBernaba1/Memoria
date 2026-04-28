import { createHash } from "node:crypto";
import type { Config } from "../core/config.js";
import type { LLMProvider } from "../providers/types.js";
import { countTokens } from "../tokens/counter.js";
import type { SummaryFile, SummaryFrontmatter } from "./store.js";

export interface SummarizeFileInput {
  entityId: string;
  file: string;
  source: string;
}

const FILE_PROMPT = `You are summarizing a source code file so that an LLM agent can quickly understand it without reading the whole thing.

Produce a Markdown summary with these sections, and nothing else:

## Purpose
One or two sentences. What this file does and when it runs.

## Exports
A bullet list. For each top-level exported symbol: \`name\` — one-sentence description.

## Dependencies
A bullet list of the most important modules this file imports and what it uses them for. Group sibling-file imports under one bullet if they're related.

## Side effects
Any module-level work, registrations, IO, or globals. Skip this section if there are none.

Be concrete. Quote real symbol names from the source. Do not invent details. Do not include the source code in your reply.`;

export interface SummarizerDeps {
  provider: LLMProvider;
  model: string;
  config: Config;
}

/**
 * Summarize a single source file via the configured LLM. Skips files larger
 * than `summarize.maxInputTokens` and returns null in that case so the caller
 * can decide to chunk or drop.
 */
export async function summarizeFile(
  input: SummarizeFileInput,
  deps: SummarizerDeps,
): Promise<{ summary: SummaryFile; inputTokens: number; outputTokens: number } | null> {
  const cfg = deps.config.summarize;
  const tokens = countTokens(input.source, deps.model).tokens;
  if (tokens > cfg.maxInputTokens) return null;

  const userMsg =
    `File: ${input.file}\n\nSource:\n\`\`\`\n${input.source}\n\`\`\`\n\nFollow the section format strictly.`;

  const result = await deps.provider.chat({
    model: deps.model,
    messages: [
      { role: "system", content: FILE_PROMPT },
      { role: "user", content: userMsg },
    ],
    maxTokens: cfg.maxOutputTokens,
    temperature: 0,
  });

  const frontmatter: SummaryFrontmatter = {
    entityId: input.entityId,
    file: input.file,
    contentHash: hashContent(input.source),
    model: deps.model,
    generatedAt: new Date().toISOString(),
  };

  return {
    summary: {
      frontmatter,
      body: result.content.trim() + "\n",
    },
    inputTokens: result.inputTokens || tokens,
    outputTokens: result.outputTokens,
  };
}

export function hashContent(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}
