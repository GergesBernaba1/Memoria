import type { Entity, Relationship } from "./types.js";

export interface AdjacencyIndex {
  entities: Map<string, Entity>;
  /** outgoing[fromId] = relationships with that fromId */
  outgoing: Map<string, Relationship[]>;
  /** incoming[toId] = relationships with that toId */
  incoming: Map<string, Relationship[]>;
}

export function buildIndex(entities: Entity[], relationships: Relationship[]): AdjacencyIndex {
  const e = new Map<string, Entity>();
  for (const ent of entities) e.set(ent.id, ent);
  const out = new Map<string, Relationship[]>();
  const inn = new Map<string, Relationship[]>();
  for (const rel of relationships) {
    (out.get(rel.fromId) ?? out.set(rel.fromId, []).get(rel.fromId)!).push(rel);
    (inn.get(rel.toId) ?? inn.set(rel.toId, []).get(rel.toId)!).push(rel);
  }
  return { entities: e, outgoing: out, incoming: inn };
}

/**
 * BFS-expand `seedIds` up to `hops` hops along outgoing+incoming edges.
 * Returns the union of seeds + their N-hop neighborhood, capped at `maxNodes`.
 * Insertion order is preserved (seeds first, then 1-hop, etc.).
 */
export function expand(
  seedIds: string[],
  index: AdjacencyIndex,
  hops: number,
  maxNodes = 100,
): string[] {
  const visited = new Set<string>();
  const order: string[] = [];
  const queue: Array<{ id: string; depth: number }> = [];

  for (const id of seedIds) {
    if (visited.has(id)) continue;
    if (!index.entities.has(id)) continue;
    visited.add(id);
    order.push(id);
    queue.push({ id, depth: 0 });
  }

  while (queue.length > 0 && order.length < maxNodes) {
    const node = queue.shift()!;
    if (node.depth >= hops) continue;
    const out = index.outgoing.get(node.id) ?? [];
    const inn = index.incoming.get(node.id) ?? [];
    for (const rel of [...out, ...inn]) {
      const next = rel.fromId === node.id ? rel.toId : rel.fromId;
      if (visited.has(next)) continue;
      if (!index.entities.has(next)) continue;
      visited.add(next);
      order.push(next);
      queue.push({ id: next, depth: node.depth + 1 });
      if (order.length >= maxNodes) break;
    }
  }

  return order;
}
