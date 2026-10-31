import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const file = process.argv[2];
const out = path.join(process.cwd(), ".tmp-parse-out.json");
execSync(`node tools/_parse-xlsx.mjs "${file}"`, { stdio: ["ignore", fs.openSync(out, "w"), "inherit"] });
const j = JSON.parse(fs.readFileSync(out, "utf8"));
console.log(JSON.stringify({ sheets: Object.keys(j.sheets), rowCounts: Object.fromEntries(Object.entries(j.sheets).map(([k,v])=>[k,v.length])) }, null, 2));
for (const [name, rows] of Object.entries(j.sheets)) {
  console.log(`\n=== ${name} ===`);
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const r = rows[i];
    const id = r[0] || "";
    if (String(id).includes("L3") || String(id).includes("3-M1") || (i >= 16 && i <= 24)) {
      console.log(i, id, r[1], r[3]?.slice?.(0,40), (r[4]||"").slice(0,60));
    }
  }
}
