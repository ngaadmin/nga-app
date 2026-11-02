import { describe, expect, it } from "vitest";
import {
  PROFILE_ACHIEVEMENTS_QUERY,
  wantsProfileAchievements,
  withoutProfileQuery,
} from "@/lib/dashboard/profile-deep-link";

describe("profile deep link", () => {
  it("detects the achievements query", () => {
    expect(wantsProfileAchievements(`?${PROFILE_ACHIEVEMENTS_QUERY}`)).toBe(true);
    expect(wantsProfileAchievements("?profile=other")).toBe(false);
    expect(wantsProfileAchievements("")).toBe(false);
  });

  it("strips only the profile query", () => {
    expect(
      withoutProfileQuery("https://x.test/dashboard/academy?profile=achievements&a=1#top"),
    ).toBe("/dashboard/academy?a=1#top");
  });
});
