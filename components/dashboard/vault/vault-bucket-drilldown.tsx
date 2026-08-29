"use client";

import { VaultBucketExpandedPanel } from "@/components/dashboard/vault/vault-bucket-expanded-panel";
import { VaultSaveJarExpandedPanel } from "@/components/dashboard/vault/vault-save-jar-expanded-panel";
import { SAVINGS_JAR_ID } from "@/lib/dashboard/destination-jars";
import type { SavingsGoal, SavingsGoalId } from "@/lib/dashboard/savings-goals";
import type { SpendingCategory } from "@/lib/dashboard/spending-categories";
import type { VaultTransferLocationId } from "@/lib/dashboard/vault-transfer";
import type { VaultBucket, VaultBucketId } from "@/lib/dashboard/vault-buckets";

type VaultBucketDrilldownProps = {
  bucket: VaultBucket;
  buckets: VaultBucket[];
  goals: SavingsGoal[];
  totalSavings: number;
  isPremium: boolean;
  spendingCategories: SpendingCategory[];
  onVaultTransfer: (
    from: VaultTransferLocationId,
    to: VaultTransferLocationId,
    amount: number,
  ) => void;
  onMarkSpent: (bucketId: VaultBucketId, amount: number, categoryLabel: string) => void;
  onAssignGoals: (allocations: Record<string, number>) => void;
  onUpdateGoalDetails: (
    goalId: SavingsGoalId,
    updates: { name?: string; emoji?: string; targetAmount?: number },
  ) => void;
  onAddGoalClick?: () => void;
  onClose: () => void;
};

export function VaultBucketDrilldown({
  bucket,
  buckets,
  goals,
  totalSavings,
  isPremium,
  spendingCategories,
  onVaultTransfer,
  onMarkSpent,
  onAssignGoals,
  onUpdateGoalDetails,
  onAddGoalClick,
  onClose,
}: VaultBucketDrilldownProps) {
  if (bucket.id === SAVINGS_JAR_ID) {
    return (
      <VaultSaveJarExpandedPanel
        bucket={bucket}
        buckets={buckets}
        goals={goals}
        totalSavings={totalSavings}
        isPremium={isPremium}
        onVaultTransfer={onVaultTransfer}
        onAssignGoals={onAssignGoals}
        onUpdateGoalDetails={onUpdateGoalDetails}
        onAddGoalClick={onAddGoalClick}
        onClose={onClose}
      />
    );
  }

  return (
    <VaultBucketExpandedPanel
      bucket={bucket}
      spendingCategories={spendingCategories}
      onMarkSpent={(amount, categoryLabel) => onMarkSpent(bucket.id, amount, categoryLabel)}
      onClose={onClose}
    />
  );
}
