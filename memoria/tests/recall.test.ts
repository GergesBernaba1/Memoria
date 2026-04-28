import { describe, it, expect, beforeEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { runInit } from "../src/commands/init.js";
import { memoriaPathsFor } from "../src/core/paths.js";
import { ConfigSchema, loadConfig, saveConfig } from "../src/core/config.js";
import { EmbeddingStore } from "../src/embeddings/store.js";
import { KgStore } from "../src/kg/store.js";
import { SkillStore } from "../src/skills/store.js";
import { newSkillFromTemplate } from "../src/skills/template.js";
import { assembleRecall } from "../src/recall/assembler.js";

vi.mock("../src/embeddings/provider.js", () => {
  const fake = {
    name: "fake",
    isReady: () => true,
    async embed(texts: string[]) {
      return texts.map((t) => fakeVec(t));
    },
    dimensions: () => 4,
  };
  return {
    resolveEmbedder: () => ({ provider: fake, model: "fake-model", dimensions: 4 }),
  };
});

function fakeVec(text: string): number[] {
  const v: [number, number, number, number] = [0, 0, 0, 0];
  const tokens = text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  for (const t of tokens) {
    if (t.includes("login") || t.includes("auth") || t.includes("jwt")) v[0] += 1;
    if (t.includes("user")) v[1] += 1;
    if (t.includes("token")) v[2] += 1;
    if (t.includes("error") || t.includes("invalid")) v[3] += 1;
  }
  const m = Math.sqrt(v.reduce((a, x) => a + x * x, 0)) || 1;
  return v.map((x) => x / m);
}

describe("assembleRecall", () => {
  let projectRoot: string;
  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), "memoria-recall-"));
    await runInit({ cwd: projectRoot, projectName: "demo" });
    const paths = memoriaPathsFor(projectRoot);
    const config = await loadConfig(paths.configFile);
    await saveConfig(paths.configFile, ConfigSchema.parse(config));

    const kg = new KgStore(paths.kgEntitiesFile, paths.kgRelationshipsFile, paths.kgClustersFile);
    await kg.writeEntities([
      { id: "src/auth/login.ts", kind: "module", name: "login.ts", file: "src/auth/login.ts" },
      { id: "src/auth/logout.ts", kind: "module", name: "logout.ts", file: "src/auth/logout.ts" },
      { id: "src/util/strings.ts", kind: "module", name: "strings.ts", file: "src/util/strings.ts" },
    ]);
    await kg.writeRelationships([
      { fromId: "src/auth/login.ts", toId: "src/util/strings.ts", kind: "imports" },
    ]);

    const codeStore = new EmbeddingStore(paths.embeddingsCodeFile);
    await codeStore.write([
      {
        id: "src/auth/login.ts:0",
        sourceId: "src/auth/login.ts",
        source: "code",
        vector: fakeVec("login user verify password jwt"),
        text: "function login(email, password) { return jwt; }",
        meta: { file: "src/auth/login.ts", startLine: 1, endLine: 5 },
      },
      {
        id: "src/auth/logout.ts:0",
        sourceId: "src/auth/logout.ts",
        source: "code",
        vector: fakeVec("logout invalidate token"),
        text: "function logout(token) { invalidate(token); }",
        meta: { file: "src/auth/logout.ts", startLine: 1, endLine: 3 },
      },
      {
        id: "src/util/strings.ts:0",
        sourceId: "src/util/strings.ts",
        source: "code",
        vector: fakeVec("string trim pad"),
        text: "export function pad(s) { return s.padStart(8); }",
        meta: { file: "src/util/strings.ts", startLine: 1, endLine: 3 },
      },
    ]);

    const skillStore = new SkillStore(paths.skillsDir);
    await skillStore.create(
      newSkillFromTemplate({
        name: "authenticate-user",
        description: "Verify credentials and issue a JWT",
        tags: ["auth"],
      }),
    );
    const skillEmbStore = new EmbeddingStore(paths.embeddingsSkillFile);
    await skillEmbStore.write([
      {
        id: "skill:authenticate-user:0",
        sourceId: "skill:authenticate-user",
        source: "skill",
        vector: fakeVec("authenticate user jwt token"),
        text: "Skill: authenticate-user. Verify credentials and issue a JWT.",
        meta: { name: "authenticate-user", tags: ["auth"] },
      },
    ]);

    const contextEmbStore = new EmbeddingStore(paths.embeddingsContextFile);
    await contextEmbStore.write([
      {
        id: "brief:auth-refresh:0",
        sourceId: "brief:auth-refresh",
        source: "brief",
        vector: fakeVec("auth jwt token refresh implementation brief"),
        text: "# Auth Refresh\n\nUse recall before implementing token refresh.",
        meta: { name: "auth-refresh" },
      },
      {
        id: "memory:refresh-token-policy:0",
        sourceId: "memory:refresh-token-policy",
        source: "memory",
        vector: fakeVec("jwt token refresh decision"),
        text: "Decision: use rotating refresh tokens for auth.",
        meta: { name: "refresh-token-policy" },
      },
    ]);
  });

  it("ranks login.ts above unrelated files for an auth query", async () => {
    const paths = memoriaPathsFor(projectRoot);
    const config = await loadConfig(paths.configFile);
    const result = await assembleRecall(paths, config, {
      query: "How do we log a user in and issue a JWT?",
      budgetTokens: 800,
      topK: 5,
      expandHops: 1,
    });

    const sourceIds = result.hits.map((h) => h.record.sourceId);
    expect(sourceIds[0]).toMatch(/login\.ts|skill:authenticate-user/);
    expect(sourceIds).toContain("src/auth/login.ts");
    const stringsIdx = sourceIds.indexOf("src/util/strings.ts");
    const loginIdx = sourceIds.indexOf("src/auth/login.ts");
    expect(loginIdx).toBeLessThan(stringsIdx === -1 ? Infinity : stringsIdx);
  });

  it("packs sections within the token budget", async () => {
    const paths = memoriaPathsFor(projectRoot);
    const config = await loadConfig(paths.configFile);
    const result = await assembleRecall(paths, config, {
      query: "auth",
      budgetTokens: 80,
      topK: 3,
      expandHops: 0,
    });
    expect(result.usedTokens).toBeLessThanOrEqual(result.budgetTokens + 1);
    expect(result.sections[0]?.title).toBe("Query");
  });

  it("KG expansion brings in 1-hop neighbors", async () => {
    const paths = memoriaPathsFor(projectRoot);
    const config = await loadConfig(paths.configFile);
    const result = await assembleRecall(paths, config, {
      query: "login user jwt",
      budgetTokens: 4000,
      topK: 1,
      expandHops: 1,
    });
    expect(result.expandedEntityIds).toContain("src/auth/login.ts");
    expect(result.expandedEntityIds).toContain("src/util/strings.ts");
  });

  it("includes matching briefs and memories in recall context", async () => {
    const paths = memoriaPathsFor(projectRoot);
    const config = await loadConfig(paths.configFile);
    const result = await assembleRecall(paths, config, {
      query: "auth jwt token refresh",
      budgetTokens: 4000,
      topK: 5,
      expandHops: 0,
    });

    expect(result.sections.some((s) => s.title.startsWith("Brief: brief:auth-refresh"))).toBe(true);
    expect(result.sections.some((s) => s.title.startsWith("Memory: memory:refresh-token-policy"))).toBe(true);
  });
});
