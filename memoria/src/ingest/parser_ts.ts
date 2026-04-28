import ts from "typescript";
import path from "node:path";
import type { Entity, EntityKind, Relationship } from "../kg/types.js";

export interface ParseResult {
  entities: Entity[];
  relationships: Relationship[];
}

/**
 * Parse a single TS/JS file into KG entities and relationships.
 *
 * - The file itself is a `module` entity with id `<rel>`.
 * - Top-level functions, classes, interfaces, types, and exported
 *   const/let/var become symbol entities with id `<rel>#<symbolName>`.
 * - Each symbol gets `(file_module) -[exports]-> (symbol)` if exported,
 *   else `(file_module) -[references]-> (symbol)`.
 * - Each `import "foo"` adds `(file_module) -[imports]-> (target_module)`,
 *   where `target_module` is either a relative path resolved against the
 *   file (with `<rel>` form) or `pkg:<bare-spec>` for bare imports.
 * - `extends` and `implements` produce relationships when the LHS is a
 *   class/interface in the same file.
 */
export function parseTsFile(opts: {
  /** Absolute file path. */
  abs: string;
  /** Project-root-relative path (forward slashes). */
  rel: string;
  /** File contents. */
  source: string;
}): ParseResult {
  const { rel, source } = opts;
  const scriptKind = scriptKindFor(rel);
  const sf = ts.createSourceFile(rel, source, ts.ScriptTarget.Latest, true, scriptKind);

  const entities: Entity[] = [];
  const relationships: Relationship[] = [];
  const now = new Date().toISOString();

  // The file itself
  const moduleId = rel;
  entities.push({
    id: moduleId,
    kind: "module",
    name: path.basename(rel),
    file: rel,
    range: { startLine: 1, endLine: lineOf(sf, source.length - 1) },
    meta: { language: scriptKind === ts.ScriptKind.JS || scriptKind === ts.ScriptKind.JSX ? "js" : "ts" },
    updatedAt: now,
  });

  for (const stmt of sf.statements) {
    visitTopLevel(stmt);
  }

  function visitTopLevel(node: ts.Node): void {
    if (ts.isImportDeclaration(node)) {
      const spec = node.moduleSpecifier;
      if (ts.isStringLiteral(spec)) {
        const targetId = resolveImportId(rel, spec.text);
        relationships.push({
          fromId: moduleId,
          toId: targetId,
          kind: "imports",
          meta: { file: rel, raw: spec.text },
        });
      }
      return;
    }

    if (ts.isFunctionDeclaration(node) && node.name) {
      addSymbol(node, "function", node.name.text, isExported(node));
      return;
    }
    if (ts.isClassDeclaration(node) && node.name) {
      addSymbol(node, "class", node.name.text, isExported(node));
      addHeritage(node.name.text, node);
      return;
    }
    if (ts.isInterfaceDeclaration(node)) {
      addSymbol(node, "interface", node.name.text, isExported(node));
      addInterfaceHeritage(node.name.text, node);
      return;
    }
    if (ts.isTypeAliasDeclaration(node)) {
      addSymbol(node, "type", node.name.text, isExported(node));
      return;
    }
    if (ts.isVariableStatement(node)) {
      const exported = isExported(node);
      for (const decl of node.declarationList.declarations) {
        if (ts.isIdentifier(decl.name)) {
          addSymbol(node, "variable", decl.name.text, exported);
        }
      }
      return;
    }
    if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
      for (const e of node.exportClause.elements) {
        const name = e.name.text;
        const id = symbolId(rel, name);
        relationships.push({
          fromId: moduleId,
          toId: id,
          kind: "exports",
          meta: { file: rel, reexport: !!node.moduleSpecifier },
        });
      }
      return;
    }
  }

  function addSymbol(node: ts.Node, kind: EntityKind, name: string, exported: boolean): void {
    const id = symbolId(rel, name);
    const start = node.getStart(sf);
    const end = node.getEnd();
    entities.push({
      id,
      kind,
      name,
      file: rel,
      range: { startLine: lineOf(sf, start), endLine: lineOf(sf, end) },
      meta: { exported },
      updatedAt: now,
    });
    relationships.push({
      fromId: moduleId,
      toId: id,
      kind: exported ? "exports" : "references",
      meta: { file: rel },
    });
  }

  function addHeritage(className: string, node: ts.ClassDeclaration): void {
    if (!node.heritageClauses) return;
    const fromId = symbolId(rel, className);
    for (const clause of node.heritageClauses) {
      const kind: "extends" | "implements" =
        clause.token === ts.SyntaxKind.ImplementsKeyword ? "implements" : "extends";
      for (const t of clause.types) {
        const targetName = ts.isIdentifier(t.expression) ? t.expression.text : t.expression.getText(sf);
        relationships.push({
          fromId,
          toId: symbolId(rel, targetName),
          kind,
          meta: { file: rel, sameFileGuess: true },
        });
      }
    }
  }

  function addInterfaceHeritage(name: string, node: ts.InterfaceDeclaration): void {
    if (!node.heritageClauses) return;
    const fromId = symbolId(rel, name);
    for (const clause of node.heritageClauses) {
      for (const t of clause.types) {
        const targetName = ts.isIdentifier(t.expression) ? t.expression.text : t.expression.getText(sf);
        relationships.push({
          fromId,
          toId: symbolId(rel, targetName),
          kind: "extends",
          meta: { file: rel, sameFileGuess: true },
        });
      }
    }
  }

  return { entities, relationships };
}

function symbolId(rel: string, name: string): string {
  return `${rel}#${name}`;
}

function isExported(node: ts.Node): boolean {
  // ts.canHaveModifiers is the recommended type-narrow; ts.getModifiers is the
  // accessor that works across emit targets.
  if (!ts.canHaveModifiers(node)) return false;
  const mods = ts.getModifiers(node);
  return !!mods?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
}

function lineOf(sf: ts.SourceFile, pos: number): number {
  if (pos < 0) return 1;
  const { line } = sf.getLineAndCharacterOfPosition(pos);
  return line + 1;
}

function scriptKindFor(rel: string): ts.ScriptKind {
  const ext = path.extname(rel).toLowerCase();
  switch (ext) {
    case ".tsx":
      return ts.ScriptKind.TSX;
    case ".jsx":
      return ts.ScriptKind.JSX;
    case ".js":
    case ".mjs":
    case ".cjs":
      return ts.ScriptKind.JS;
    default:
      return ts.ScriptKind.TS;
  }
}

function resolveImportId(fromRel: string, spec: string): string {
  if (spec.startsWith(".") || spec.startsWith("/")) {
    // Relative or absolute (within the project) import — resolve against `fromRel`.
    const fromDir = path.posix.dirname(fromRel.replace(/\\/g, "/"));
    const joined = path.posix.normalize(`${fromDir}/${spec.replace(/\\/g, "/")}`);
    // The imported module's id matches the convention used for entities,
    // even if we can't tell the exact file extension here. Strip any trailing
    // `.js` so TS-style imports resolve cleanly.
    return joined.replace(/\.js$/, "");
  }
  return `pkg:${spec}`;
}
