import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function colLettersToIndex(col) {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function parseCellRef(ref) {
  const m = ref.match(/^([A-Z]+)(\d+)$/);
  if (!m) return { col: 0, row: 0 };
  return { col: colLettersToIndex(m[1]), row: Number.parseInt(m[2], 10) - 1 };
}

function decodeXml(s) {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function readSharedStrings(zipDir) {
  const p = path.join(zipDir, "xl/sharedStrings.xml");
  if (!fs.existsSync(p)) return [];
  const xml = fs.readFileSync(p, "utf8");
  const strings = [];
  for (const block of xml.match(/<si>([\s\S]*?)<\/si>/g) ?? []) {
    const parts = [...block.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => decodeXml(x[1]));
    strings.push(parts.join(""));
  }
  return strings;
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
  const cellRe =
    /<c r="([A-Z]+\d+)"([^>]*)>([\s\S]*?)<\/c>/g;
  let m;
  while ((m = cellRe.exec(xml))) {
    const { col, row } = parseCellRef(m[1]);
    const attrs = m[2];
    const inner = m[3];
    let val = "";
    if (attrs.includes('t="s"')) {
      const v = inner.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      val = strings[Number.parseInt(v ?? "0", 10)] ?? "";
    } else if (attrs.includes('t="inlineStr"') || inner.includes("<is>")) {
      val = [...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => decodeXml(x[1])).join("");
    } else {
      val = decodeXml(inner.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "");
    }
    if (!rows.has(row)) rows.set(row, []);
    const arr = rows.get(row);
    while (arr.length <= col) arr.push("");
    arr[col] = val.trim();
  }
  return [...rows.entries()].sort((a, b) => a[0] - b[0]).map(([, r]) => r);
}

function unzipXlsx(xlsxPath, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const zipCopy = path.join(outDir, "book.zip");
  fs.copyFileSync(xlsxPath, zipCopy);
  const dest = path.join(outDir, "unzipped");
  fs.mkdirSync(dest, { recursive: true });
  execSync(
    `powershell -NoProfile -Command "Expand-Archive -Path '${zipCopy.replace(/'/g, "''")}' -DestinationPath '${dest.replace(/'/g, "''")}' -Force"`,
    { stdio: "pipe" },
  );
  return dest;
}

const file = process.argv[2];
const tmp = path.join(process.cwd(), ".tmp-parse-xlsx");
const unzipped = unzipXlsx(file, tmp);
const sheets = listSheets(unzipped);
const out = { file: path.basename(file), sheets: {} };
for (const s of sheets) {
  out.sheets[s.name] = readSheetRows(unzipped, s.file);
}
console.log(JSON.stringify(out, null, 2));
