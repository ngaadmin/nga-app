import { describe, expect, it } from "vitest";
import {
  countEarnedMedals,
  formatQuietLessonSkillLine,
  quietLessonSkillLine,
  medalCoversTier,
  type VaultSkillTrophy,
} from "@/lib/dashboard/skill-trophies";

function trophy(id: string, tier: VaultSkillTrophy["tier"]): VaultSkillTrophy {
  return {
    id,
    label: id,
    description: "",
    skillNumber: 1,
    levelId: 1,
    tier,
    medalEmoji: "🏅",
  };
}

describe("formatQuietLessonSkillLine", () => {
  it("puts the medal tier on a quiet skill line", () => {
    expect(formatQuietLessonSkillLine("bronze", "Stop & Think")).toBe(
      "🥉 Skill unlocked: Stop & Think",
    );
    expect(formatQuietLessonSkillLine("silver", "Stop & Think")).toBe(
      "🥈 Skill unlocked: Stop & Think",
    );
    expect(formatQuietLessonSkillLine("gold", "Stop & Think")).toBe(
      "🥇 Skill unlocked: Stop & Think",
    );
    expect(formatQuietLessonSkillLine("unlocked", "Stop & Think")).toBe(
      "🔓 Skill unlocked: Stop & Think",
    );
  });

  it("omits the line when there is no tier and no name", () => {
    expect(formatQuietLessonSkillLine(null)).toBeNull();
    expect(quietLessonSkillLine(null)).toBeNull();
  });

  it("keeps the medal separate so each tier can share one size", () => {
    expect(quietLessonSkillLine("bronze", "Put Needs First")).toEqual({
      medal: "🥉",
      text: "Skill unlocked: Put Needs First",
    });
    expect(quietLessonSkillLine("silver", "Put Needs First")?.medal).toBe("🥈");
    expect(quietLessonSkillLine("gold", "Put Needs First")?.medal).toBe("🥇");
    expect(quietLessonSkillLine("unlocked", "Put Needs First")?.medal).toBe("🔓");
  });
});

describe("countEarnedMedals", () => {
  it("counts silver skills as bronze and silver", () => {
    const skills = [
      trophy("a", "silver"),
      trophy("b", "silver"),
      trophy("c", "silver"),
    ];
    expect(countEarnedMedals(skills, "bronze")).toBe(3);
    expect(countEarnedMedals(skills, "silver")).toBe(3);
    expect(countEarnedMedals(skills, "gold")).toBe(0);
  });

  it("counts a gold skill toward every medal", () => {
    const skills = [trophy("a", "gold"), trophy("b", "bronze"), trophy("c", "locked")];
    expect(countEarnedMedals(skills, "bronze")).toBe(2);
    expect(countEarnedMedals(skills, "silver")).toBe(1);
    expect(countEarnedMedals(skills, "gold")).toBe(1);
  });

  it("treats a higher medal as covering the lower ones", () => {
    expect(medalCoversTier("gold", "bronze")).toBe(true);
    expect(medalCoversTier("silver", "bronze")).toBe(true);
    expect(medalCoversTier("bronze", "silver")).toBe(false);
    expect(medalCoversTier("unlocked", "bronze")).toBe(false);
  });
});
