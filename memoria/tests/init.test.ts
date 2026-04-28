import { describe, it, expect, beforeEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { runInit } from "../src/commands/init.js";
import { memoriaPathsFor } from "../src/core/paths.js";
import { loadConfig } from "../src/core/config.js";
import { findWorkspace } from "../src/core/workspace.js";

async function tmpDir(prefix = "memoria-init-test-"): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("runInit", () => {
  let dir: string;
  beforeEach(async () => {
    dir = await tmpDir();
  });

  it("creates the .memoria layout", async () => {
    await runInit({ cwd: dir, projectName: "demo" });
    const paths = memoriaPathsFor(dir);

    for (const p of [
      paths.root,
      paths.skillsDir,
      paths.agentsDir,
      paths.kgDir,
      paths.kgSummariesDir,
      paths.embeddingsDir,
    ]) {
      expect((await fs.stat(p)).isDirectory()).toBe(true);
    }

    for (const f of [
      paths.configFile,
      paths.readmeFile,
      paths.kgEntitiesFile,
      paths.kgRelationshipsFile,
      paths.embeddingsIndexFile,
      paths.embeddingsCodeFile,
      paths.embeddingsSkillFile,
      paths.embeddingsContextFile,
    ]) {
      expect((await fs.stat(f)).isFile()).toBe(true);
    }

    const cfg = await loadConfig(paths.configFile);
    expect(cfg.projectName).toBe("demo");
    expect(cfg.version).toBe(1);
    expect(cfg.defaultModel).toBeTruthy();
  });

  it("refuses to overwrite without --force", async () => {
    await runInit({ cwd: dir });
    await expect(runInit({ cwd: dir })).rejects.toThrow(/already exists/);
  });

  it("overwrites with --force", async () => {
    await runInit({ cwd: dir, projectName: "first" });
    await runInit({ cwd: dir, projectName: "second", force: true });
    const cfg = await loadConfig(memoriaPathsFor(dir).configFile);
    expect(cfg.projectName).toBe("second");
  });

  it("findWorkspace locates an initialized dir from a subdir", async () => {
    await runInit({ cwd: dir });
    const sub = path.join(dir, "src", "deep");
    await fs.mkdir(sub, { recursive: true });
    const ws = await findWorkspace(sub);
    expect(ws).not.toBeNull();
    expect(ws!.projectRoot).toBe(path.resolve(dir));
  });
});
