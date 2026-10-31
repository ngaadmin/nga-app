import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COHORT_AVATAR } from "@/lib/onboarding/cohort-avatars";

const PICKER = "components/onboarding/cohort-track-picker.tsx";
const PANEL = "components/dashboard/settings/add-linked-profile-panel.tsx";

describe("cohort avatar maps", () => {
  it("resolves the same waving files on the picker and the add-profile panel", () => {
    expect(COHORT_AVATAR.explorer.src).toBe(
      "/assets/illustrations/characters/lars/lars-waving-512.webp",
    );
    expect(COHORT_AVATAR.pathfinder.src).toBe(
      "/assets/illustrations/characters/holly/holly-waving-512.webp",
    );
    expect(COHORT_AVATAR.maverick.src).toBe(
      "/assets/illustrations/characters/senna-older/senna-older-waving-r1-512.webp",
    );

    const picker = readFileSync(PICKER, "utf8");
    const panel = readFileSync(PANEL, "utf8");
    for (const source of [picker, panel]) {
      expect(source).toContain('from "@/lib/onboarding/cohort-avatars"');
      expect(source.toLowerCase()).not.toContain("aiden");
      expect(source).not.toContain("website/Avatars");
    }
    expect(picker).toContain("COHORT_AVATAR.explorer");
    expect(picker).toContain("COHORT_AVATAR.pathfinder");
    expect(picker).toContain("COHORT_AVATAR.maverick");
    expect(panel).toContain("COHORT_AVATAR[track]");
  });
});
