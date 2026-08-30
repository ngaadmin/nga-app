import { describe, expect, it } from "vitest";
import { canLaunchAcademyLesson } from "@/lib/academy/lessons/registry";
import {
  completeAcademyMilestone,
  defaultAcademyMilestones,
} from "@/lib/dashboard/academy-progress-storage";

function statusById(
  milestones: ReturnType<typeof defaultAcademyMilestones>,
  id: number,
) {
  return milestones.find((node) => node.id === id)?.status;
}

describe("defaultAcademyMilestones", () => {
  it("opens only lesson 1 for a new profile", () => {
    const milestones = defaultAcademyMilestones();

    expect(statusById(milestones, 1)).toBe("active");
    expect(statusById(milestones, 2)).toBe("locked");
    expect(statusById(milestones, 3)).toBe("locked");
    expect(statusById(milestones, 4)).toBe("locked");
    expect(milestones.filter((node) => node.status === "active")).toHaveLength(1);
    expect(
      canLaunchAcademyLesson(1, "active", "explorer"),
    ).toBe(true);
    expect(
      canLaunchAcademyLesson(2, "locked", "explorer"),
    ).toBe(false);
  });
});

describe("completeAcademyMilestone", () => {
  it("unlocks the next lesson and keeps the finished one replayable", () => {
    const afterLesson1 = completeAcademyMilestone(1, defaultAcademyMilestones());

    expect(statusById(afterLesson1, 1)).toBe("completed");
    expect(statusById(afterLesson1, 2)).toBe("active");
    expect(statusById(afterLesson1, 3)).toBe("locked");
    expect(
      canLaunchAcademyLesson(1, "completed", "explorer"),
    ).toBe(true);
    expect(
      canLaunchAcademyLesson(2, "active", "explorer"),
    ).toBe(true);
    expect(
      canLaunchAcademyLesson(3, "locked", "explorer"),
    ).toBe(false);
  });

  it("does not lock later lessons or wipe progress on replay", () => {
    const afterLesson2 = completeAcademyMilestone(
      2,
      completeAcademyMilestone(1, defaultAcademyMilestones()),
    );
    const afterReplay = completeAcademyMilestone(1, afterLesson2);

    expect(statusById(afterReplay, 1)).toBe("completed");
    expect(statusById(afterReplay, 2)).toBe("completed");
    expect(statusById(afterReplay, 3)).toBe("active");
    expect(statusById(afterReplay, 4)).toBe("locked");
    expect(afterReplay).toEqual(afterLesson2);
  });
});
