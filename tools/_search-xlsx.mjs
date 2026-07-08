import fs from "node:fs";
import { execSync } from "node:child_process";

const files = process.argv.slice(2);
const pattern = /Mia|Keep Some|Spare Cash|headphones|squishy|"106"|"109"|"119"|"122"|"97"|"101"/i;

for (const f of files) {
  const out = ".tmp-search.json";
  const fd = fs.openSync(out, "w");
  execSync(`node tools/_parse-xlsx.mjs "${f}"`, { stdio: ["ignore", fd, "pipe"] });
  fs.closeSync(fd);
  const j = JSON.parse(fs.readFileSync(out, "utf8"));
  for (const [name, rows] of Object.entries(j.sheets)) {
    for (let i = 0; i < rows.length; i++) {
      const s = JSON.stringify(rows[i]);
      if (pattern.test(s)) {
        console.log(`\n${f.split(/[/\\]/).pop()} | ${name} | row ${i}`);
        console.log(s.slice(0, 600));
      }
    }
  }
}
