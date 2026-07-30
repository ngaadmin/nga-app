/** Vault V2 copy — delete with the rest of `vault-v2/` on cutover. */
export const vaultV2Copy = {
  title: "The Vault 2.0",
  description: "Beta redesign of The Vault — manage your money, jars, and deposits.",
  betaBadge: "Beta",
  betaNavLabel: "Vault 2.0 (Beta)",
  dashboardHeading: "The Vault",
  dashboardBody:
    "Tap a jar to move money or mark spending. Add new income below when it lands.",
  allocationSectionTitle: "Allocate Money",
  closeModalLabel: "Close",
  budgetJarsSectionLabel: "Budget Jars",
  manageBudgetJarsLabel: "Manage Budget Jars",
  manageBudgetJarsTitle: "Manage Budget Jars",
  manageBudgetJarsBody:
    "Rename jars, pick icons, add custom buckets, or remove ones you no longer need.",
  addBudgetJar: "Add Budget Jar",
  jarNameLabel: "Jar name",
  jarNamePlaceholder: "My jar",
  jarIconLabel: "Icon",
  deleteJarConfirmTitle: "Delete this jar?",
  deleteJarConfirmBody: "This cannot be undone. The jar will be removed from your vault.",
  deleteJarWithBalanceBody:
    "This jar still has money in it. Pick another jar to receive the balance before deleting.",
  deleteJarFallbackLabel: "Move balance to",
  deleteJarConfirm: "Delete jar",
  bucketLimitTemplate: "{count} / {max} jars",
  saveChanges: "Save Changes",
  cancelChanges: "Cancel",
  editJar: "Edit jar",
  deleteJar: "Delete jar",
  addJarToList: "Add to list",
  doneEditing: "Done",
} as const;
