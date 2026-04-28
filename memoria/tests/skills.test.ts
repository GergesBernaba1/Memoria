import { describe, it, expect, beforeEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { parseSkill, stringifySkill } from "../src/skills/parser.js";
import { newSkillFromTemplate } from "../src/skills/template.js";
import {
  SkillStore,
  SkillNotFoundError,
  SkillAlreadyExistsError,
} from "../src/skills/store.js";

async function tmpDir(prefix = "memoria-test-"): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

describe("parseSkill", () => {
  it("round-trips frontmatter + body", () => {
    const skill = newSkillFromTemplate({ name: "round-trip", description: "test" });
    const text = stringifySkill(skill);
    const parsed = parseSkill(text);
    expect(parsed.frontmatter.skill_name).toBe("round-trip");
    expect(parsed.frontmatter.description).toBe("test");
    expect(parsed.frontmatter.version).toBe("0.1.0");
    expect(parsed.body).toContain("## Purpose");
  });

  it("rejects missing required fields", () => {
    const bad = `---\nskill_name: foo\n---\nbody`;
    expect(() => parseSkill(bad)).toThrow();
  });

  it("rejects invalid skill names", () => {
    const bad = `---\nskill_name: BadName\nversion: 0.1.0\ndescription: x\n---\nbody`;
    expect(() => parseSkill(bad)).toThrow();
  });

  it("rejects malformed versions", () => {
    const bad = `---\nskill_name: ok\nversion: latest\ndescription: x\n---\nbody`;
    expect(() => parseSkill(bad)).toThrow();
  });
});

describe("SkillStore", () => {
  let dir: string;
  let store: SkillStore;

  beforeEach(async () => {
    dir = await tmpDir();
    store = new SkillStore(dir);
  });

  it("create + get + list + delete lifecycle", async () => {
    const skill = newSkillFromTemplate({ name: "lifecycle", description: "x" });
    await store.create(skill);
    expect(await store.exists("lifecycle")).toBe(true);

    const got = await store.get("lifecycle");
    expect(got.frontmatter.skill_name).toBe("lifecycle");

    const all = await store.list();
    expect(all.map((s) => s.frontmatter.skill_name)).toEqual(["lifecycle"]);

    await store.delete("lifecycle");
    expect(await store.exists("lifecycle")).toBe(false);
  });

  it("create throws on duplicate", async () => {
    const skill = newSkillFromTemplate({ name: "dup" });
    await store.create(skill);
    await expect(store.create(skill)).rejects.toBeInstanceOf(SkillAlreadyExistsError);
  });

  it("get throws on missing", async () => {
    await expect(store.get("nope")).rejects.toBeInstanceOf(SkillNotFoundError);
  });

  it("list sorts by name", async () => {
    await store.create(newSkillFromTemplate({ name: "zeta" }));
    await store.create(newSkillFromTemplate({ name: "alpha" }));
    await store.create(newSkillFromTemplate({ name: "mu" }));
    const all = await store.list();
    expect(all.map((s) => s.frontmatter.skill_name)).toEqual(["alpha", "mu", "zeta"]);
  });
});
