import { beforeEach, describe, expect, it, vi } from "vitest";
import { presentedCompletionMedals, moduleCloserGoldSkillLine } from "@/lib/academy/lessons/completion-screen";
import { awardSkillMedalsOnCashIn } from "@/lib/dashboard/skill-trophies";
import { readVaultSkillTierOverrides, setVaultSkillTierOverride } from "@/lib/dashboard/vault-skill-progress-storage";
import { medalIdForSkillNumber } from "@/lib/academy/illustrations/medal-registry";
import {
  lessonSkillAwards,
  moduleCloserSkillNames,
} from "@/lib/skills/lesson-skill-award";
import { skillsForLevel, type SkillLevelId } from "@/lib/skills/skills-registry";

const MODULES: { moduleNumber: SkillLevelId; names: string[]; medalId: string }[] = [
  {
    moduleNumber: 1,
    medalId: "medal-skill1-gold",
    names: [
      "Catch Impulse Spending",
      "Choose Needs Over Wants",
      "Don't Spend Money You Don't Have",
    ],
  },
  {
    moduleNumber: 2,
    medalId: "medal-skill4-gold",
    names: [
      "Create Value People Will Pay For",
      "Find & Close Simple Opportunities",
      "Track What You Earn and Spend",
    ],
  },
  {
    moduleNumber: 3,
    medalId: "medal-skill7-gold",
    names: [
      "Run a Simple Money System",
      "Protect a Safety Buffer",
      "Review Your Numbers",
    ],
  },
  {
    moduleNumber: 4,
    medalId: "medal-skill10-gold",
    names: [
      "Understand Assets vs Liabilities",
      "Understand Compounding & Starting Young",
      "Put Money to Work",
    ],
  },
  {
    moduleNumber: 5,
    medalId: "medal-skill13-gold",
    names: [
      "Increase the Value of What You Offer",
      "Expand or Improve Income Streams",
      "Manage Basic Downside Risk in Earning",
    ],
  },
  {
    moduleNumber: 6,
    medalId: "medal-skill16-gold",
    names: [
      "Spot Where You Are Still the Bottleneck",
      "Design Ownership Instead of Just Work",
      "Replace Yourself with a System, Person or Tool",
    ],
  },
];

function stubStorage(): void {
  const memory = new Map<string, string>();
  const storage = {
    getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => {
      memory.set(key, value);
    },
    removeItem: (key: string) => {
      memory.delete(key);
    },
    key: (index: number) => [...memory.keys()][index] ?? null,
    get length() {
      return memory.size;
    },
  };
  vi.stubGlobal("window", {
    localStorage: storage,
    sessionStorage: storage,
    dispatchEvent: () => true,
  });
  vi.stubGlobal("localStorage", storage);
  vi.stubGlobal("sessionStorage", storage);
}

describe("module closer gold skills", () => {
  beforeEach(() => {
    stubStorage();
  });

  for (const moduleCase of MODULES) {
    it(`module ${moduleCase.moduleNumber} lesson 9 lists three registry names and one medal`, () => {
      const names = moduleCloserSkillNames(moduleCase.moduleNumber, "explorer");
      expect(names).toEqual(moduleCase.names);
      expect(names).toEqual(
        skillsForLevel(moduleCase.moduleNumber).map((skill) => skill.skillName),
      );
      expect(moduleCloserGoldSkillLine(moduleCase.moduleNumber)?.text).toBe(
        `Turned gold: ${moduleCase.names.join(", ")}`,
      );
      expect(moduleCloserGoldSkillLine(moduleCase.moduleNumber)?.medal).toBe("🥇");

      const medals = presentedCompletionMedals({
        lessonNumber: 9,
        moduleNumber: moduleCase.moduleNumber,
        skillMedalTier: "gold",
        medalId: "medal-skill1-unlocked",
        authoredMedal: true,
      });
      expect(medals).toHaveLength(1);
      expect(medals[0]?.medalId).toBe(moduleCase.medalId);
      expect(medals.map((medal) => medal.medalId)).toEqual([
        medalIdForSkillNumber((moduleCase.moduleNumber - 1) * 3 + 1, "gold"),
      ]);

      const awards = lessonSkillAwards(moduleCase.moduleNumber, 9);
      expect(awards).toHaveLength(3);
      expect(awards.every((award) => award.tier === "gold")).toBe(true);

      for (const award of awards) {
        setVaultSkillTierOverride(award.slug, "silver");
      }
      const milestoneId = (moduleCase.moduleNumber - 1) * 9 + 9;
      const earned = awardSkillMedalsOnCashIn({
        milestoneId,
        masteryCohort: "maverick",
        skillSlug: awards[0]?.slug,
        skillAwardTier: "gold",
      });
      expect(earned.map((medal) => medal.slug).sort()).toEqual(
        awards.map((award) => award.slug).sort(),
      );
      expect(earned.every((medal) => medal.tier === "gold")).toBe(true);
      const stored = readVaultSkillTierOverrides();
      for (const award of awards) {
        expect(stored[award.slug]).toBe("gold");
      }
    });
  }
});
