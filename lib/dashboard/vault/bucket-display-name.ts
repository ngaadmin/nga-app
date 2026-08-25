import { INITIAL_DESTINATION_JARS } from "@/lib/dashboard/destination-jars";
import type { VaultBucket, VaultBucketId } from "@/lib/dashboard/vault-buckets";

/** Foundation bucket labels without the "Jar" suffix — Vault display only. */
const VAULT_FOUNDATION_DISPLAY_NAMES: Partial<Record<VaultBucketId, string>> = {
  "save-jar": "Save",
  "spend-jar": "Spend",
  "give-jar": "Give",
  "emergencies-jar": "Emergencies",
};

const DEFAULT_FOUNDATION_JAR_NAMES = Object.fromEntries(
  INITIAL_DESTINATION_JARS.map((jar) => [jar.id, jar.name]),
) as Partial<Record<VaultBucketId, string>>;

/** Display name for Vault surfaces (main card, allocation modal, drill-down). */
export function vaultBucketDisplayName(bucket: VaultBucket): string {
  const defaultName = DEFAULT_FOUNDATION_JAR_NAMES[bucket.id];
  if (defaultName && bucket.name === defaultName) {
    const mapped = VAULT_FOUNDATION_DISPLAY_NAMES[bucket.id];
    if (mapped) return mapped;
  }
  return bucket.name.replace(/\s+Jar$/i, "");
}

export function vaultBucketsWithDisplayNames(buckets: VaultBucket[]): VaultBucket[] {
  return buckets.map((bucket) => ({
    ...bucket,
    name: vaultBucketDisplayName(bucket),
  }));
}
