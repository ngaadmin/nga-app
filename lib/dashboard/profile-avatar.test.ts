import { describe, expect, it } from "vitest";
import {
  DEFAULT_PROFILE_AVATAR_BY_COHORT,
  PROFILE_AVATAR_OPTIONS,
  nextStoredProfileAvatars,
  resolveProfileAvatarId,
} from "@/lib/dashboard/profile-avatar";

describe("profile avatar", () => {
  it("defaults to the track picker character", () => {
    expect(resolveProfileAvatarId(null, "me", "explorer")).toBe("lars");
    expect(resolveProfileAvatarId(null, "me", "pathfinder")).toBe("holly");
    expect(resolveProfileAvatarId(null, "me", "maverick")).toBe("senna-older");
  });

  it("keeps a saved choice per profile", () => {
    const raw = nextStoredProfileAvatars(null, "me", "senna");
    expect(resolveProfileAvatarId(raw, "me", "explorer")).toBe("senna");
    expect(resolveProfileAvatarId(raw, "someone-else", "explorer")).toBe("lars");
  });

  it("ignores broken or unknown stored values", () => {
    expect(resolveProfileAvatarId("not json", "me", "pathfinder")).toBe("holly");
    expect(
      resolveProfileAvatarId(JSON.stringify({ me: "nobody" }), "me", "maverick"),
    ).toBe("senna-older");
  });

  it("falls back to the default for a retired Aiden choice", () => {
    expect(
      resolveProfileAvatarId(JSON.stringify({ me: "aiden" }), "me", "maverick"),
    ).toBe("senna-older");
  });

  it("keeps the child Senna and Senna Older as separate options", () => {
    const senna = PROFILE_AVATAR_OPTIONS.find((o) => o.id === "senna");
    const older = PROFILE_AVATAR_OPTIONS.find((o) => o.id === "senna-older");
    expect(senna?.src).not.toBe(older?.src);
    expect(senna?.name).not.toBe(older?.name);
    expect(PROFILE_AVATAR_OPTIONS.some((o) => o.id === ("aiden" as never))).toBe(false);
  });

  it("only offers art that exists for every default", () => {
    const ids = PROFILE_AVATAR_OPTIONS.map((option) => option.id);
    for (const id of Object.values(DEFAULT_PROFILE_AVATAR_BY_COHORT)) {
      expect(ids).toContain(id);
    }
    for (const option of PROFILE_AVATAR_OPTIONS) {
      expect(option.cropX + option.cropSize).toBeLessThanOrEqual(option.width);
      expect(option.cropY + option.cropSize).toBeLessThanOrEqual(option.height);
    }
  });
});
