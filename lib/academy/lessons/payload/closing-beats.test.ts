import { describe, expect, it } from "vitest";

import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import {
  enterThroughClosingBeats,
  resolvePayloadLesson,
} from "@/lib/academy/lessons/payload/map-payload-lesson";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

const screens = (types: string[]) => types.map((type) => ({ type })) as never[];

describe("enterThroughClosingBeats", () => {
  it("plays an unnumbered closing beat before the completion screen", () => {
    const list = screens(["skill-hub", "binary-choice", "narrative-bonus", "completion"]);
    const labels = ["1", "2", "maverick-m1-l9-beat1", "8"];
    expect(enterThroughClosingBeats(list, labels, 3, 0)).toBe(2);
  });

  it("keeps numbered rows and non-completion targets as written", () => {
    const list = screens(["narrative-bonus", "narrative-bonus", "completion"]);
    expect(enterThroughClosingBeats(list, ["7", "7-skip", "8"], 2, 0)).toBe(2);
    expect(enterThroughClosingBeats(list, ["1", "beat", "8"], 1, 0)).toBe(1);
  });

  it("never sends a closing beat back to itself", () => {
    const list = screens(["skill-hub", "narrative-bonus", "completion"]);
    expect(enterThroughClosingBeats(list, ["1", "x-beat1", "8"], 2, 1)).toBe(2);
  });
});

describe("Module 1 lesson 9 skill hub", () => {
  it.each(["explorer", "pathfinder", "maverick"] as MasteryCohort[])(
    "%s Finish plays the closing story beat before the completion screen",
    (cohort) => {
      const bundled = loadBundledLessonPayload(1, 9);
      const completionAt = bundled.screens.findIndex((row) => row.gameType === "completion");
      const perCohort = (value: string) => ({ explorer: value, pathfinder: value, maverick: value });
      // Live content adds an unnumbered closing beat ahead of the completion row.
      const beat = {
        ...bundled.screens[completionAt]!,
        screenLabel: `${cohort}-m1-l9-beat1`,
        screenNumber: 0,
        gameType: "scenario-beat",
        text: perCohort("Penny smiles. You finished every skill."),
        error: perCohort(""),
        settings: perCohort(`ID: ${cohort}-m1-l9-beat1`),
      } as (typeof bundled.screens)[number];
      const payload = {
        ...bundled,
        screens: [
          ...bundled.screens.slice(0, completionAt),
          beat,
          ...bundled.screens.slice(completionAt),
        ],
      };
      const lesson = resolvePayloadLesson(payload, cohort, 9);
      const hub = lesson.screens.find((screen) => screen.type === "skill-hub");
      expect(hub?.type).toBe("skill-hub");
      if (!hub || hub.type !== "skill-hub") return;
      const target = lesson.screens[hub.finishToIndex ?? -1];
      expect(target?.type).toBe("narrative-bonus");
      expect(lesson.screens[(hub.finishToIndex ?? -1) + 1]?.type).toBe("completion");
    },
  );
});
