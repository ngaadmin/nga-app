import { describe, expect, it } from "vitest";
import {
  moneyOutWhatForKind,
  moneyOutWhatForOptions,
  saveGoalWhatForOptions,
  VAULT_CUSTOM_JAR_REASON_LABEL,
  VAULT_EMERGENCY_REASON_LABELS,
} from "@/lib/dashboard/vault-what-for";
import type { SpendingCategory } from "@/lib/dashboard/spending-categories";

const spendCategories: SpendingCategory[] = [
  { id: "food-snacks", label: "Food & Snacks", isDefault: true },
  { id: "fun-entertainment", label: "Fun & Entertainment", isDefault: true },
  { id: "personal-items", label: "Personal Items", isDefault: true },
  { id: "gifts", label: "Gifts", isDefault: true },
  { id: "other", label: "Other", isDefault: true },
  { id: "spend-cat-old", label: "Should not list", isDefault: false },
];

describe("moneyOutWhatForOptions", () => {
  it("keeps the spend defaults including Other and skips saved custom categories", () => {
    const options = moneyOutWhatForOptions("spend", spendCategories);
    expect(options.map((entry) => entry.label)).toEqual([
      "Food & Snacks",
      "Fun & Entertainment",
      "Personal Items",
      "Gifts",
      "Other",
    ]);
  });

  it("uses Give presets", () => {
    expect(moneyOutWhatForOptions("give", []).map((entry) => entry.label)).toEqual([
      "Family",
      "Friends",
      "Birthday",
      "Charity",
      "Thank you",
    ]);
  });

  it("uses Emergencies presets", () => {
    expect(moneyOutWhatForOptions("emergencies", []).map((entry) => entry.label)).toEqual([
      VAULT_EMERGENCY_REASON_LABELS.replacements,
      VAULT_EMERGENCY_REASON_LABELS.repairs,
      VAULT_EMERGENCY_REASON_LABELS["unexpected-cost"],
      VAULT_EMERGENCY_REASON_LABELS.other,
    ]);
  });

  it("uses Other only for custom jars", () => {
    expect(moneyOutWhatForOptions("custom", spendCategories)).toEqual([
      { id: "other", label: VAULT_CUSTOM_JAR_REASON_LABEL },
    ]);
  });
});

describe("saveGoalWhatForOptions", () => {
  it("returns the goal name and Other", () => {
    expect(saveGoalWhatForOptions("Bike")).toEqual([
      { id: "goal", label: "Bike" },
      { id: "other", label: VAULT_CUSTOM_JAR_REASON_LABEL },
    ]);
  });
});

describe("moneyOutWhatForKind", () => {
  it("has no What for kind for Save", () => {
    expect(moneyOutWhatForKind("save")).toBeNull();
  });
});
