import { countTokens } from "../tokens/counter.js";

export interface Chunk {
  text: string;
  index: number;
  startLine: number;
  endLine: number;
  tokens: number;
}

/**
 * Split source text into roughly token-sized chunks with overlap.
 *
 * The splitter prefers to break on blank lines and never splits a line in
 * half. If a single line is larger than the budget on its own, it is emitted
 * as one oversized chunk — this matters very little in practice (most code
 * has frequent line breaks).
 */
export function chunkText(
  text: string,
  opts: { chunkTokens: number; overlapTokens: number; model: string },
): Chunk[] {
  const lines = text.split("\n");
  const lineTokens = lines.map((l) => countTokens(l, opts.model).tokens);

  const chunks: Chunk[] = [];
  let i = 0;
  let chunkIndex = 0;

  while (i < lines.length) {
    let acc = 0;
    let j = i;
    while (j < lines.length && acc + lineTokens[j]! <= opts.chunkTokens) {
      acc += lineTokens[j]! + 1; // +1 for the newline
      j++;
    }
    if (j === i) {
      // Single line larger than budget — take it as-is.
      j = i + 1;
      acc = lineTokens[i]!;
    }
    const slice = lines.slice(i, j).join("\n");
    chunks.push({
      text: slice,
      index: chunkIndex++,
      startLine: i + 1,
      endLine: j,
      tokens: acc,
    });

    if (j >= lines.length) break;

    // Step back by `overlapTokens` worth of lines (whole lines only).
    let overlap = 0;
    let back = j;
    while (back > i + 1 && overlap < opts.overlapTokens) {
      back--;
      overlap += lineTokens[back]!;
    }
    i = back;
  }

  return chunks;
}
