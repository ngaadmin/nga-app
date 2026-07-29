import { SAVINGS_JAR_ID } from "@/lib/dashboard/destination-jars";
import type { VaultBucket, VaultBucketId } from "@/lib/dashboard/vault-buckets";
import type { SavingsGoal, SavingsGoalId } from "@/lib/dashboard/savings-goals";

export type VaultTransferLocationId = VaultBucketId | SavingsGoalId | "pool";

export type VaultTransferLocation = {
  id: VaultTransferLocationId;
  label: string;
  balance: number;
};

export function buildVaultTransferLocations(
  buckets: readonly VaultBucket[],
  goals: readonly SavingsGoal[],
  excludeId?: VaultTransferLocationId,
): VaultTransferLocation[] {
  const bucketLocations: VaultTransferLocation[] = buckets.map((bucket) => ({
    id: bucket.id,
    label: `${bucket.emoji} ${bucket.name}`,
    balance: bucket.balance,
  }));

  const goalLocations: VaultTransferLocation[] = goals.map((goal) => ({
    id: goal.id,
    label: `${goal.emoji} ${goal.name}`,
    balance: goal.balance,
  }));

  return [...bucketLocations, ...goalLocations].filter((entry) => entry.id !== excludeId);
}

/** Savings sources available when moving from the Save Jar header. */
export function buildSaveJarTransferSources(
  unassignedBalance: number,
  goals: readonly SavingsGoal[],
  unallocatedLabel: string,
): VaultTransferLocation[] {
  const sources: VaultTransferLocation[] = [
    {
      id: SAVINGS_JAR_ID,
      label: unallocatedLabel,
      balance: unassignedBalance,
    },
  ];

  for (const goal of goals) {
    sources.push({
      id: goal.id,
      label: `${goal.emoji} ${goal.name}`,
      balance: goal.balance,
    });
  }

  return sources;
}

/** Budget jar destinations for Save Jar header moves (excludes the active source). */
export function buildSaveJarTransferDestinations(
  buckets: readonly VaultBucket[],
  sourceId: VaultTransferLocationId,
): VaultTransferLocation[] {
  return buckets
    .filter((bucket) => {
      if (bucket.id === sourceId) return false;
      if (sourceId === SAVINGS_JAR_ID && bucket.id === SAVINGS_JAR_ID) return false;
      return true;
    })
    .map((bucket) => ({
      id: bucket.id,
      label: `${bucket.emoji} ${bucket.name}`,
      balance: bucket.balance,
    }));
}

export function resolveVaultTransferLocationLabel(
  id: VaultTransferLocationId,
  buckets: readonly VaultBucket[],
  goals: readonly SavingsGoal[],
  poolLabel: string,
): string {
  if (id === "pool") return poolLabel;
  if (isSavingsGoalMoveTarget(id)) {
    return goals.find((goal) => goal.id === id)?.name ?? "Savings goal";
  }
  return buckets.find((bucket) => bucket.id === id)?.name ?? "Jar";
}
