/**
 * Writes supabase/seeds/launchpad_test_venture_seed.sql from the bundled
 * Launchpad seed. Writes a local file only; it never talks to a database.
 *
 *   npx tsx tools/launchpad-seed-sql.ts
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { launchpadTestVentureSeed } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { launchpadSeedSql } from "@/lib/launchpad/content/seed/seed-sql";

const LAUNCHPAD_SEED_SQL_PATH = path.join(process.cwd(), "supabase/seeds/launchpad_test_venture_seed.sql");

writeFileSync(LAUNCHPAD_SEED_SQL_PATH, launchpadSeedSql(launchpadTestVentureSeed()));
console.log(`Wrote ${path.relative(process.cwd(), LAUNCHPAD_SEED_SQL_PATH)}`);
