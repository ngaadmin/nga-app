import {
  SAVINGS_JAR_ID,
  type DestinationJar,
  type DestinationJarId,
  type FoundationJarRole,
  roundAudAmount,
} from "@/lib/dashboard/destination-jars";

export const FOUNDATION_VAULT_BUCKET_COUNT = 3;
export const MAX_FREEMIUM_VAULT_BUCKETS = 15;
export const MAX_PREMIUM_VAULT_BUCKETS = 20;

/** @deprecated Use tier-specific limits via maxVaultBuckets(). */
export const MAX_CUSTOM_VAULT_BUCKETS = MAX_PREMIUM_VAULT_BUCKETS - FOUNDATION_VAULT_BUCKET_COUNT;

export function maxVaultBuckets(isPremium: boolean): number {
  return isPremium ? MAX_PREMIUM_VAULT_BUCKETS : MAX_FREEMIUM_VAULT_BUCKETS;
}

export function canAddVaultBucket(
  currentBucketCount: number,
  isPremium: boolean,
): boolean {
  return currentBucketCount < maxVaultBuckets(isPremium);
}

export type CustomVaultBucketId = `custom-${string}`;

export type VaultBucketId = DestinationJarId | CustomVaultBucketId;

export type VaultBucket = {
  id: VaultBucketId;
  name: string;
  emoji: string;
  balance: number;
  /** Foundation jars are fixed on freemium; custom buckets are premium-only. */
  isFoundation: boolean;
  foundationRole: FoundationJarRole | "custom";
};

export type CustomVaultBucketPersisted = {
  id: CustomVaultBucketId;
  name: string;
  emoji: string;
  balance: number;
  foundationRole: FoundationJarRole | "custom";
};

export function isCustomBucketId(id: string): id is CustomVaultBucketId {
  return id.startsWith("custom-");
}

export function foundationBucketsFromJars(
  jars: readonly DestinationJar[],
): VaultBucket[] {
  return jars.map((jar) => ({
    id: jar.id,
    name: jar.name,
    emoji: jar.emoji,
    balance: jar.balance,
    isFoundation: true,
    foundationRole: jar.foundationRole,
  }));
}

export function mergeVaultBuckets(
  jars: readonly DestinationJar[],
  customBuckets: readonly CustomVaultBucketPersisted[],
): VaultBucket[] {
  return [
    ...foundationBucketsFromJars(jars),
    ...customBuckets.map((bucket) => ({
      id: bucket.id,
      name: bucket.name,
      emoji: bucket.emoji,
      balance: Math.max(0, bucket.balance),
      isFoundation: false,
      foundationRole: bucket.foundationRole,
    })),
  ];
}

export function createCustomBucketId(): CustomVaultBucketId {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function defaultCustomBucket(
  name = "My Bucket",
  emoji = "💰",
): CustomVaultBucketPersisted {
  return {
    id: createCustomBucketId(),
    name,
    emoji,
    balance: 0,
    foundationRole: "custom",
  };
}

export function canMarkBucketAsSpent(bucket: VaultBucket): boolean {
  return (
    bucket.id !== SAVINGS_JAR_ID &&
    bucket.foundationRole !== "save"
  );
}

export function canRenameFoundationBucket(
  bucket: VaultBucket,
  isPremium: boolean,
): boolean {
  if (!bucket.isFoundation) return true;
  return isPremium;
}

export function isSavingsBucket(bucket: VaultBucket): boolean {
  return bucket.id === SAVINGS_JAR_ID || bucket.foundationRole === "save";
}

/** Clamp draft allocations so they never exceed the pool. */
export function clampAllocationDrafts(
  drafts: Record<string, number>,
  bucketIds: readonly string[],
  poolTotal: number,
): Record<string, number> {
  const safePool = roundAudAmount(Math.max(0, poolTotal));
  const next: Record<string, number> = {};

  for (const id of bucketIds) {
    next[id] = roundAudAmount(Math.max(0, drafts[id] ?? 0));
  }

  let sum = Object.values(next).reduce((total, value) => total + value, 0);
  if (sum <= safePool) return next;

  const scale = safePool / sum;
  for (const id of bucketIds) {
    next[id] = roundAudAmount((next[id] ?? 0) * scale);
  }

  sum = Object.values(next).reduce((total, value) => total + value, 0);
  const drift = roundAudAmount(safePool - sum);
  const firstId = bucketIds[0];
  if (firstId && drift !== 0) {
    next[firstId] = roundAudAmount((next[firstId] ?? 0) + drift);
  }

  return next;
}

export function sumAllocations(drafts: Record<string, number>): number {
  return roundAudAmount(
    Object.values(drafts).reduce((total, value) => total + value, 0),
  );
}

export function sumBucketBalances(buckets: readonly VaultBucket[]): number {
  return roundAudAmount(buckets.reduce((total, bucket) => total + bucket.balance, 0));
}
