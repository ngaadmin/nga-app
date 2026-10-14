import { describe, expect, it } from "vitest";
import { buildDemoLearnerProgress } from "@/scripts/demo-learner-progress";

describe("buildDemoLearnerProgress", () => {
  const progress = buildDemoLearnerProgress(3);

  it("marks lessons 1 to 3 complete and leaves lesson 4 next", () => {
    const status = (id: number) =>
      progress.academyProgress?.find((node) => node.id === id)?.status;
    expect(status(1)).toBe("completed");
    expect(status(2)).toBe("completed");
    expect(status(3)).toBe("completed");
    expect(status(4)).toBe("active");
  });

  it("stores bronze medals, a streak, and XP for three perfect lessons", () => {
    expect(progress.skillProgress).toEqual({
      "stop-and-think": "bronze",
      "put-needs-first": "bronze",
      "smart-saving": "bronze",
    });
    expect(progress.dayStreak).toBe(3);
    expect(progress.wallet?.lifetimePointsEarned).toBe(450);
    expect(progress.wallet?.totalPoints).toBe(450);
  });
});
