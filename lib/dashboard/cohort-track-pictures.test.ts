import { describe, expect, it } from "vitest";
import { cohortTrackPicture } from "@/lib/dashboard/cohort-track-pictures";

describe("cohortTrackPicture", () => {
  it("uses Lars, Holly and Senna Older for the three tracks", () => {
    expect(cohortTrackPicture("explorer").name).toBe("Lars");
    expect(cohortTrackPicture("pathfinder").name).toBe("Holly");
    expect(cohortTrackPicture("maverick").name).toBe("Senna Older");
    expect(cohortTrackPicture("maverick").src).toBe(
      "/assets/illustrations/characters/senna-older/senna-older-waving-512.webp",
    );
  });

  it("never uses the retired Aiden art", () => {
    for (const cohort of ["explorer", "pathfinder", "maverick"] as const) {
      expect(cohortTrackPicture(cohort).src).not.toMatch(/aiden/i);
    }
  });
});
