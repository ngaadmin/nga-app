import {
  isSavingsGoalMoveTarget,
  type VaultBucket,
  type VaultBucketId,
} from "@/lib/dashboard/vault-buckets";
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
