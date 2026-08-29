import { describe, expect, it } from "vitest";
import {
  formatVaultCentsInputValue,
  parsePositiveVaultCentsAmount,
  parseVaultCentsInput,
  sanitizeVaultCentsInput,
} from "@/lib/dashboard/vault-amount-input";

describe("vault cents amount input", () => {
  it("keeps two decimal places while typing", () => {
    expect(sanitizeVaultCentsInput("100.5").value).toBe("100.5");
    expect(sanitizeVaultCentsInput("100.567").value).toBe("100.56");
    expect(sanitizeVaultCentsInput("1,000.5").value).toBe("1,000.5");
  });

  it("parses grouped cents values", () => {
    expect(parseVaultCentsInput("1,000.50")).toBe(1000.5);
    expect(parsePositiveVaultCentsAmount("0.00")).toBeNull();
    expect(parsePositiveVaultCentsAmount("0.01")).toBe(0.01);
  });

  it("formats display values with .00", () => {
    expect(formatVaultCentsInputValue(100)).toBe("100.00");
    expect(formatVaultCentsInputValue(1000.5)).toBe("1,000.50");
    expect(formatVaultCentsInputValue(0)).toBe("0.00");
  });
});
