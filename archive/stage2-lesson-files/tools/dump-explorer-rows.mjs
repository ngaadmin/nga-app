#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const xlsx =
  process.argv[2] ??
  path.join(process.env.USERPROFILE ?? "", "Downloads", "Explorer M1 Lessons 1-4.xlsx");

const ROOT = process.cwd();
const tmp = path.join(ROOT, ".tmp-dump-xlsx");
fs.mkdirSync(tmp, { recursive: true });
const zipCopy = path.join(tmp, "wb.zip");
fs.copyFileSync(xlsx, zipCopy);
const dest = path.join(tmp, "wb");
fs.mkdirSync(dest, { recursive: true });
execSync(
  `powershell -NoProfile -Command "Expand-Archive -Path '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${dest.replace(/'/g, "''")}' -Force"`,
  { stdio: "pipe" },
);

function readSharedStrings(zipDir) {
  const p = path.join(zipDir, "xl/sharedStrings.xml");
  const xml = fs.readFileSync(p, "utf8");
  const strings = [];
  for (const block of xml.match(/<si>([\s\S]*?)<\/si>/g) ?? []) {
    const parts = [...block.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]);
    strings.push(parts.join(""));
  }
  return strings;
}

function parseCellRef(ref) {
  const m = ref.match(/^([A-Z]+)(\d+)$/);
  const col = [...m[1]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
  return { col, row: Number.parseInt(m[2], 10) - 1 };
}

function listSheets(zipDir) {
  const wb = fs.readFileSync(path.join(zipDir, "xl/workbook.xml"), "utf8");
  const rels = fs.readFileSync(path.join(zipDir, "xl/_rels/workbook.xml.rels"), "utf8");
  const relMap = {};
  for (const m of rels.matchAll(/Id="([^"]+)"[^>]+Target="([^"]+)"/g)) {
    relMap[m[1]] = m[2].replace(/^\.\.\//, "xl/");
  }
  const sheets = [];
  for (const m of wb.matchAll(/<sheet[^>]+name="([^"]+)"[^>]+r:id="([^"]+)"/g)) {
    const target = relMap[m[2]] ?? "";
    const file = target.startsWith("xl/") ? target : `xl/${target.replace(/^\.\.\//, "")}`;
    sheets.push({ name: m[1], file });
  }
  return sheets;
}

function readSheetRows(zipDir, sheetFile) {
  const strings = readSharedStrings(zipDir);
  const xml = fs.readFileSync(path.join(zipDir, sheetFile), "utf8");
  const rows = new Map();
  const cellRe = /<c r="([A-Z]+\d+)"([^>]*)>([\s\S]*?)<\/c>/g;
  let m;
  while ((m = cellRe.exec(xml))) {
    const { col, row } = parseCellRef(m[1]);
    const attrs = m[2];
    const inner = m[3];
    let val = "";
    if (attrs.includes('t="s"')) {
      const v = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      val = strings[Number.parseInt(v ?? "0", 10)] ?? "";
    } else {
      val = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
    }
    if (!rows.has(row)) rows.set(row, []);
    const arr = rows.get(row);
    while (arr.length <= col) arr.push("");
    arr[col] = val.trim();
  }
  return [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => r);
}

const sheets = listSheets(dest);
const sheet = sheets.find((s) => s.name === "Explorer Phase 1");
const all = readSheetRows(dest, sheet.file);
const start = Number.parseInt(process.argv[3] ?? "16", 10);
const end = Number.parseInt(process.argv[4] ?? "32", 10);

console.log("Sheet:", sheet.name, "rows:", all.length);
for (let i = start; i < Math.min(end, all.length); i += 1) {
  const r = all[i];
  console.log(`\n=== Row ${i + 1} ===`);
  const labels = ["lessonId", "screen", "objective", "archetype", "text", "action", "content", "error"];
  labels.forEach((label, idx) => {
    console.log(`${label}:`, JSON.stringify(r[idx] ?? ""));
  });
}
