import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fieldsAnswer } from "@/lib/launchpad/content/answers";
import { filledSentence, summaryCatalog } from "@/lib/launchpad/content/summary";
import type { LaunchpadShortTextScreen } from "@/lib/launchpad/content/types";
import { DOG_WALKING_LOAD_PATH } from "@/lib/launchpad/load/paths";
import type { LaunchpadLoadFile } from "@/lib/launchpad/load/types";

const LOAD = JSON.parse(readFileSync(path.join(process.cwd(), DOG_WALKING_LOAD_PATH), "utf8")) as LaunchpadLoadFile;
const OTHER = findOther(LOAD);

function findOther(load: unknown): LaunchpadShortTextScreen | undefined {
  let hit: LaunchpadShortTextScreen | undefined;
  JSON.stringify(load, (_k, v) => {
    if (v && typeof v === "object" && (v as { answerKey?: string }).answerKey === "l1-goal-other" && (v as { type?: string }).type === "short-text") hit = v as LaunchpadShortTextScreen;
    return v;
  });
  return hit;
}

describe("Add another goal: one inline sentence, optional duration, no number (Cath, 4 Nov 8:54pm)", () => {
  const screen = OTHER!;
  const catalog = summaryCatalog([]);
  const say = (values: Record<string, string | number>) => filledSentence(screen, { "l1-goal-other": fieldsAnswer(values, false) }, catalog);

  it("is built inline from the sentence, with no extra boxes and no number field", () => {
    expect(screen.extraFields ?? []).toEqual([]);
    expect(screen.fields.map((f) => f.name)).toEqual(["goalText", "timeframeNumber", "timeframeUnit"]);
    expect(screen.fields.every((f) => f.optional)).toBe(true);
    expect(screen.optional).toBe(true);
    expect(screen.parts.map((p) => (p.kind === "text" ? p.text : "_")).join("")).toBe("My goal is to _ in _ _.");
  });

  it("reads as one sentence; an empty duration drops with its 'in'", () => {
    expect(say({ goalText: "save up", timeframeNumber: 6, timeframeUnit: "weeks" })).toBe("My goal is to save up in 6 weeks.");
    expect(say({ goalText: "save up" })).toBe("My goal is to save up.");
    expect(say({})).toBeNull();
  });
});
