import { roundToHalfStep } from "@/lib/dashboard/destination-jars";

export const VAULT_AMOUNT_STEP = 0.5;

export function parsePositiveVaultAmount(rawValue: string): number | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return roundToHalfStep(parsed);
}
