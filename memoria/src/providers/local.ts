import {
  ProviderNotReadyError,
  type EmbeddingProvider,
} from "./types.js";

/**
 * Local/offline embedding provider backed by @xenova/transformers.
 *
 * The model is fetched and cached on first use (via the transformers library's
 * own cache; default ~/.cache/huggingface). We import the library lazily so
 * users who never run embeddings don't pay the import cost on every CLI call.
 */
export class LocalEmbeddingAdapter implements EmbeddingProvider {
  readonly name = "local";

  // The pipeline is keyed by model id and cached for the process lifetime.
  private cache = new Map<string, Promise<unknown>>();

  /** Always "ready" — readiness depends on whether the model can be fetched at run time. */
  isReady(): boolean {
    return true;
  }

  async embed(texts: string[], model: string): Promise<number[][]> {
    if (texts.length === 0) return [];
    const pipe = await this.featureExtractor(model);
    const out: number[][] = [];
    for (const text of texts) {
      const result = (await (pipe as (...a: unknown[]) => Promise<unknown>)(text, {
        pooling: "mean",
        normalize: true,
      })) as { data: Float32Array };
      out.push(Array.from(result.data));
    }
    return out;
  }

  dimensions(model: string): number {
    if (model.includes("MiniLM-L6-v2")) return 384;
    if (model.includes("mpnet-base-v2")) return 768;
    if (model.includes("bge-small")) return 384;
    if (model.includes("bge-base")) return 768;
    return 384;
  }

  private async featureExtractor(model: string): Promise<unknown> {
    let cached = this.cache.get(model);
    if (cached) return cached;
    cached = (async () => {
      let mod: typeof import("@xenova/transformers");
      try {
        mod = await import("@xenova/transformers");
      } catch {
        throw new ProviderNotReadyError(
          "local",
          "@xenova/transformers is not installed. Run `npm install @xenova/transformers`.",
        );
      }
      return mod.pipeline("feature-extraction", model);
    })();
    this.cache.set(model, cached);
    return cached;
  }
}
