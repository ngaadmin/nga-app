import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * Learner-facing copy belongs in the venture payload (the bundled seed now,
 * the database when LAUNCHPAD_CONTENT_DB is on), not in a screen or a logic file.
 *
 * Payload files are the modules that place those strings onto the payload.
 * They are listed here on purpose. A new copy file has to be added to the list.
 */
const ROOTS = ["components/launchpad/venture", "components/launchpad/venture-test", "lib/launchpad/content"];

const PAYLOAD_FILES = new Set([
  // Seed and the objects the seed embeds.
  "lib/launchpad/content/level-up/content.ts",
  "lib/launchpad/content/level-up/screens.ts",
  "lib/launchpad/content/surface-copy.ts",
  "lib/launchpad/content/budgeting/copy.ts",
  "lib/launchpad/content/budgeting/screens.ts",
  "lib/launchpad/content/budgeting/workbook.ts",
  "lib/launchpad/content/sales/copy.ts",
  "lib/launchpad/content/sales/screens.ts",
  "lib/launchpad/content/sales/workbook-sheets.ts",
  "lib/launchpad/content/getting-ready/copy.ts",
  "lib/launchpad/content/getting-ready/screens.ts",
  "lib/launchpad/content/getting-ready/workbook-sheets.ts",
  "lib/launchpad/content/planning/screens.ts",
  "lib/launchpad/content/planning/funding.ts",
  "lib/launchpad/content/planning/catalog.ts",
  "lib/launchpad/content/pricing/screens.ts",
  "lib/launchpad/content/know-your-cost/dog-walking-fixture.ts",
  "lib/launchpad/content/service-level-outcomes.ts",
  "lib/launchpad/content/vision.ts",
  "lib/launchpad/content/identity-content.ts",
  "lib/launchpad/content/scripted-sheet.ts",
]);

/**
 * Strings that match the detector but are not learner copy.
 * Add a row only when the string is never shown to a learner.
 */
const ALLOWLIST: readonly { file: string; text: string; why: string }[] = [
  { file: "lib/launchpad/content/check-payload.ts", text: "NGA", why: "Name of a banned token in the payload validator. Never shown to a learner." },
  { file: "lib/launchpad/content/check-payload.ts", text: "XP", why: "Name of a banned token in the payload validator. Never shown to a learner." },
];

/** Props whose string value is read by a learner, including screen-reader names. */
const COPY_PROPS = new Set([
  "title",
  "label",
  "placeholder",
  "placeholderText",
  "aria-label",
  "ariaLabel",
  "lead",
  "heading",
  "prompt",
  "alt",
  "subtitle",
  "hint",
  "guidance",
  "question",
  "body",
  "note",
  "intro",
  "description",
  "buttonLabel",
  "ctaLabel",
  "caption",
  "credit",
  "summary",
  "text",
  "message",
  "current",
  "before",
  "after",
]);

function words(value: string): string[] {
  return value
    .replace(/&apos;|&#39;/g, "'")
    .trim()
    .split(/\s+/)
    .filter((part) => /[A-Za-z]/.test(part));
}

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "seed") continue;
      walk(full, out);
    } else if (/\.(ts|tsx)$/.test(name) && !name.includes(".test.") && !name.includes(".spec.")) {
      out.push(full);
    }
  }
  return out;
}

function literal(node: ts.Node | undefined): string | null {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return null;
}

