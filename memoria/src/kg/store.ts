import { pathExists, readJson, writeJson } from "../utils/fs.js";
import type { Clusters, Entity, Relationship } from "./types.js";

export class KgStore {
  constructor(
    private readonly entitiesFile: string,
    private readonly relationshipsFile: string,
    private readonly clustersFile: string,
  ) {}

  async readEntities(): Promise<Entity[]> {
    if (!(await pathExists(this.entitiesFile))) return [];
    return readJson<Entity[]>(this.entitiesFile);
  }

  async readRelationships(): Promise<Relationship[]> {
    if (!(await pathExists(this.relationshipsFile))) return [];
    return readJson<Relationship[]>(this.relationshipsFile);
  }

  async readClusters(): Promise<Clusters | null> {
    if (!(await pathExists(this.clustersFile))) return null;
    return readJson<Clusters>(this.clustersFile);
  }

  async writeEntities(entities: Entity[]): Promise<void> {
    await writeJson(this.entitiesFile, entities);
  }

  async writeRelationships(rels: Relationship[]): Promise<void> {
    await writeJson(this.relationshipsFile, rels);
  }

  async writeClusters(clusters: Clusters): Promise<void> {
    await writeJson(this.clustersFile, clusters);
  }

  /**
   * Replace all entities + relationships whose `file` (entities) or
   * `meta.file` (relationships) is in `files`. Used for incremental re-ingest.
   */
  async replaceForFiles(
    files: Set<string>,
    next: { entities: Entity[]; relationships: Relationship[] },
  ): Promise<void> {
    const existingEntities = await this.readEntities();
    const existingRels = await this.readRelationships();

    const keptEntities = existingEntities.filter((e) => !e.file || !files.has(e.file));
    const keptRels = existingRels.filter((r) => {
      const rFile = (r.meta as { file?: string } | undefined)?.file;
      return !rFile || !files.has(rFile);
    });

    await this.writeEntities([...keptEntities, ...next.entities]);
    await this.writeRelationships([...keptRels, ...next.relationships]);
  }
}
