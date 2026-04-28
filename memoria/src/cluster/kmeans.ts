/**
 * Lightweight k-means for unit-length embedding vectors.
 *
 * Uses cosine-equivalent assignment (since vectors are normalized, dot product
 * == cosine similarity).
 */

export interface KmeansOptions {
  k: number | "auto";
  maxIterations?: number;
  seed?: number;
}

export interface KmeansResult {
  k: number;
  centroids: number[][];
  assignments: number[];
  iterations: number;
}

export function kmeans(vectors: number[][], opts: KmeansOptions): KmeansResult {
  const n = vectors.length;
  if (n === 0) return { k: 0, centroids: [], assignments: [], iterations: 0 };
  const dim = vectors[0]!.length;

  const k = resolveK(opts.k, n);
  const maxIter = opts.maxIterations ?? 50;
  const rng = mulberry32(opts.seed ?? 0);

  const centroids: number[][] = [];
  const seen = new Set<number>();
  while (centroids.length < k) {
    const idx = Math.floor(rng() * n);
    if (seen.has(idx)) continue;
    seen.add(idx);
    centroids.push([...vectors[idx]!]);
  }

  const assignments = new Array<number>(n).fill(0);
  let iterations = 0;

  for (; iterations < maxIter; iterations++) {
    let changed = false;

    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestSim = -Infinity;
      for (let c = 0; c < k; c++) {
        const sim = dot(vectors[i]!, centroids[c]!);
        if (sim > bestSim) {
          bestSim = sim;
          best = c;
        }
      }
      if (assignments[i] !== best) {
        assignments[i] = best;
        changed = true;
      }
    }

    const sums = Array.from({ length: k }, () => new Array<number>(dim).fill(0));
    const counts = new Array<number>(k).fill(0);
    for (let i = 0; i < n; i++) {
      const c = assignments[i]!;
      counts[c] = (counts[c] ?? 0) + 1;
      const v = vectors[i]!;
      const s = sums[c]!;
      for (let d = 0; d < dim; d++) s[d]! += v[d]!;
    }
    for (let c = 0; c < k; c++) {
      if ((counts[c] ?? 0) === 0) {
        centroids[c] = [...vectors[Math.floor(rng() * n)]!];
        continue;
      }
      const s = sums[c]!;
      const out = new Array<number>(dim);
      for (let d = 0; d < dim; d++) out[d] = s[d]! / (counts[c] ?? 1);
      centroids[c] = normalize(out);
    }

    if (!changed && iterations > 0) {
      iterations++;
      break;
    }
  }

  return { k, centroids, assignments, iterations };
}

function resolveK(k: number | "auto", n: number): number {
  if (k === "auto") {
    const heuristic = Math.max(2, Math.round(Math.sqrt(n / 2)));
    return Math.min(heuristic, n);
  }
  return Math.min(Math.max(1, Math.floor(k)), n);
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i]! * b[i]!;
  return s;
}

function normalize(v: number[]): number[] {
  let mag = 0;
  for (const x of v) mag += x * x;
  mag = Math.sqrt(mag);
  if (mag === 0) return v;
  return v.map((x) => x / mag);
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
