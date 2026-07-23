import { SAVINGS_JAR_ID } from "@/lib/dashboard/destination-jars";
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

export function isVaultTransferLocationId(value: string): value is VaultTransferLocationId {
  return value === "pool" || value.startsWith("goal-") || !value.startsWith("goal-");
}

export function buildVaultTransferLocations(
  buckets: readonly VaultBucket[],
  goals: readonly SavingsGoal[],
  moneyToAllocate: number,
  poolLabel: string,
  excludeId?: VaultTransferLocationId,
): VaultTransferLocation[] {
  const bucketLocations: VaultTransferLocation[] = buckets.map((bucket) => ({
    id: bucket.id,
    label: `${bucket.emoji} ${bucket.name}`,
    balance: bucket.id === SAVINGS_JAR_ID ? bucket.balance : bucket.balance,
  }));

  const goalLocations: VaultTransferLocation[] = goals.map((goal) => ({
    id: goal.id,
    label: `${goal.emoji} ${goal.name}`,
    balance: goal.balance,
  }));

  const poolLocation: VaultTransferLocation = {
    id: "pool",
    label: poolLabel,
    balance: moneyToAllocate,
  };

  return [...bucketLocations, ...goalLocations, poolLocation].filter(
    (entry) => entry.id !== excludeId,
  );
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