function templateStatic(node: ts.TemplateLiteral): string {
  if (ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  return node.head.text + node.templateSpans.map((span) => span.literal.text).join(" ");
}

type Hit = { file: string; line: number; text: string };

function collect(file: string, source: ts.SourceFile): Hit[] {
  const rel = path.relative(process.cwd(), file).split(path.sep).join("/");
  const hits: Hit[] = [];
  const allowed = new Set(ALLOWLIST.filter((row) => row.file === rel).map((row) => row.text));
  const push = (node: ts.Node, text: string) => {
    const clean = text.replace(/\s+/g, " ").trim();
    if (!clean || allowed.has(clean) || allowed.has(text)) return;
    if (/(?:^|\s)(?:text-|font-|bg-|mt-|px-|flex|rounded-|shadow|border|items-|justify-|leading-|gap-|w-|h-|size-|min-h|max-h|inset|outline|tracking|tabular|shrink|whitespace|placeholder:)/.test(clean)) return;
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    const key = `${line}:${clean}`;
    if (hits.some((hit) => `${hit.line}:${hit.text}` === key)) return;
    hits.push({ file: rel, line, text: clean });
  };
  const inCopyProp = (node: ts.Node): boolean => {
    const parent = node.parent;
    if (!parent) return false;
    if (ts.isJsxAttribute(parent) && parent.initializer === node) return COPY_PROPS.has(parent.name.getText(source));
    if (ts.isPropertyAssignment(parent) && parent.initializer === node && ts.isIdentifier(parent.name)) return COPY_PROPS.has(parent.name.text);
    return false;
  };
  const visitJsxChild = (node: ts.Node) => {
    if (ts.isJsxElement(node) || ts.isJsxFragment(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxAttribute(node)) return;
    const direct = literal(node);
    if (direct && words(direct).length >= 2 && !/^(?:\{[\w-]+\}\s*)+$/.test(direct)) push(node, direct);
    if (ts.isTemplateExpression(node) && words(templateStatic(node)).length >= 2) push(node, templateStatic(node));
    ts.forEachChild(node, (child) => {
      if (ts.isBinaryExpression(child) && (child.operatorToken.kind === ts.SyntaxKind.EqualsEqualsEqualsToken || child.operatorToken.kind === ts.SyntaxKind.EqualsEqualsToken || child.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsEqualsToken || child.operatorToken.kind === ts.SyntaxKind.ExclamationEqualsToken)) {
        return;
      }
      visitJsxChild(child);
    });
  };
  const visit = (node: ts.Node) => {
    if (ts.isJsxText(node) && words(node.getText(source)).length >= 2) push(node, node.getText(source));
    if (ts.isJsxExpression(node) && node.expression && node.parent && !ts.isJsxAttribute(node.parent)) visitJsxChild(node.expression);
    if (ts.isJsxAttribute(node) && COPY_PROPS.has(node.name.getText(source)) && node.initializer) {
      if (ts.isStringLiteral(node.initializer)) {
        if (node.initializer.text !== "") push(node.initializer, node.initializer.text);
      } else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) {
        const expr = node.initializer.expression;
        const direct = literal(expr);
        if (direct && direct !== "") push(expr, direct);
        if (ts.isTemplateExpression(expr) && words(templateStatic(expr)).length >= 2) push(expr, templateStatic(expr));
      }
    }
    if (ts.isPropertyAssignment(node) && ts.isIdentifier(node.name) && COPY_PROPS.has(node.name.text)) {
      const text = literal(node.initializer);
      if (text && text !== "") push(node.initializer, text);
    }
    if (!inCopyProp(node)) ts.forEachChild(node, visit);
    else if (ts.isJsxAttribute(node) || ts.isPropertyAssignment(node)) ts.forEachChild(node, visit);
  };
  visit(source);
  return hits;
}

export function learnerCopyHits(): Hit[] {
  const files = ROOTS.flatMap((rel) => walk(path.join(process.cwd(), rel)));
  const hits: Hit[] = [];
  for (const file of files) {
    const rel = path.relative(process.cwd(), file).split(path.sep).join("/");
    if (rel.startsWith("lib/launchpad/content/seed/")) continue;
    if (PAYLOAD_FILES.has(rel)) continue;
    const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    hits.push(...collect(file, source));
  }
  return hits;
}

describe("learner-facing copy stays in the payload", () => {
  it("finds no learner copy in screens or content logic", () => {
    const hits = learnerCopyHits();
    expect(hits.map((hit) => `${hit.file}:${hit.line} ${JSON.stringify(hit.text)}`).join("\n")).toBe("");
  });

  it("keeps the allowlist explicit", () => {
    expect(ALLOWLIST.map((row) => `${row.file} ${JSON.stringify(row.text)} ${row.why}`)).toEqual([
      'lib/launchpad/content/check-payload.ts "NGA" Name of a banned token in the payload validator. Never shown to a learner.',
      'lib/launchpad/content/check-payload.ts "XP" Name of a banned token in the payload validator. Never shown to a learner.',
    ]);
  });
});
