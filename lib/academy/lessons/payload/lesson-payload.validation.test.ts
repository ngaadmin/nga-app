import { describe, expect, it } from "vitest";

import { cashMatches, unselectedNextIsMistake } from "@/lib/academy/lessons/payload/cash-placeholder";
import { parseDecisionScript } from "@/lib/academy/lessons/payload/decision-choices";
import {
  implicitNextIndex,
  isSiblingBranchLabel,
  lessonNavigationIssues,
  pathProgressPercent,
  shortestCompletionLength,
} from "@/lib/academy/lessons/payload/lesson-graph";
import { loadBundledLessonPayload, loadLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import {
  assertLessonPayloadAssets,
  missingLessonImages,
} from "@/lib/academy/lessons/payload/validate-lesson-assets";
import type { ScreenConfig } from "@/lib/academy/lessons/types";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

const COHORTS: readonly MasteryCohort[] = ["explorer", "pathfinder", "maverick"];
const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
/** Every Module 1 lesson the payload player opens, including lessons 2–5. */
const PLAYABLE = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

function goTargets(settings: string): string[] {
  return [...settings.matchAll(/GO\s+Screen\s+([A-Za-z0-9-]+)/gi)].map(
    (match) => match[1] ?? "",
  );
}

function cohortSettings(
  own: string,
  pathfinder: string,
): string {
  return own.trim() ? own : pathfinder;
}

function labelsOf(screens: readonly ScreenConfig[]): string[] {
  return screens.map((screen) => screen.sourceLabel ?? screen.id);
}

function screenByLabel(screens: readonly ScreenConfig[], label: string): ScreenConfig {
  const screen = screens.find((item) => item.sourceLabel === label);
  if (!screen) throw new Error(`Missing screen ${label}.`);
  return screen;
}

function choiceOptions(screen: ScreenConfig | undefined): {
  label: string;
  emoji?: string;
  goToLabel?: string;
  goToIndex?: number;
  requiresHubSkills?: readonly string[];
}[] {
  if (!screen || !("options" in screen) || !screen.options) return [];
  return screen.options.flatMap((option) =>
    typeof option === "object" && option !== null && "label" in option ? [option] : [],
  );
}

function reachableWithout(
  screens: readonly ScreenConfig[],
  labels: readonly string[],
  start: number,
  blocked: number,
): boolean {
  const seen = new Set<number>();
  const queue = [start];
  while (queue.length > 0) {
    const index = queue.shift();
    if (index === undefined || seen.has(index) || index === blocked) continue;
    seen.add(index);
    const screen = screens[index];
    if (!screen || screen.type === "completion") continue;
    const options = "options" in screen && screen.options ? screen.options : [];
    const jumps = options
      .map((option) => (typeof option === "object" && option ? option.goToIndex : undefined))
      .filter((target): target is number => typeof target === "number");
    const next =
      jumps.length > 0
        ? jumps
        : typeof screen.continueToIndex === "number"
          ? [screen.continueToIndex]
          : [];
    queue.push(...next);
  }
  return [...seen].some((index) => screens[index]?.type === "completion" || labels[index] === "5" || labels[index] === "8");
}

describe("bundled lesson payloads", () => {
  it("resolves every playable lesson and checks every lesson's links and images", () => {
    for (const lessonNumber of LESSONS) {
      const payload = loadBundledLessonPayload(1, lessonNumber);
      expect(missingLessonImages(payload), `lesson ${lessonNumber} images`).toEqual([]);
      const known = new Set(payload.screens.map((screen) => screen.screenLabel.toLowerCase()));
      for (const screen of payload.screens) {
        for (const cohort of COHORTS) {
          const settings = cohortSettings(screen.settings[cohort], screen.settings.pathfinder);
          for (const target of goTargets(settings)) {
            expect(known.has(target.toLowerCase()), `L${lessonNumber} ${cohort} ${screen.screenLabel} → ${target}`).toBe(true);
          }
        }
      }
    }

    for (const lessonNumber of PLAYABLE) {
      const payload = loadBundledLessonPayload(1, lessonNumber);
      assertLessonPayloadAssets(payload, lessonNumber);
      for (const cohort of COHORTS) {
        const content = resolvePayloadLesson(payload, cohort, lessonNumber);
        const labels = labelsOf(content.screens);
        expect(
          lessonNavigationIssues(content.screens, labels),
          `lesson ${lessonNumber} ${cohort}`,
        ).toEqual([]);
        expect(content.screens.at(-1)?.type).toBe("completion");
      }
    }
  });

  it("throws when a GO target does not exist", () => {
    const payload = loadLessonPayload({
      moduleNumber: 1,
      lessonNumber: 8,
      lessonDetails: {
        filename: "Lesson-Details.csv",
        text: `Module Number,Lesson Number,Field,Value
1,8,Lesson Title,Making choices
1,8,Level,1
1,8,Pathfinder Character,Holly
1,8,Explorer Character,Lars
1,8,Maverick Character,Aiden
1,8,Skill Name,
1,8,Skill ID,
`,
      },
      screens: {
        filename: "Screens.csv",
        text: `Module Number,Lesson Number,Screen,Game Type,Explorer Text,Pathfinder Text,Maverick Text,Explorer Image,Pathfinder Image,Maverick Image,Explorer Settings,Game Settings,Maverick Settings,Error Explorer,Error Pathfinder,Error Maverick,Notes
1,8,1,binary-choice,Pick,Pick,Pick,,,,"CHOICE A: Go → GO Screen 4-no","CHOICE A: Go → GO Screen 4-no","CHOICE A: Go → GO Screen 4-no",,,,
1,8,2,completion,,,,,,,,,,,,,,,
`,
      },
    });
    expect(() => resolvePayloadLesson(payload, "pathfinder", 8)).toThrow(/missing screen "4-no"/);
  });

  it("throws when a rendered image file is missing", () => {
    const payload = loadLessonPayload({
      moduleNumber: 1,
      lessonNumber: 7,
      lessonDetails: {
        filename: "Lesson-Details.csv",
        text: `Module Number,Lesson Number,Field,Value
1,7,Lesson Title,Levelling up
1,7,Level,1
1,7,Pathfinder Character,Holly
1,7,Explorer Character,Lars
1,7,Maverick Character,Aiden
`,
      },
      screens: {
        filename: "Screens.csv",
        text: `Module Number,Lesson Number,Screen,Game Type,Explorer Text,Pathfinder Text,Maverick Text,Explorer Image,Pathfinder Image,Maverick Image,Explorer Settings,Game Settings,Maverick Settings,Error Explorer,Error Pathfinder,Error Maverick,Notes
1,7,1,binary-choice,Hi,Hi,Hi,Holly.walking.webp,Holly.walking.webp,Holly.walking.webp,,,,,,,
1,7,2,completion,,,,,,,,,,,
`,
      },
    });
    expect(missingLessonImages(payload).map((item) => item.fileName)).toContain("Holly.walking.webp");
    expect(() => assertLessonPayloadAssets(payload, 7)).toThrow(/Holly\.walking\.webp/);
  });

  it("does not walk a branch screen into its sibling when GO is missing", () => {
    expect(isSiblingBranchLabel("4", "4-alt")).toBe(true);
    expect(isSiblingBranchLabel("4", "5")).toBe(false);
    expect(implicitNextIndex(0, ["4", "4-alt", "5"])).toBe(2);
    expect(implicitNextIndex(1, ["4", "4-alt", "5"])).toBe(2);
    expect(implicitNextIndex(0, ["1", "2", "3"])).toBe(1);
  });

  it("negates an equals cash check on the otherwise branch", () => {
    const script = parseDecisionScript(
      `IF cash = 5 THEN
CHOICE A: Cheaper → GO Screen 7
ELSE show button "Keep it" → GO Screen 8`,
    );
    expect(script?.choices[1]?.showWhen).toEqual({ op: "neq", amount: 5 });
    expect(cashMatches({ op: "neq", amount: 5 }, 5)).toBe(false);
    expect(cashMatches({ op: "neq", amount: 5 }, 14)).toBe(true);
    expect(cashMatches({ op: "eq", amount: 5 }, null)).toBe(true);
  });

  it("does not count an empty Next on a free decision as a mistake", () => {
    expect(unselectedNextIsMistake(true)).toBe(false);
    expect(unselectedNextIsMistake(false)).toBe(true);
    expect(unselectedNextIsMistake(undefined)).toBe(true);
  });

  it("fills the progress bar from steps taken, including a jump over a sibling", () => {
    expect(pathProgressPercent(0, 8, false)).toBe(0);
    expect(pathProgressPercent(1, 8, false)).toBe(14);
    expect(pathProgressPercent(2, 8, false)).toBe(29);
    const step = pathProgressPercent(3, 8, false) - pathProgressPercent(2, 8, false);
    const jumped = pathProgressPercent(4, 8, false) - pathProgressPercent(3, 8, false);
    expect(jumped).toBeLessThanOrEqual(step + 1);
    expect(pathProgressPercent(6, 8, false)).toBeLessThan(100);
    expect(pathProgressPercent(20, 8, false)).toBe(99);
    expect(pathProgressPercent(20, 8, true)).toBe(100);
  });

  it("reconverges lesson 8 after each decision and shows only the chosen outcome", () => {
    for (const cohort of COHORTS) {
      const content = resolvePayloadLesson(loadBundledLessonPayload(1, 8), cohort, 8);
      const labels = labelsOf(content.screens);
      const decision1 = content.screens.findIndex((screen) => screen.sourceLabel === "3");
      const decision2 = content.screens.findIndex((screen) => screen.sourceLabel === "6");
      const sharedAfter1 = labels.indexOf("5");
      const sharedAfter2 = labels.indexOf("8");
      const completion = labels.indexOf("9");
      expect(decision1).toBeGreaterThanOrEqual(0);
      expect(sharedAfter2).toBeGreaterThan(decision2);
      expect(completion).toBeGreaterThan(sharedAfter2);

      expect(choiceOptions(content.screens[decision1]).map((option) => option.goToLabel)).toEqual([
        "4",
        "4-alt",
      ]);
      expect(choiceOptions(content.screens[decision2]).map((option) => option.goToLabel)).toEqual([
        "7",
        "7-skip",
        "7-alt",
        "7-home",
      ]);

      for (const label of ["4", "4-alt"]) {
        const index = labels.indexOf(label);
        expect(content.screens[index]?.continueToIndex).toBe(sharedAfter1);
      }
      for (const label of ["7", "7-skip", "7-alt", "7-home"]) {
        expect(content.screens[labels.indexOf(label)]?.continueToIndex).toBe(sharedAfter2);
      }

      const cinemaOptions = choiceOptions(screenByLabel(content.screens, "6"));
      if (cinemaOptions.length === 0) throw new Error("Screen 6 has no choices.");
      for (const option of cinemaOptions) {
        const outcome = content.screens[option.goToIndex ?? -1];
        const prompt = outcome && "prompt" in outcome ? outcome.prompt : "";
        expect(prompt).toContain(option.label);
        expect(prompt).not.toMatch(/If you picked/i);
        for (const other of cinemaOptions) {
          if (other.label === option.label) continue;
          expect(prompt).not.toContain(other.label);
        }
      }

      const joined = labels.indexOf("4");
      const skipped = labels.indexOf("4-alt");
      expect(reachableWithout(content.screens, labels, joined, skipped)).toBe(true);
      expect(reachableWithout(content.screens, labels, skipped, joined)).toBe(true);
      expect(labels).not.toContain("4-no");
      expect(shortestCompletionLength(content.screens, labels)).toBe(12);
    }
  });

  it("lets lesson 9 finish only after every skill returns to the hub", () => {
    for (const cohort of COHORTS) {
      const content = resolvePayloadLesson(loadBundledLessonPayload(1, 9), cohort, 9);
      const hub = content.screens[0];
      expect(hub?.skillHub).toBe(true);
      expect(choiceOptions(hub).map((option) => option.label)).toEqual([
        "Stop & Think",
        "Put Needs First",
        "Keep Spare Cash",
        "Finish",
      ]);
      const finish = choiceOptions(hub).find((option) => option.label === "Finish");
      expect(finish?.goToLabel).toBe("8");
      expect(finish?.requiresHubSkills).toEqual(["2", "4", "6"]);
      expect(content.screens.find((screen) => screen.sourceLabel === "3")?.continueToLabel).toBe("1");
      expect(content.screens.find((screen) => screen.sourceLabel === "5")?.continueToLabel).toBe("1");
      expect(content.screens.find((screen) => screen.sourceLabel === "6")?.continueToLabel).toBe("7");
      expect(content.screens.find((screen) => screen.sourceLabel === "7")?.continueToLabel).toBe("1");
      expect(content.screens.find((screen) => screen.sourceLabel === "3")?.hubSkillKey).toBe("2");
      expect(content.screens.find((screen) => screen.sourceLabel === "5")?.hubSkillKey).toBe("4");
      expect(content.screens.find((screen) => screen.sourceLabel === "7")?.hubSkillKey).toBe("6");
      expect(shortestCompletionLength(content.screens, labelsOf(content.screens))).toBeGreaterThan(8);
      expect(content.screens.at(-1)?.type).toBe("completion");
    }
  });

  it("keeps lesson 1 on its original eight-screen path", () => {
    const content = resolvePayloadLesson(loadBundledLessonPayload(1, 1), "explorer", 1);
    expect(content.screens.map((screen) => screen.sourceLabel)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
    ]);
    const closer = content.screens[6];
    expect(closer).toMatchObject({
      type: "narrative-bonus",
      resolution: true,
      bonusXp: 0,
      autoReadyWhenNoBonus: true,
      continueToIndex: 7,
    });
    expect(closer && "narrative" in closer ? closer.narrative : "").toMatch(/freeze worked/i);
  });

  it("uses a leading choice emoji as the button orb and leaves the label", () => {
    const details = [
      "Module Number,Lesson Number,Field,Value",
      "1,1,Lesson Title,Emoji",
      "1,1,Level,1",
      "1,1,Skill Name,",
      "1,1,Skill ID,",
    ].join("\n");
    const choice =
      "CHOICE A: 🍬 Buy the sweets → GO Screen 2\nCHOICE B: Skip it → GO Screen 2";
    const screens = [
      "Module Number,Lesson Number,Screen,Game Type,Explorer Text,Pathfinder Text,Maverick Text,Explorer Image,Pathfinder Image,Maverick Image,Explorer Settings,Game Settings,Maverick Settings,Error Explorer,Error Pathfinder,Error Maverick,Notes",
      `1,1,1,spotlight-rounds,Pick,Pick,Pick,,,,"${choice}","${choice}","${choice}",,,,`,
      "1,1,2,completion,,,,,,,,,,MEDAL: none,,,",
    ].join("\n");
    const content = resolvePayloadLesson(
      loadLessonPayload({
        moduleNumber: 1,
        lessonNumber: 1,
        screens: { filename: "screens.csv", text: screens },
        lessonDetails: { filename: "details.csv", text: details },
      }),
      "pathfinder",
      1,
    );
    const decision = content.screens[0];
    expect(choiceOptions(decision)).toEqual([
      expect.objectContaining({ emoji: "🍬", label: "Buy the sweets", goToLabel: "2" }),
      expect.objectContaining({ label: "Skip it", goToLabel: "2" }),
    ]);
    expect(choiceOptions(decision)[1]?.emoji).toBeUndefined();
  });

  it("keeps blank skill ids on lessons 7–9 and golds lesson 9 from the sheet", () => {
    for (const lesson of [7, 8, 9] as const) {
      const payload = loadBundledLessonPayload(1, lesson);
      expect(payload.skillId).toBe("");
      expect(payload.skillName).toBe("");
      for (const cohort of COHORTS) {
        const content = resolvePayloadLesson(payload, cohort, lesson);
        expect(content.rewards.skillSlug).toBe("");
        expect(content.screens.at(-1)?.type).toBe("completion");
      }
    }
    const lesson9 = resolvePayloadLesson(loadBundledLessonPayload(1, 9), "pathfinder", 9);
    const lesson7 = resolvePayloadLesson(loadBundledLessonPayload(1, 7), "pathfinder", 7);
    const lesson8 = resolvePayloadLesson(loadBundledLessonPayload(1, 8), "maverick", 8);
    expect(lesson9.screens.at(-1)).toMatchObject({ type: "completion", medalTier: "gold" });
    expect(lesson7.screens.at(-1)).not.toHaveProperty("medalTier");
    expect(lesson8.screens.at(-1)).not.toHaveProperty("medalTier");
  });
});
