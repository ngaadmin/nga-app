/**
 * Writes the bundled-seed SQL files. Writes local files only; it never talks
 * to a database.
 *
 *   npx tsx tools/launchpad-seed-sql.ts
 *
 * Running the generated publish file in the SQL editor (service role) inserts
 * a new version when the hash is new and points launchpad_venture_current at it.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { LAUNCHPAD_PREVIEW_DB_VENTURE_ID } from "@/lib/launchpad/content/schema-version";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { launchpadPublishV4Sql, launchpadSeedSql } from "@/lib/launchpad/content/seed/seed-sql";

// Preview publishes dog-walking-r2. The dog-walking current pointer stays put.
const seed = launchpadTestVentureSeed(LAUNCHPAD_PREVIEW_DB_VENTURE_ID);
const files = [
  ["supabase/seeds/launchpad_test_venture_seed.sql", launchpadSeedSql(seed)],
  ["supabase/seeds/launchpad_venture_publish_v4.sql", launchpadPublishV4Sql([seed])],
] as const;

for (const [rel, sql] of files) {
  const file = path.join(process.cwd(), rel);
  writeFileSync(file, sql);
  console.log(`Wrote ${rel}`);
}
