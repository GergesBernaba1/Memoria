import { loadConfig } from "../core/config.js";
import { requireWorkspace } from "../core/workspace.js";
import { EmbeddingStore, type EmbeddingRecord } from "../embeddings/store.js";
import { kmeans } from "../cluster/kmeans.js";
import { KgStore } from "../kg/store.js";
import type { Clusters } from "../kg/types.js";
import { logger } from "../utils/logger.js";

export interface ClusterOptions {
  k?: number;
  json?: boolean;
  cwd?: string;
}

export async function runCluster(opts: ClusterOptions = {}): Promise<void> {
  const ws = await requireWorkspace(opts.cwd);
  const config = await loadConfig(ws.paths.configFile);

  const codeStore = new EmbeddingStore(ws.paths.embeddingsCodeFile);
  const records: EmbeddingRecord[] = [];
  for await (const r of codeStore.iterate()) records.push(r);

  if (records.length < 2) {
    logger.warn(`Not enough embeddings to cluster (have ${records.length}). Run \`memoria ingest\`.`);
    return;
  }

  const k = opts.k ?? (typeof config.cluster.k === "number" ? config.cluster.k : "auto");
  const result = kmeans(
    records.map((r) => r.vector),
    { k, maxIterations: config.cluster.maxIterations, seed: 42 },
  );

  const groups = Array.from({ length: result.k }, (_, id) => ({
    id,
    centroid: result.centroids[id]!,
    entityIds: [] as string[],
    label: undefined as string | undefined,
  }));
  result.assignments.forEach((cluster, i) => {
    const sourceId = records[i]!.sourceId;
    if (!groups[cluster]!.entityIds.includes(sourceId)) {
      groups[cluster]!.entityIds.push(sourceId);
    }
  });

  for (const g of groups) {
    g.label = pickLabel(g.entityIds);
  }

  const dimensions = records[0]!.vector.length;
  const clusters: Clusters = {
    model: (await readIndexModel(ws.paths.embeddingsIndexFile)) ?? "unknown",
    dimensions,
    k: result.k,
    generatedAt: new Date().toISOString(),
    clusters: groups,
  };

  const kg = new KgStore(ws.paths.kgEntitiesFile, ws.paths.kgRelationshipsFile, ws.paths.kgClustersFile);
  await kg.writeClusters(clusters);

  if (opts.json) {
    logger.json(clusters);
    return;
  }
  logger.success(`Wrote ${result.k} clusters (${result.iterations} iterations)`);
  for (const g of groups) {
    logger.raw(`  cluster ${g.id}: ${g.entityIds.length} entities${g.label ? ` -- ${g.label}` : ""}`);
  }
}

function pickLabel(ids: string[]): string | undefined {
  if (ids.length === 0) return undefined;
  const counts = new Map<string, number>();
  for (const id of ids) {
    const slash = id.lastIndexOf("/");
    if (slash <= 0) continue;
    const prefix = id.slice(0, slash);
    counts.set(prefix, (counts.get(prefix) ?? 0) + 1);
  }
  if (counts.size === 0) return undefined;
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

async function readIndexModel(file: string): Promise<string | null> {
  try {
    const { promises: fs } = await import("node:fs");
    const raw = await fs.readFile(file, "utf8");
    return (JSON.parse(raw) as { model?: string | null }).model ?? null;
  } catch {
    return null;
  }
}
