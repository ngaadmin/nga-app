import type { FoundationJarRole } from "@/lib/dashboard/destination-jars";
import {
  VAULT_GIFT_CUSTOM_OPTION_ID,
  VAULT_GIFT_REASON_IDS,
  VAULT_GIFT_REASON_LABELS,
} from "@/lib/dashboard/gift-reasons";
import type { SpendingCategory } from "@/lib/dashboard/spending-categories";

export const VAULT_WHAT_FOR_CUSTOM_OPTION_ID = VAULT_GIFT_CUSTOM_OPTION_ID;

export type VaultMoneyOutWhatForKind = "spend" | "give" | "emergencies" | "custom";

export type VaultWhatForOption = {
  id: string;
  label: string;
};

export const VAULT_EMERGENCY_REASON_IDS = [
  "replacements",
  "repairs",
  "unexpected-cost",
  "other",
] as const;

export type VaultEmergencyReasonId = (typeof VAULT_EMERGENCY_REASON_IDS)[number];

export const VAULT_EMERGENCY_REASON_LABELS: Record<VaultEmergencyReasonId, string> = {
  replacements: "Replacements",
  repairs: "Repairs",
  "unexpected-cost": "Unexpected cost",
  other: "Other",
};

export const VAULT_CUSTOM_JAR_REASON_ID = "other" as const;

export const VAULT_CUSTOM_JAR_REASON_LABEL = "Other";

export function moneyOutWhatForKind(
  foundationRole: FoundationJarRole | "custom",
): VaultMoneyOutWhatForKind | null {
  if (foundationRole === "save") return null;
  if (foundationRole === "give") return "give";
  if (foundationRole === "emergencies") return "emergencies";
  if (foundationRole === "spend") return "spend";
  return "custom";
}

export function saveGoalWhatForOptions(goalName: string): VaultWhatForOption[] {
  const label = goalName.trim() || "Goal";
  return [
    { id: "goal", label },
    { id: VAULT_CUSTOM_JAR_REASON_ID, label: VAULT_CUSTOM_JAR_REASON_LABEL },
  ];
}

export function moneyOutWhatForOptions(
  kind: VaultMoneyOutWhatForKind,
  spendCategories: readonly SpendingCategory[],
): VaultWhatForOption[] {
  if (kind === "give") {
    return VAULT_GIFT_REASON_IDS.map((id) => ({
      id,
      label: VAULT_GIFT_REASON_LABELS[id],
    }));
  }

  if (kind === "emergencies") {
    return VAULT_EMERGENCY_REASON_IDS.map((id) => ({
      id,
      label: VAULT_EMERGENCY_REASON_LABELS[id],
    }));
  }

  if (kind === "custom") {
    return [{ id: VAULT_CUSTOM_JAR_REASON_ID, label: VAULT_CUSTOM_JAR_REASON_LABEL }];
  }

  const defaults = spendCategories.filter((category) => category.isDefault);
  const source = defaults.length > 0 ? defaults : spendCategories;
  return source.map((category) => ({
    id: category.id,
    label: category.label,
  }));
}
