/**
 * Regenerates content/launchpad/dog-walking.load.json from:
 *   - Final Service Business Framework (Module 1 rows 2–14)
 *   - Bronze task tracker (Level 2 product screens — keep working)
 * Validates the load over the seed. Writes local files only.
 *
 *   npx tsx tools/launchpad-load-from-xlsx.ts            # write the load file
 *   npx tsx tools/launchpad-load-from-xlsx.ts --check    # fail if it is stale
 *   npx tsx tools/launchpad-load-from-xlsx.ts --rows out.json
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { launchpadSeedBase } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { buildDogWalkingLoad } from "@/lib/launchpad/load/dog-walking-load";
import { loadExportRows } from "@/lib/launchpad/load/export-rows";
import {
  DOG_WALKING_LOAD_PATH,
  LAUNCHPAD_FRAMEWORK_SOURCE,
  LAUNCHPAD_TRACKER_SOURCE,
} from "@/lib/launchpad/load/paths";
import {
  LAUNCHPAD_FRAMEWORK_PATH,
  LAUNCHPAD_FRAMEWORK_SHEET,
  readFramework,
} from "@/lib/launchpad/load/read-framework";
import { LAUNCHPAD_TRACKER_PATH, readTracker } from "@/lib/launchpad/load/read-tracker";
import { validateLoad } from "@/lib/launchpad/load/validate-load";
import type { TrackerRead, TrackerRow } from "@/lib/launchpad/load/read-tracker";

const args = process.argv.slice(2);

const frameworkBytes = readFileSync(LAUNCHPAD_FRAMEWORK_PATH);
const frameworkMd5 = createHash("md5").update(frameworkBytes).digest("hex");
const framework = readFramework(frameworkBytes, 1); // Module 1 only

const trackerBytes = readFileSync(LAUNCHPAD_TRACKER_PATH);
const tracker = readTracker(trackerBytes, 2);
// Keep current product screens only; identity moved to Module 1 The Brand (framework).
const l2Rows = tracker.rows.filter(
  (r) => r.level === 2 && /product and its buyers/i.test(r.silver),
);

// Hybrid read: framework Module 1 + tracker Level 2.
const hybrid: TrackerRead = {
  rows: [...framework.rows.filter((r) => r.level === 1), ...l2Rows] as TrackerRow[],
  notes: [
    ...framework.notes,
    ...tracker.notes,
    {
      date: "5 Nov 2026",
      note: `Hybrid: Module 1 from ${LAUNCHPAD_FRAMEWORK_SOURCE}; Level 2 from ${LAUNCHPAD_TRACKER_SOURCE}.`,
    },
  ],
  issues: [...framework.issues, ...tracker.issues],
};

const { load, issues } = buildDogWalkingLoad(hybrid, {
  file: LAUNCHPAD_FRAMEWORK_SOURCE,
  md5: frameworkMd5,
  sheet: LAUNCHPAD_FRAMEWORK_SHEET,
  visionTemplateFromHandbook: framework.visionTemplateFromHandbook,
});
const { problems } = validateLoad(load, launchpadSeedBase(load.ventureId));
for (const i of issues) console.error(`row ${i.row}: ${i.reason}`);
for (const p of problems) console.error(`${p.where}: ${p.reason}`);
if (issues.length || problems.length) process.exit(1);

const json = `${JSON.stringify(load, null, 2)}\n`;
const out = path.join(process.cwd(), DOG_WALKING_LOAD_PATH);
if (args.includes("--check")) {
  const current = readFileSync(out, "utf8");
  if (current !== json) {
    console.error(`${DOG_WALKING_LOAD_PATH} is stale. Run npx tsx tools/launchpad-load-from-xlsx.ts`);
    process.exit(1);
  }
  console.log(`${DOG_WALKING_LOAD_PATH} is up to date.`);
} else {
  writeFileSync(out, json);
  console.log(`Wrote ${DOG_WALKING_LOAD_PATH} (framework md5 ${frameworkMd5})`);
}
const rowsAt = args.indexOf("--rows");
if (rowsAt !== -1 && args[rowsAt + 1]) {
  writeFileSync(args[rowsAt + 1]!, JSON.stringify(loadExportRows(load), null, 2));
  console.log(`Wrote ${args[rowsAt + 1]}`);
}
