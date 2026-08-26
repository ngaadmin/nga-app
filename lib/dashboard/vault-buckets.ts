import {
  SAVINGS_JAR_ID,
  type DestinationJar,
  type DestinationJarId,
  type FoundationJarRole,
  roundAudAmount,
} from "@/lib/dashboard/destination-jars";

export const FOUNDATION_VAULT_BUCKET_COUNT = 4;
export const MAX_FREEMIUM_VAULT_BUCKETS = 15;
export const MAX_PREMIUM_VAULT_BUCKETS = 20;

/** When true, custom budget jars work without Premium for friend testing. */
export const VAULT_CUSTOM_JARS_UNLOCK_FOR_TEST = true;

/** @deprecated Use tier-specific limits via maxVaultBuckets(). */
export const MAX_CUSTOM_VAULT_BUCKETS = MAX_PREMIUM_VAULT_BUCKETS - FOUNDATION_VAULT_BUCKET_COUNT;

export function maxVaultBuckets(isPremium: boolean): number {
  return isPremium || VAULT_CUSTOM_JARS_UNLOCK_FOR_TEST
    ? MAX_PREMIUM_VAULT_BUCKETS
    : MAX_FREEMIUM_VAULT_BUCKETS;
}

export function canAddVaultBucket(
  currentBucketCount: number,
  isPremium: boolean,
): boolean {
  return currentBucketCount < maxVaultBuckets(isPremium);
}

export type CustomVaultBucketId = `custom-${string}`;

export type VaultBucketId = DestinationJarId | CustomVaultBucketId;

export type MoveTarget = VaultBucketId | "pool";

export type GoalMoveTarget = MoveTarget | `goal-${string}`;

export function isSavingsGoalMoveTarget(id: string): id is `goal-${string}` {
  return id.startsWith("goal-");
}

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

/** Set every foundation and custom jar balance to $0. Does not touch the pool. */
export function zeroAllVaultJarBalances(
  jars: readonly DestinationJar[],
  customBuckets: readonly CustomVaultBucketPersisted[],
): {
  jars: DestinationJar[];
  customBuckets: CustomVaultBucketPersisted[];
} {
  return {
    jars: jars.map((jar) => ({ ...jar, balance: 0 })),
    customBuckets: customBuckets.map((bucket) => ({ ...bucket, balance: 0 })),
  };
}

/** Set one jar or custom bucket to $0 without touching other vault fields. */
export function zeroVaultBucketBalance(
  bucketId: VaultBucketId,
  jars: readonly DestinationJar[],
  customBuckets: readonly CustomVaultBucketPersisted[],
): {
  jars: DestinationJar[];
  customBuckets: CustomVaultBucketPersisted[];
} {
  if (isCustomBucketId(bucketId)) {
    return {
      jars: jars.map((jar) => ({ ...jar })),
      customBuckets: customBuckets.map((bucket) =>
        bucket.id === bucketId ? { ...bucket, balance: 0 } : { ...bucket },
      ),
    };
  }

  return {
    jars: jars.map((jar) =>
      jar.id === bucketId ? { ...jar, balance: 0 } : { ...jar },
    ),
    customBuckets: customBuckets.map((bucket) => ({ ...bucket })),
  };
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
  name = "My Jar",
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
  return isPremium || VAULT_CUSTOM_JARS_UNLOCK_FOR_TEST;
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

/** Save Jar tile / pie chart balance: unassigned pool + all goal balances. */
export function withSavingsBucketDisplayTotal(
  buckets: readonly VaultBucket[],
  totalSavings: number,
): VaultBucket[] {
  return buckets.map((bucket) =>
    bucket.id === SAVINGS_JAR_ID
      ? { ...bucket, balance: roundAudAmount(totalSavings) }
      : bucket,
  );
}

/** Wealth across every bucket, counting savings goals inside the Save Jar total. */
export function sumVaultWealthBalance(
  buckets: readonly VaultBucket[],
  totalSavings: number,
): number {
  const nonSavingsTotal = buckets
    .filter((bucket) => bucket.id !== SAVINGS_JAR_ID)
    .reduce((sum, bucket) => sum + bucket.balance, 0);
  return roundAudAmount(nonSavingsTotal + totalSavings);
}

export function savingsBucketDisplayBalance(
  bucket: VaultBucket,
  totalSavings: number,
): number {
  return bucket.id === SAVINGS_JAR_ID ? roundAudAmount(totalSavings) : bucket.balance;
}
