import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const file = process.argv[2];
const out = path.join(process.cwd(), ".tmp-parse-out.json");
const fd = fs.openSync(out, "w");
execSync(`node tools/_parse-xlsx.mjs "${file}"`, { stdio: ["ignore", fd, "inherit"] });
fs.closeSync(fd);
const j = JSON.parse(fs.readFileSync(out, "utf8"));

const ids = process.argv.slice(3).map(String);
for (const [name, rows] of Object.entries(j.sheets)) {
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const hit = ids.some((id) => r.some((cell) => String(cell).trim() === id));
    if (hit) {
      console.log(`\n[${name}] row ${i}:`, JSON.stringify(r, null, 0).slice(0, 800));
    }
  }
}
