import { describe, expect, it } from "vitest";
import { dollarsToCents } from "@/lib/dashboard/vault-amount-input";
import { foundationAllocationDrafts } from "@/lib/dashboard/vault/foundation-allocation-split";

function split(moneyIn: number) {
  const drafts = foundationAllocationDrafts(moneyIn);
  return {
    spend: drafts["spend-jar"],
    save: drafts["save-jar"],
    give: drafts["give-jar"],
    emergencies: drafts["emergencies-jar"],
    totalCents:
      dollarsToCents(drafts["spend-jar"]) +
      dollarsToCents(drafts["save-jar"]) +
      dollarsToCents(drafts["give-jar"]) +
      dollarsToCents(drafts["emergencies-jar"]),
  };
}

describe("foundationAllocationDrafts", () => {
  it("splits $100.00 as Spend $50 / Save $30 / Give $10 / Emergencies $10", () => {
    const result = split(100);
    expect(result).toEqual({
      spend: 50,
      save: 30,
      give: 10,
      emergencies: 10,
      totalCents: 10000,
    });
  });

  it("floors $117.25 shares to whole dollars and parks $2.25 on Emergencies", () => {
    const result = split(117.25);
    expect(result).toEqual({
      spend: 58,
      save: 35,
      give: 11,
      emergencies: 13.25,
      totalCents: 11725,
    });
  });

  it("floors $33.33 shares to whole dollars and parks leftover on Emergencies", () => {
    const result = split(33.33);
    expect(result).toEqual({
      spend: 16,
      save: 9,
      give: 3,
      emergencies: 5.33,
      totalCents: 3333,
    });
  });

  it("parks sub-dollar Money in entirely on Emergencies", () => {
    const result = split(0.75);
    expect(result).toEqual({
      spend: 0,
      save: 0,
      give: 0,
      emergencies: 0.75,
      totalCents: 75,
    });
  });
});
