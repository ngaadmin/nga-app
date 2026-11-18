/**
 * Manual smoke for the full Launchpad learner save. Do not run this from CI
 * or against the shared preview database: a successful run writes one row.
 *
 *   NEXT_PUBLIC_SUPABASE_URL=... \
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
 *   LAUNCHPAD_SMOKE_EMAIL=... \
 *   LAUNCHPAD_SMOKE_PASSWORD=... \
 *   npx tsx tools/launchpad-save-smoke.ts
 *
 * Signs in as that learner, upserts a dog-walking venture row with a sample
 * answers map, reads it back, and prints the row ids. Uses the anon key and
 * the learner's session only.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() || "";
const email = process.env.LAUNCHPAD_SMOKE_EMAIL?.trim() ?? "";
const password = process.env.LAUNCHPAD_SMOKE_PASSWORD ?? "";

const missing = [
  !url ? "NEXT_PUBLIC_SUPABASE_URL" : "",
  !anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : "",
  !email ? "LAUNCHPAD_SMOKE_EMAIL" : "",
  !password ? "LAUNCHPAD_SMOKE_PASSWORD" : "",
].filter(Boolean);

if (missing.length) {
  console.error(`Missing ${missing.join(", ")}. Nothing was written.`);
  process.exit(1);
}

const sampleAnswers = {
  "l1-offer": { kind: "selection", version: 1, selected: ["walks", "grooming"] },
  "l1-goal-make-money": {
    kind: "fields",
    version: 1,
    values: { amount: 20, currency: "USD", timeframeNumber: 3, timeframeUnit: "months", savingFor: "a bike" },
  },
  sales_channels: { kind: "sales-channels", version: 1, selected: ["flyers"], where: { flyers: ["school"] } },
};

async function main(): Promise<void> {
  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const signedIn = await supabase.auth.signInWithPassword({ email, password });
  if (signedIn.error || !signedIn.data.user) {
    console.error(signedIn.error?.message ?? "Sign-in returned no user.");
    process.exit(1);
  }
  const userId = signedIn.data.user.id;
  const written = await supabase
    .from("launchpad_learner_ventures")
    .upsert(
      {
        user_id: userId,
        venture_id: "dog-walking",
        content_version_id: null,
        content_hash: "launchpad-save-smoke",
        current_level: 2,
        completed_task_ids: ["l1-s1-b1-t1"],
        task_state: {},
        answers: sampleAnswers,
        rooftop_completed_at: null,
      },
      { onConflict: "user_id,venture_id" },
    )
    .select("id, user_id, venture_id")
    .single();
  if (written.error || !written.data) {
    console.error(written.error?.message ?? "Upsert returned no row.");
    process.exit(1);
  }
  const readBack = await supabase
    .from("launchpad_learner_ventures")
    .select("id, user_id, venture_id, answers")
    .eq("id", written.data.id)
    .single();
  if (readBack.error || !readBack.data) {
    console.error(readBack.error?.message ?? "Read returned no row.");
    process.exit(1);
  }
  console.log(
    JSON.stringify(
      { ventureId: readBack.data.id, userId: readBack.data.user_id, venture: readBack.data.venture_id },
      null,
      2,
    ),
  );
}

void main();
