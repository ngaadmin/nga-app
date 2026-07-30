import type { VaultBucket, VaultBucketId } from "@/lib/dashboard/vault-buckets";

/** Foundation bucket labels without the "Jar" suffix — Vault V2 display only. */
const VAULT_V2_FOUNDATION_DISPLAY_NAMES: Partial<Record<VaultBucketId, string>> = {
  "save-jar": "Save",
  "spend-jar": "Spend",
  "give-jar": "Give",
};

/** Display name for Vault V2 surfaces (main card, allocation modal, drill-down). */
export function vaultV2BucketDisplayName(bucket: VaultBucket): string {
  const mapped = VAULT_V2_FOUNDATION_DISPLAY_NAMES[bucket.id];
  if (mapped) return mapped;
  return bucket.name.replace(/\s+Jar$/i, "");
}

export function vaultV2BucketsWithDisplayNames(buckets: VaultBucket[]): VaultBucket[] {
  return buckets.map((bucket) => ({
    ...bucket,
    name: vaultV2BucketDisplayName(bucket),
  }));
}
