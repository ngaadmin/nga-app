export const VAULT_INCOME_SOURCES = [
  { id: "pocket-money", label: "Pocket money" },
  { id: "chores", label: "Chores" },
  { id: "job", label: "Job" },
  { id: "birthday-money", label: "Birthday money" },
  { id: "other", label: "Other" },
] as const;

export type VaultIncomeSourceId = (typeof VAULT_INCOME_SOURCES)[number]["id"];

export const DEFAULT_VAULT_INCOME_SOURCE_ID: VaultIncomeSourceId = "pocket-money";

export function getVaultIncomeSourceLabel(sourceId: VaultIncomeSourceId): string {
  return (
    VAULT_INCOME_SOURCES.find((source) => source.id === sourceId)?.label ?? "Other"
  );
}

export function isVaultIncomeSourceId(value: string): value is VaultIncomeSourceId {
  return VAULT_INCOME_SOURCES.some((source) => source.id === value);
}
