// Public library API.

export { runInit } from "./commands/init.js";
export { skillCreate, skillDelete, skillList, skillShow } from "./commands/skill.js";
export { tokensCompress, tokensCount, tokensEstimate } from "./commands/tokens.js";
export { configGet, configSet } from "./commands/config.js";
export { briefChecklist, briefCreate, briefList, briefPath, briefShow } from "./commands/brief.js";
export { memoryAdd, memoryDelete, memoryList, memorySearch, memoryShow, memoryUpdate } from "./commands/memory.js";
export { runSavings, type SavingsOptions, type SavingsReport } from "./commands/savings.js";
export { runAsk, type AskOptions, type AskResult } from "./commands/ask.js";
export { agentInstall, isAgentTarget, type AgentInstallOptions, type AgentTarget } from "./commands/agent.js";
export { runDoctor, type DoctorReport } from "./commands/doctor.js";
export {
  featureDone,
  featureFinish,
  featureList,
  featurePacket,
  featureStart,
  featureStatus,
  type FeatureFinishOptions,
  type FeatureListItem,
  type FeatureStartOptions,
  type FeatureStatus,
} from "./commands/feature.js";

export {
  ConfigSchema,
  defaultConfig,
  getKey,
  loadConfig,
  saveConfig,
  setKey,
  type Config,
  type Price,
} from "./core/config.js";
export {
  findWorkspace,
  requireWorkspace,
  type Workspace,
} from "./core/workspace.js";
export {
  memoriaPathsFor,
  briefFilePath,
  memoryFilePath,
  skillFilePath,
  type MemoriaPaths,
} from "./core/paths.js";

export { parseSkill, stringifySkill } from "./skills/parser.js";
export {
  SkillFrontmatterSchema,
  SkillNameSchema,
  type SkillFile,
  type SkillFrontmatter,
} from "./skills/schema.js";
export {
  SkillStore,
  SkillNotFoundError,
  SkillAlreadyExistsError,
} from "./skills/store.js";
export { newSkillFromTemplate } from "./skills/template.js";

export {
  countTokens,
  selectTokenizer,
  type CountResult,
  type Tokenizer,
} from "./tokens/counter.js";
export { estimateCost, type CostEstimate } from "./tokens/estimator.js";
export { BUILTIN_PRICES, listKnownModels, priceFor } from "./tokens/pricing.js";
export { compress, type CompressResult } from "./tokens/compress.js";

export {
  buildRegistry,
  llmProviderFor,
  type ProviderRegistry,
} from "./providers/registry.js";
export {
  ProviderNotReadyError,
  type ChatMessage,
  type ChatOpts,
  type ChatResult,
  type EmbeddingProvider,
  type LLMProvider,
} from "./providers/types.js";
export { AnthropicAdapter } from "./providers/anthropic.js";
export { OpenAIAdapter } from "./providers/openai.js";
export { LocalEmbeddingAdapter } from "./providers/local.js";

// v2: ingest + retrieval + summarize + cluster + recall
export {
  listSourceFiles,
  walk,
  type WalkOptions,
  type WalkedFile,
} from "./ingest/walker.js";
export { parseTsFile, type ParseResult } from "./ingest/parser_ts.js";
export { KgStore } from "./kg/store.js";
export {
  buildIndex,
  expand,
  type AdjacencyIndex,
} from "./kg/traverse.js";
export type {
  Clusters,
  Entity,
  EntityKind,
  RelationKind,
  Relationship,
} from "./kg/types.js";
export {
  EmbeddingStore,
  readIndexMetadata,
  writeIndexMetadata,
  type EmbeddingIndexMetadata,
  type EmbeddingRecord,
} from "./embeddings/store.js";
export { chunkText, type Chunk } from "./embeddings/chunker.js";
export {
  cosineSimilarity,
  topK,
  type ScoredRecord,
} from "./embeddings/search.js";
export {
  resolveEmbedder,
  type ResolvedEmbedder,
} from "./embeddings/provider.js";
export { hashContent, summarizeFile } from "./summarize/code.js";
export {
  SummaryStore,
  summaryIdToFilename,
  type SummaryFile,
  type SummaryFrontmatter,
} from "./summarize/store.js";
export {
  kmeans,
  type KmeansOptions,
  type KmeansResult,
} from "./cluster/kmeans.js";
export {
  parseOrder,
  rerankWithLLM,
  type RerankOptions,
} from "./embeddings/rerank.js";
export {
  assembleRecall,
  type RecallOptions,
  type RecallResult,
  type RecallSection,
} from "./recall/assembler.js";

export { runIngest } from "./commands/ingest.js";
export { runSearch } from "./commands/search.js";
export { runRecall } from "./commands/recall.js";
export { runSummarize } from "./commands/summarize.js";
export { runCluster } from "./commands/cluster.js";
