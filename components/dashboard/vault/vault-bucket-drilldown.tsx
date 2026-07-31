"use client";

import { VaultV2BucketExpandedPanel } from "@/components/dashboard/vault-v2/vault-v2-bucket-expanded-panel";
import { VaultV2SaveJarExpandedPanel } from "@/components/dashboard/vault-v2/vault-v2-save-jar-expanded-panel";
import { SAVINGS_JAR_ID } from "@/lib/dashboard/destination-jars";
import type { SavingsGoal } from "@/lib/dashboard/savings-goals";
import type { SpendingCategory, SpendingCategoryId } from "@/lib/dashboard/spending-categories";
import type { VaultTransferLocationId } from "@/lib/dashboard/vault-transfer";
import type { VaultBucket, VaultBucketId } from "@/lib/dashboard/vault-buckets";

type VaultV2BucketDrilldownProps = {
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
  onAddCustomCategory: (label: string) => void;
  onRenameCategory: (categoryId: SpendingCategoryId, label: string) => void;
  onAssignGoals: (allocations: Record<string, number>) => void;
  onClose: () => void;
};

export function VaultV2BucketDrilldown({
  bucket,
  buckets,
  goals,
  totalSavings,
  isPremium,
  spendingCategories,
  onVaultTransfer,
  onMarkSpent,
  onAddCustomCategory,
  onRenameCategory,
  onAssignGoals,
  onClose,
}: VaultV2BucketDrilldownProps) {
  if (bucket.id === SAVINGS_JAR_ID) {
    return (
      <VaultV2SaveJarExpandedPanel
        bucket={bucket}
        buckets={buckets}
        goals={goals}
        totalSavings={totalSavings}
        onVaultTransfer={onVaultTransfer}
        onAssignGoals={onAssignGoals}
        onClose={onClose}
      />
    );
  }

  return (
    <VaultV2BucketExpandedPanel
      bucket={bucket}
      buckets={buckets}
      goals={goals}
      isPremium={isPremium}
      spendingCategories={spendingCategories}
      onVaultTransfer={onVaultTransfer}
      onMarkSpent={(amount, categoryLabel) => onMarkSpent(bucket.id, amount, categoryLabel)}
      onAddCustomCategory={onAddCustomCategory}
      onRenameCategory={onRenameCategory}
      onClose={onClose}
    />
  );
}
