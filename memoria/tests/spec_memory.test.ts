import { describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { runInit } from "../src/commands/init.js";
import { memoriaPathsFor } from "../src/core/paths.js";
import { briefChecklist, briefCreate, briefPath } from "../src/commands/brief.js";
import { memoryAdd, memoryDelete, memorySearch, memoryUpdate } from "../src/commands/memory.js";
import { agentInstall } from "../src/commands/agent.js";
import { featureDone, featureFinish, featureList, featurePacket, featureStart, featureStatus } from "../src/commands/feature.js";
import { runDoctor } from "../src/commands/doctor.js";

async function tmpDir(prefix = "memoria-workflow-test-"): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("workflow commands", () => {
  it("initializes briefs, memory, and reports directories", async () => {
    const dir = await tmpDir();
    await runInit({ cwd: dir });
    const paths = memoriaPathsFor(dir);

    for (const p of [paths.briefsDir, paths.memoryDir, paths.reportsDir, paths.savingsReportsDir]) {
      expect((await fs.stat(p)).isDirectory()).toBe(true);
    }
  });

  it("creates one compact brief file and updates path/checklist sections", async () => {
    const dir = await tmpDir();
    await runInit({ cwd: dir });

    const brief = await briefCreate("Token Saving Workflow", {
      cwd: dir,
      description: "Create low-token development flow.",
    });
    const pathFile = await briefPath("Token Saving Workflow", { cwd: dir });
    const checklist = await briefChecklist("Token Saving Workflow", { cwd: dir });

    expect(pathFile).toBe(brief);
    expect(checklist).toBe(brief);
    await expect(fs.readFile(brief, "utf8")).resolves.toContain("Create low-token development flow.");
    await expect(fs.readFile(brief, "utf8")).resolves.toContain("## Path");
    await expect(fs.readFile(brief, "utf8")).resolves.toContain("## Checklist");
  });

  it("adds and searches memory records", async () => {
    const dir = await tmpDir();
    await runInit({ cwd: dir });

    await memoryAdd("decision", "Use recall before implementation to save tokens.", {
      cwd: dir,
      title: "Recall first",
      tags: ["tokens"],
    });

    const hits = await memorySearch("recall tokens", { cwd: dir, json: true });
    expect(hits).toHaveLength(1);
    expect(hits[0]?.type).toBe("decision");
    expect(hits[0]?.title).toBe("Recall first");
  });

  it("updates and deletes memory records", async () => {
    const dir = await tmpDir();
    await runInit({ cwd: dir });

    await memoryAdd("note", "Old text", { cwd: dir, title: "Mutable memory" });
    let hits = await memorySearch("mutable", { cwd: dir, json: true });
    const id = hits[0]!.id;

    await memoryUpdate(id, { cwd: dir, text: "New durable decision text", type: "decision" });
    hits = await memorySearch("durable decision", { cwd: dir, json: true });
    expect(hits[0]?.id).toBe(id);
    expect(hits[0]?.type).toBe("decision");

    await memoryDelete(id, { cwd: dir, yes: true });
    hits = await memorySearch("durable decision", { cwd: dir, json: true });
    expect(hits).toHaveLength(0);
  });

  it("installs agent slash-command guides", async () => {
    const dir = await tmpDir();
    await runInit({ cwd: dir });

    const files = await agentInstall("all", { cwd: dir });
    const paths = memoriaPathsFor(dir);

    expect(files).toHaveLength(45);
    await expect(fs.readFile(path.join(paths.agentsDir, "README.md"), "utf8")).resolves.toContain(
      "Memoria Agent Guides",
    );
    await expect(fs.readFile(path.join(paths.agentsDir, "claude.md"), "utf8")).resolves.toContain(
      "/memoria.recall",
    );
    await expect(fs.readFile(path.join(paths.agentsDir, "codex.md"), "utf8")).resolves.toContain(
      'memoria recall "<task>" --budget 4000 --explain',
    );
    await expect(fs.readFile(path.join(dir, ".claude", "commands", "memoria.recall.md"), "utf8")).resolves.toContain(
      'memoria recall "$ARGUMENTS" --budget 4000 --explain',
    );
    await expect(fs.readFile(path.join(dir, ".github", "prompts", "memoria.recall.prompt.md"), "utf8")).resolves.toContain(
      'memoria recall "<arguments>" --budget 4000 --explain',
    );
    await expect(fs.readFile(path.join(dir, "AGENTS.md"), "utf8")).resolves.toContain(
      "Codex currently exposes built-in slash commands and skills",
    );
  });

  it("manages a feature memory packet", async () => {
    const dir = await tmpDir();
    await runInit({ cwd: dir });

    const brief = await featureStart("Password Reset", {
      cwd: dir,
      description: "Add reset email flow.",
      recall: false,
    });
    await expect(fs.readFile(brief, "utf8")).resolves.toContain("Add reset email flow.");

    let status = await featureStatus("Password Reset", { cwd: dir, json: true });
    expect(status.slug).toBe("password-reset");
    expect(status.checklist.total).toBe(5);
    expect(status.relatedMemories).toBe(0);

    const features = await featureList({ cwd: dir, json: true });
    expect(features.map((feature) => feature.slug)).toContain("password-reset");

    status = await featureDone("Password Reset", "1", { cwd: dir, json: true });
    expect(status.checklist.done).toBe(1);

    await featureFinish("Password Reset", {
      cwd: dir,
      decision: "Password reset tokens expire after 15 minutes.",
      ingest: false,
      savings: false,
    });

    status = await featureStatus("Password Reset", { cwd: dir, json: true });
    expect(status.relatedMemories).toBe(1);

    const packet = await featurePacket("Password Reset", { cwd: dir, json: true });
    expect(packet.brief).toContain("Add reset email flow.");
    expect(packet.memories).toHaveLength(1);
  });

  it("reports workspace health", async () => {
    const dir = await tmpDir();
    await runInit({ cwd: dir });

    const report = await runDoctor({ cwd: dir, json: true });
    expect(report.projectRoot).toBe(dir);
    expect(report.checks.some((check) => check.name === "config" && check.ok)).toBe(true);
    expect(report.checks.some((check) => check.name === "brief count")).toBe(true);
  });
});
