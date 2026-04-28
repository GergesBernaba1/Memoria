import { describe, it, expect, beforeEach } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { listSourceFiles } from "../src/ingest/walker.js";

async function tmpDir(): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), "memoria-walker-"));
}

async function writeFile(root: string, rel: string, content = "// stub\n"): Promise<void> {
  const abs = path.join(root, rel);
  await fs.mkdir(path.dirname(abs), { recursive: true });
  await fs.writeFile(abs, content, "utf8");
}

describe("walker", () => {
  let root: string;
  beforeEach(async () => {
    root = await tmpDir();
    await writeFile(root, "src/a.ts");
    await writeFile(root, "src/nested/b.ts");
    await writeFile(root, "src/c.tsx");
    await writeFile(root, "src/d.js");
    await writeFile(root, "src/notes.md");
    await writeFile(root, "node_modules/foo/index.js");
    await writeFile(root, "dist/bundle.js");
    await writeFile(root, ".memoria/skills/x.md");
  });

  it("includes by glob and excludes node_modules + dist + .memoria", async () => {
    const files = await listSourceFiles(root, {
      include: ["**/*.ts", "**/*.tsx", "**/*.js"],
      exclude: ["**/node_modules/**", "**/dist/**", "**/.memoria/**"],
    });
    const rels = files.map((f) => f.rel).sort();
    expect(rels).toEqual(["src/a.ts", "src/c.tsx", "src/d.js", "src/nested/b.ts"]);
  });

  it("returns absolute paths that exist", async () => {
    const files = await listSourceFiles(root, {
      include: ["**/*.ts"],
      exclude: ["**/node_modules/**"],
    });
    for (const f of files) {
      expect(path.isAbsolute(f.abs)).toBe(true);
      expect((await fs.stat(f.abs)).isFile()).toBe(true);
    }
  });
});
