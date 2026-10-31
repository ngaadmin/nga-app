import fs from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const ROOT = process.cwd();
const xlsx = process.argv[2] ?? path.join(process.env.USERPROFILE, "Downloads", "Explorer M1 Lessons 1-4.xlsx");

execSync(`node tools/_parse-xlsx.mjs "${xlsx}" > .tmp-l3-dump.json`, { cwd: ROOT, stdio: "pipe" });
const j = JSON.parse(fs.readFileSync(path.join(ROOT, ".tmp-l3-dump.json"), "utf8"));
const rows = j.sheets["Explorer Phase 1"];
console.log("L3 block rows 17-24:");
for (let i = 17; i < 25; i++) {
  const r = rows[i];
  console.log(`\n=== Screen ${r[1]} ===`);
  console.log("archetype col3:", r[3]);
  console.log("col8:", r[8]);
  console.log("simpleText:", r[4] || "(empty)");
  console.log("action:", r[5]);
  console.log("content:\n", r[6]);
  console.log("error:\n", r[7]);
}
