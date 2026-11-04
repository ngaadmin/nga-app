/**
 * Regenerates content/launchpad/dog-walking.load.json from the bronze task
 * tracker (L1 and L2 rows), validates it, and checks the payload it makes over
 * the seed. Writes local files only; it never talks to a database.
 *
 *   npx tsx tools/launchpad-load-from-xlsx.ts            # write the load file
 *   npx tsx tools/launchpad-load-from-xlsx.ts --check    # fail if it is stale
 *   npx tsx tools/launchpad-load-from-xlsx.ts --rows out.json   # also write export rows
 *   npx tsx tools/launchpad-load-from-xlsx.ts --check --tracker other.xlsx
 *     # check another tracker workbook builds the same load (source block ignored; never writes)
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { launchpadSeedBase } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { buildDogWalkingLoad } from "@/lib/launchpad/load/dog-walking-load";
import { loadExportRows } from "@/lib/launchpad/load/export-rows";
import { DOG_WALKING_LOAD_PATH, LAUNCHPAD_TRACKER_SOURCE } from "@/lib/launchpad/load/paths";
import { LAUNCHPAD_TRACKER_PATH, readTracker } from "@/lib/launchpad/load/read-tracker";
import { validateLoad } from "@/lib/launchpad/load/validate-load";

const args = process.argv.slice(2);
const trackerAt = args.indexOf("--tracker");
const trackerPath = trackerAt !== -1 && args[trackerAt + 1] ? path.resolve(args[trackerAt + 1]!) : undefined;
if (trackerPath && !args.includes("--check")) {
  console.error("--tracker is only supported with --check.");
  process.exit(1);
}
const bytes = readFileSync(trackerPath ?? LAUNCHPAD_TRACKER_PATH);
const md5 = createHash("md5").update(bytes).digest("hex");
const { load, issues } = buildDogWalkingLoad(readTracker(bytes, 2), { file: LAUNCHPAD_TRACKER_SOURCE, md5 });
const { problems } = validateLoad(load, launchpadSeedBase(load.ventureId));
for (const i of issues) console.error(`tracker row ${i.row}: ${i.reason}`);
for (const p of problems) console.error(`${p.where}: ${p.reason}`);
if (issues.length || problems.length) process.exit(1);

const json = `${JSON.stringify(load, null, 2)}\n`;
const out = path.join(process.cwd(), DOG_WALKING_LOAD_PATH);
if (args.includes("--check")) {
  const current = readFileSync(out, "utf8");
  const committed = JSON.parse(current) as typeof load;
  const same = trackerPath
    ? JSON.stringify({ ...load, source: committed.source }) === JSON.stringify(committed)
    : current === json;
  if (!same) {
    console.error(`${DOG_WALKING_LOAD_PATH} is stale. Run npx tsx tools/launchpad-load-from-xlsx.ts`);
    process.exit(1);
  }
  console.log(trackerPath ? `${trackerPath} builds the same load as ${DOG_WALKING_LOAD_PATH} (source block ignored).` : `${DOG_WALKING_LOAD_PATH} is up to date.`);
} else {
  writeFileSync(out, json);
  console.log(`Wrote ${DOG_WALKING_LOAD_PATH} (tracker md5 ${md5})`);
}
const rowsAt = args.indexOf("--rows");
if (rowsAt !== -1 && args[rowsAt + 1]) {
  writeFileSync(args[rowsAt + 1]!, JSON.stringify(loadExportRows(load), null, 2));
  console.log(`Wrote ${args[rowsAt + 1]}`);
}
