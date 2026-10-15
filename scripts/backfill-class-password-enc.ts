/**
 * Encrypt every remaining profiles.class_password and set that column to null.
 *
 * The app also does this for a teacher the next time their class page is
 * read or their class password is saved. Run this once so plaintext is gone
 * even for classes nobody opens. Safe to re-run: rows with a null
 * class_password are skipped.
 *
 * Required:
 *   CLASS_PASSWORD_KEY
 *   SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY
 *
 *   npx tsx --conditions=react-server scripts/backfill-class-password-enc.ts
 *
 * Prints counts and profile ids only. Never prints a password or ciphertext.
 */
import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import {
  explainClassPasswordWriteError,
  planClassPasswordBackfill,
  readClassPasswordKey,
  type ClassPasswordColumns,
} from "@/lib/school/class-password-crypto";

const PAGE_SIZE = 200;

function requiredEnv(names: readonly string[]): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  throw new Error(`Missing ${names.join(" or ")}.`);
}

type ProfilePasswordRow = ClassPasswordColumns & { id: string };

async function main(): Promise<void> {
  readClassPasswordKey();
  const supabaseUrl = requiredEnv([
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
  ]);
  const serviceRoleKey = requiredEnv([
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
  ]);
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let encrypted = 0;
  let cleared = 0;
  const failed = new Set<string>();
  const updatedIds = new Set<string>();

  for (;;) {
    const { data, error } = await admin
      .from("profiles")
      .select("id, class_password, class_password_enc")
      .not("class_password", "is", null)
      .order("id", { ascending: true })
      .limit(PAGE_SIZE);

    if (error) {
      throw new Error(explainClassPasswordWriteError(error.message));
    }

    const pending = ((data ?? []) as ProfilePasswordRow[]).filter((row) => {
      if (typeof row.id !== "string" || failed.has(row.id)) return false;
      if (updatedIds.has(row.id)) {
        failed.add(row.id);
        console.error(
          `[class-password] ${row.id}: plaintext was still set after an update.`,
        );
        return false;
      }
      return true;
    });
    if (pending.length === 0) break;

    for (const row of pending) {
      let write;
      try {
        write = planClassPasswordBackfill(row, row.id).write;
      } catch (planError) {
        failed.add(row.id);
        const message =
          planError instanceof Error ? planError.message : "Could not encrypt.";
        console.error(`[class-password] ${row.id}: ${message}`);
        continue;
      }
      if (!write) {
        failed.add(row.id);
        console.error(
          `[class-password] ${row.id}: plaintext is still set but nothing was written.`,
        );
        continue;
      }

      const updated = await admin
        .from("profiles")
        .update(write)
        .eq("id", row.id)
        .select("id");
      if (updated.error || (updated.data?.length ?? 0) === 0) {
        failed.add(row.id);
        console.error(
          `[class-password] ${row.id}: ${explainClassPasswordWriteError(
            updated.error?.message ?? "No profile row was updated.",
          )}`,
        );
        continue;
      }

      updatedIds.add(row.id);
      if ("class_password_enc" in write) encrypted += 1;
      else cleared += 1;
    }
  }

  console.log(
    `Class password backfill finished. Encrypted ${encrypted}. Cleared blank plaintext ${cleared}. Failed ${failed.size}.`,
  );
  if (failed.size > 0) {
    process.exitCode = 1;
  }
}

const invokedDirectly =
  process.argv[1] != null &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
