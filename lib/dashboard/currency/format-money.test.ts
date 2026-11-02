import { describe, expect, it } from "vitest";
import { formatCompactMoney } from "@/lib/dashboard/currency/format-money";

describe("formatCompactMoney", () => {
  it("keeps full cents below 1,000", () => {
    expect(formatCompactMoney(0, "USD")).toBe("$0.00");
    expect(formatCompactMoney(12.5, "USD")).toBe("$12.50");
    expect(formatCompactMoney(999.99, "USD")).toBe("$999.99");
  });

  it("goes compact from 1,000 up, with at most one decimal", () => {
    expect(formatCompactMoney(1000, "USD")).toBe("$1K");
    expect(formatCompactMoney(1234, "USD")).toBe("$1.2K");
    expect(formatCompactMoney(300_000_000, "USD")).toBe("$300M");
    expect(formatCompactMoney(500_000_000, "AUD")).toBe("$500M");
  });

  it("stays short enough for a jar column", () => {
    for (const amount of [999.99, 1234.56, 999_999, 300_000_000, 2.5e12]) {
      expect(formatCompactMoney(amount, "USD").length).toBeLessThanOrEqual(7);
    }
  });

  it("never shows a negative amount", () => {
    expect(formatCompactMoney(-50, "USD")).toBe("$0.00");
  });
});
