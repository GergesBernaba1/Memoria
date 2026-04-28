import { promises as fs } from "node:fs";
import { loadConfig } from "../core/config.js";
import { requireWorkspace } from "../core/workspace.js";
import { listSourceFiles } from "../ingest/walker.js";
import { parseTsFile } from "../ingest/parser_ts.js";
import { parseGenericFile, isTsFile } from "../ingest/parser_generic.js";
import { KgStore } from "../kg/store.js";
import { chunkText } from "../embeddings/chunker.js";
import { resolveEmbedder } from "../embeddings/provider.js";
import { EmbeddingStore, writeIndexMetadata, type EmbeddingRecord } from "../embeddings/store.js";
import { SkillStore } from "../skills/store.js";
import { stringifySkill } from "../skills/parser.js";
import { listFiles, readText } from "../utils/fs.js";
import { logger } from "../utils/logger.js";

export interface IngestOptions {
  cwd?: string;
  /** Skip embedding — only refresh KG entities/relationships. */
  noEmbed?: boolean;
  /** Force re-embed everything (default: drop + rebuild for each ingested file). */
  full?: boolean;
}

/**
 * Walk the project, parse TS/JS files, refresh the KG, then chunk + embed
 * each file's contents and the project's Skill-MD files.
 */
export async function runIngest(opts: IngestOptions = {}): Promise<{
  filesScanned: number;
  entities: number;
  relationships: number;
  embeddings: number;
}> {
  const ws = await requireWorkspace(opts.cwd);
  const config = await loadConfig(ws.paths.configFile);

  logger.info(`Walking ${ws.projectRoot}`);
  const files = await listSourceFiles(ws.projectRoot, {
    include: config.include,
    exclude: config.exclude,
  });
  logger.info(`Found ${files.length} source files`);

  // 1. KG: parse each file → entities + relationships.
  const allEntities = [] as ReturnType<typeof parseTsFile>["entities"];
  const allRels = [] as ReturnType<typeof parseTsFile>["relationships"];
  const fileSet = new Set<string>();
  for (const f of files) {
    fileSet.add(f.rel);
    const source = await fs.readFile(f.abs, "utf8");
    const result = isTsFile(f.rel)
      ? parseTsFile({ abs: f.abs, rel: f.rel, source })
      : parseGenericFile({ abs: f.abs, rel: f.rel, source });
    allEntities.push(...result.entities);
    allRels.push(...result.relationships);
  }
  const kg = new KgStore(ws.paths.kgEntitiesFile, ws.paths.kgRelationshipsFile, ws.paths.kgClustersFile);
  if (opts.full) {
    await kg.writeEntities(allEntities);
    await kg.writeRelationships(allRels);
  } else {
    await kg.replaceForFiles(fileSet, { entities: allEntities, relationships: allRels });
  }
  logger.success(
    `KG updated: ${allEntities.length} entities, ${allRels.length} relationships`,
  );

  // 2. Embeddings.
  let embeddedCount = 0;
  if (!opts.noEmbed) {
    const { provider, model, dimensions } = resolveEmbedder(config);
    logger.info(`Embedding with ${provider.name}:${model} (${dimensions}d)`);

    // Drop stale records for the files we just touched.
    const codeStore = new EmbeddingStore(ws.paths.embeddingsCodeFile);
    const skillEmbStore = new EmbeddingStore(ws.paths.embeddingsSkillFile);
    const contextEmbStore = new EmbeddingStore(ws.paths.embeddingsContextFile);
    if (opts.full) {
      await codeStore.write([]);
      await skillEmbStore.write([]);
      await contextEmbStore.write([]);
    } else {
      await codeStore.dropByFiles(fileSet);
    }

    const codeRecords: EmbeddingRecord[] = [];
    for (const f of files) {
      const source = await fs.readFile(f.abs, "utf8");
      const chunks = chunkText(source, {
        chunkTokens: config.embeddings.chunkTokens,
        overlapTokens: config.embeddings.chunkOverlapTokens,
        model: config.defaultModel,
      });
      const vectors = await provider.embed(
        chunks.map((c) => c.text),
        model,
      );
      chunks.forEach((c, i) => {
        const v = vectors[i];
        if (!v) return;
        codeRecords.push({
          id: `${f.rel}:${c.index}`,
          sourceId: f.rel,
          source: "code",
          vector: v,
          text: c.text,
          tokens: c.tokens,
          meta: { file: f.rel, startLine: c.startLine, endLine: c.endLine },
        });
      });
    }
    await codeStore.append(codeRecords);
    embeddedCount += codeRecords.length;

    // Skills (always re-embed in full).
    const skillStore = new SkillStore(ws.paths.skillsDir);
    const skills = await skillStore.list();
    if (skills.length > 0) {
      await skillEmbStore.write([]); // re-do skill embeddings for consistency
      const texts = skills.map((s) => stringifySkill(s));
      const vectors = await provider.embed(texts, model);
      const skillRecords: EmbeddingRecord[] = skills.map((s, i) => ({
        id: `skill:${s.frontmatter.skill_name}:0`,
        sourceId: `skill:${s.frontmatter.skill_name}`,
        source: "skill",
        vector: vectors[i] ?? new Array<number>(dimensions).fill(0),
        text: texts[i] ?? "",
        meta: {
          name: s.frontmatter.skill_name,
          version: s.frontmatter.version,
          tags: s.frontmatter.tags,
        },
      }));
      await skillEmbStore.append(skillRecords);
      embeddedCount += skillRecords.length;
    }

    const contextRecords = await buildContextRecords({
      briefsDir: ws.paths.briefsDir,
      memoryDir: ws.paths.memoryDir,
      provider,
      model,
      dimensions,
    });
    await contextEmbStore.write(contextRecords);
    embeddedCount += contextRecords.length;

    await writeIndexMetadata(ws.paths.embeddingsIndexFile, {
      model,
      dimensions,
      createdAt:
        (await readCreatedAt(ws.paths.embeddingsIndexFile)) ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    logger.success(`Embeddings written: ${embeddedCount} chunks`);
  } else {
    logger.warn("--no-embed: skipping embedding generation");
  }

  return {
    filesScanned: files.length,
    entities: allEntities.length,
    relationships: allRels.length,
    embeddings: embeddedCount,
  };
}

async function readCreatedAt(file: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(file, "utf8");
    const json = JSON.parse(raw) as { createdAt?: string | null };
    return json.createdAt ?? null;
  } catch {
    return null;
  }
}

async function buildContextRecords(opts: {
  briefsDir: string;
  memoryDir: string;
  provider: ReturnType<typeof resolveEmbedder>["provider"];
  model: string;
  dimensions: number;
}): Promise<EmbeddingRecord[]> {
  const inputs: Array<{ id: string; sourceId: string; source: "brief" | "memory"; text: string; meta: Record<string, unknown> }> = [];

  for (const file of await listFiles(opts.briefsDir, ".md")) {
    const text = await readText(file);
    const name = fileNameWithoutExt(file);
    inputs.push({
      id: `brief:${name}:0`,
      sourceId: `brief:${name}`,
      source: "brief",
      text,
      meta: { file, name },
    });
  }

  for (const file of await listFiles(opts.memoryDir, ".md")) {
    const text = await readText(file);
    const name = fileNameWithoutExt(file);
    inputs.push({
      id: `memory:${name}:0`,
      sourceId: `memory:${name}`,
      source: "memory",
      text,
      meta: { file, name },
    });
  }

  if (inputs.length === 0) return [];
  const vectors = await opts.provider.embed(inputs.map((i) => i.text), opts.model);
  return inputs.map((input, i) => ({
    id: input.id,
    sourceId: input.sourceId,
    source: input.source,
    vector: vectors[i] ?? new Array<number>(opts.dimensions).fill(0),
    text: input.text,
    meta: input.meta,
  }));
}

function fileNameWithoutExt(file: string): string {
  return file.replace(/\\/g, "/").split("/").pop()?.replace(/\.md$/i, "") ?? "untitled";
}
