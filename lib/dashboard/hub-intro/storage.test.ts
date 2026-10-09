import { describe, expect, it } from "vitest";
import { parseHubIntroSeenMap } from "@/lib/dashboard/hub-intro/storage";
import { hubIntroIdFromPathname } from "@/lib/dashboard/hub-intro/resolve-hub";
import { parsePageIntroSeenStore } from "@/lib/dashboard/page-intro-seen";

describe("parseHubIntroSeenMap", () => {
  it("returns an empty map for missing or junk input", () => {
    expect(parseHubIntroSeenMap(null)).toEqual({});
    expect(parseHubIntroSeenMap("")).toEqual({});
    expect(parseHubIntroSeenMap("not-json")).toEqual({});
    expect(parseHubIntroSeenMap("[]")).toEqual({});
  });

  it("keeps only known hubs marked true", () => {
    expect(
      parseHubIntroSeenMap(
        JSON.stringify({ academy: true, vault: false, mystery: true }),
      ),
    ).toEqual({ academy: true });
  });
});

describe("parsePageIntroSeenStore", () => {
  it("keeps hub flags per account and ignores junk", () => {
    expect(parsePageIntroSeenStore(null)).toEqual({});
    expect(parsePageIntroSeenStore("[]")).toEqual({});
    expect(
      parsePageIntroSeenStore(
        JSON.stringify({
          "user:abc": {
            hubs: { academy: true, vault: false, mystery: true },
            vaultAddMoney: true,
            skillsCup: false,
          },
        }),
      ),
    ).toEqual({
      "user:abc": {
        hubs: { academy: true },
        vaultAddMoney: true,
        skillsCup: false,
      },
    });
  });
});

describe("hubIntroIdFromPathname", () => {
  it("maps the four hubs and skips lessons and other dashboard pages", () => {
    expect(hubIntroIdFromPathname("/dashboard/academy")).toBe("academy");
    expect(hubIntroIdFromPathname("/dashboard/launchpad")).toBe("launchpad");
    expect(hubIntroIdFromPathname("/dashboard/community")).toBe("community");
    expect(hubIntroIdFromPathname("/dashboard/vault")).toBe("vault");
    expect(hubIntroIdFromPathname("/dashboard/academy/lesson/1")).toBeNull();
    expect(hubIntroIdFromPathname("/dashboard/settings")).toBeNull();
    expect(hubIntroIdFromPathname("/dashboard/advanced-money-tools")).toBeNull();
  });
});
