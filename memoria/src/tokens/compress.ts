/**
 * Lightweight, lossless prompt compression heuristics.
 *
 * v1 is intentionally minimal: collapse runs of whitespace, deduplicate
 * adjacent identical lines, and trim trailing space on each line. The proposal
 * promises LLM-driven compression; that lands in v2 alongside summarization.
 */

export interface CompressResult {
  text: string;
  before: number;
  after: number;
  savedChars: number;
}

export function compress(text: string): CompressResult {
  const before = text.length;

  // 1. Normalize line endings.
  let out = text.replace(/\r\n/g, "\n");

  // 2. Trim trailing whitespace per line.
  out = out
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/g, ""))
    .join("\n");

  // 3. Collapse runs of 3+ blank lines down to 2.
  out = out.replace(/\n{3,}/g, "\n\n");

  // 4. Collapse runs of internal spaces inside paragraphs (but preserve
  //    indentation at the start of a line, which often matters for code).
  out = out
    .split("\n")
    .map((line) => {
      const indentMatch = line.match(/^(\s*)(.*)$/s);
      if (!indentMatch) return line;
      const [, indent = "", body = ""] = indentMatch;
      return indent + body.replace(/[ \t]{2,}/g, " ");
    })
    .join("\n");

  // 5. Deduplicate consecutive identical non-blank lines.
  const lines = out.split("\n");
  const dedup: string[] = [];
  for (const line of lines) {
    if (line.trim() === "") {
      dedup.push(line);
      continue;
    }
    if (dedup.length > 0 && dedup[dedup.length - 1] === line) continue;
    dedup.push(line);
  }
  out = dedup.join("\n");

  return {
    text: out,
    before,
    after: out.length,
    savedChars: before - out.length,
  };
}
