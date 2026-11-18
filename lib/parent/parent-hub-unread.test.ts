import { describe, expect, it } from "vitest";
import {
  formatParentHubUnreadCount,
  parentHubUnreadAriaLabel,
  parentHubUnreadCountFromSource,
  resolveParentHubUnreadCount,
} from "@/lib/parent/parent-hub-unread";

const preview = { VERCEL_ENV: "preview" };
const development = { VERCEL_ENV: "development" };
const production = { VERCEL_ENV: "production" };
const productionPublic = { NEXT_PUBLIC_VERCEL_ENV: "production" };

describe("parentHubUnreadCountFromSource", () => {
  it("returns 0 because there is no messages table yet", () => {
    expect(parentHubUnreadCountFromSource()).toBe(0);
  });
});

describe("resolveParentHubUnreadCount", () => {
  it("returns 0 in production, even with a query override", () => {
    expect(
      resolveParentHubUnreadCount({
        search: "?parentUnread=3",
        env: production,
      }),
    ).toBe(0);
    expect(
      resolveParentHubUnreadCount({
        search: "?parentUnread=3",
        env: productionPublic,
      }),
    ).toBe(0);
    expect(
      resolveParentHubUnreadCount({
        search: "?parentUnread=3",
        env: { VERCEL_ENV: "preview", NEXT_PUBLIC_VERCEL_ENV: "production" },
      }),
    ).toBe(0);
  });

  it("returns 0 with no override", () => {
    expect(resolveParentHubUnreadCount({ env: preview })).toBe(0);
    expect(resolveParentHubUnreadCount({ search: "", env: preview })).toBe(0);
    expect(resolveParentHubUnreadCount({ search: "?foo=1", env: preview })).toBe(
      0,
    );
  });

  it("applies ?parentUnread=N off production", () => {
    expect(
      resolveParentHubUnreadCount({ search: "?parentUnread=3", env: preview }),
    ).toBe(3);
    expect(
      resolveParentHubUnreadCount({
        search: "?parentUnread=0",
        env: development,
      }),
    ).toBe(0);
    expect(
      resolveParentHubUnreadCount({
        search: "parentUnread=12",
        env: preview,
      }),
    ).toBe(12);
    expect(
      resolveParentHubUnreadCount({
        search: "?foo=1&parentUnread=1",
        env: development,
      }),
    ).toBe(1);
  });

  it("ignores invalid overrides", () => {
    expect(
      resolveParentHubUnreadCount({ search: "?parentUnread=abc", env: preview }),
    ).toBe(0);
    expect(
      resolveParentHubUnreadCount({ search: "?parentUnread=-1", env: preview }),
    ).toBe(0);
    expect(
      resolveParentHubUnreadCount({
        search: "?parentUnread=3.5",
        env: preview,
      }),
    ).toBe(0);
  });
});

describe("formatParentHubUnreadCount", () => {
  it("hides at 0 and shows 9+ above 9", () => {
    expect(formatParentHubUnreadCount(0)).toBeNull();
    expect(formatParentHubUnreadCount(1)).toBe("1");
    expect(formatParentHubUnreadCount(9)).toBe("9");
    expect(formatParentHubUnreadCount(10)).toBe("9+");
    expect(formatParentHubUnreadCount(99)).toBe("9+");
  });
});

describe("parentHubUnreadAriaLabel", () => {
  it("uses the exact count and US plural", () => {
    expect(parentHubUnreadAriaLabel(0)).toBeNull();
    expect(parentHubUnreadAriaLabel(1)).toBe("1 unread Parent Hub item");
    expect(parentHubUnreadAriaLabel(3)).toBe("3 unread Parent Hub items");
    expect(parentHubUnreadAriaLabel(12)).toBe("12 unread Parent Hub items");
  });
});
