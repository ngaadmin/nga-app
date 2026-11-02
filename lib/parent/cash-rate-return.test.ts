import { describe, expect, it } from "vitest";
import {
  cashRateSettingsHref,
  hubChildHref,
  safeHubReturnTo,
} from "@/lib/parent/cash-rate-return";

describe("cash rate return-to", () => {
  it("links to Settings with the cash rate open and a way back", () => {
    const href = cashRateSettingsHref("child-1");
    const url = new URL(href, "https://x.test");
    expect(url.pathname).toBe("/dashboard/settings");
    expect(url.searchParams.get("cashRate")).toBe("open");
    expect(url.searchParams.get("returnTo")).toBe("/dashboard/parent?child=child-1");
  });

  it("only allows a Parent Hub path back", () => {
    expect(safeHubReturnTo(hubChildHref("child-1"))).toBe("/dashboard/parent?child=child-1");
    expect(safeHubReturnTo("/dashboard/parent")).toBe("/dashboard/parent");
    expect(safeHubReturnTo("https://evil.test/dashboard/parent")).toBeNull();
    expect(safeHubReturnTo("//evil.test/dashboard/parent")).toBeNull();
    expect(safeHubReturnTo("/\\evil.test")).toBeNull();
    expect(safeHubReturnTo("/dashboard/settings")).toBeNull();
    expect(safeHubReturnTo(null)).toBeNull();
  });
});
