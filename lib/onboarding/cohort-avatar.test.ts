import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const COHORT_AVATAR_FILES = [
  "components/onboarding/cohort-track-picker.tsx",
  "components/dashboard/settings/add-linked-profile-panel.tsx",
] as const;

function avatarMap(source: string): string {
  const start = source.indexOf("const TRACK_AVATAR_SRC");
  const end = source.indexOf("};", start);
  return source.slice(start, end);
}

describe("cohort avatar maps", () => {
  it("points the Maverick picker at Senna Older and keeps Aiden out of every cohort avatar map", () => {
    const maps = COHORT_AVATAR_FILES.map((file) =>
      avatarMap(readFileSync(file, "utf8")),
    );
    const picker = maps[0];

    expect(picker).toContain(
      'src: "/assets/illustrations/characters/senna-older/senna-older-waving-r1-512.webp"',
    );
    expect(picker).toContain("lars-waving-512.webp");
    expect(picker).toContain("holly-waving-512.webp");
    expect(maps[1]).toContain("Lars-onboarding.webp");
    expect(maps[1]).toMatch(
      /maverick:\s*\n?\s*"\/assets\/illustrations\/characters\/senna-older\/senna-older-waving-r1-512\.webp"/,
    );
    expect(maps[1]).toMatch(
      /pathfinder:\s*\n?\s*"\/assets\/illustrations\/characters\/senna-older\/senna-older-waving-r1-512\.webp"/,
    );
    expect(maps[1]).not.toContain("Saskia-onboarding.webp");

    for (const map of maps) {
      expect(map.toLowerCase()).not.toContain("aiden");
    }
  });
});
