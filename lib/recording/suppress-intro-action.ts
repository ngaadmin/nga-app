"use server";

// TODO: remove after recordings
import { matchesRecordingSuppressIntro } from "@/lib/recording/suppress-intro";

const MAX_IDENTITIES = 8;
const MAX_IDENTITY_LENGTH = 200;

/** Server check so the allow-list stays out of the client bundle. */
export async function recordingIdentitySuppressesIntros(
  identities: string[],
): Promise<boolean> {
  if (!Array.isArray(identities)) return false;
  const cleaned = identities
    .filter((value): value is string => typeof value === "string")
    .slice(0, MAX_IDENTITIES)
    .map((value) => value.slice(0, MAX_IDENTITY_LENGTH));
  return matchesRecordingSuppressIntro(cleaned);
}
