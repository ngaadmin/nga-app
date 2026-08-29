import {
  EMERGENCIES_JAR_ID,
  SAVINGS_JAR_ID,
  type DestinationJarId,
} from "@/lib/dashboard/destination-jars";
import { centsToDollars, dollarsToCents } from "@/lib/dashboard/vault-amount-input";

/** Floor a percent share of Money in to whole dollars, as cents. */
function floorPercentToWholeDollarCents(moneyInCents: number, percent: number): number {
  return Math.floor((moneyInCents * percent) / 10_000) * 100;
}

/**
 * Spend 50 / Save 30 / Give 10 / Emergencies 10, each floored to whole dollars.
 * Leftover cents from Money in park on Emergencies so the four fields sum exactly.
 * Custom jars stay at $0 on draft.
 */
export function foundationAllocationDrafts(
  moneyIn: number,
): Record<DestinationJarId, number> {
  const cents = Math.max(0, dollarsToCents(moneyIn));
  const spend = floorPercentToWholeDollarCents(cents, 50);
  const save = floorPercentToWholeDollarCents(cents, 30);
  const give = floorPercentToWholeDollarCents(cents, 10);
  const emergenciesFloor = floorPercentToWholeDollarCents(cents, 10);
  const remainder = cents - spend - save - give - emergenciesFloor;
  const emergencies = emergenciesFloor + remainder;

  return {
    "spend-jar": centsToDollars(spend),
    [SAVINGS_JAR_ID]: centsToDollars(save),
    "give-jar": centsToDollars(give),
    [EMERGENCIES_JAR_ID]: centsToDollars(emergencies),
  };
}
