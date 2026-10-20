import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  blankHeartErrorKey,
  findBlankHeartErrors,
  formatBlankHeartErrorDoc,
  screenHeartCost,
  type BlankHeartErrorKey,
} from "@/lib/academy/lessons/payload/heart-cost";
import { M1_BLANK_HEART_ERRORS } from "@/lib/academy/lessons/payload/m1-blank-error-allowlist";
import { loadLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { parseAuthoringTable } from "@/lib/academy/lessons/payload/parse-authoring-table";
import type { LessonPayload } from "@/lib/academy/lessons/payload/types";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";

const SOURCE_DIR = path.join(process.cwd(), "lib/academy/lessons/payload/source");

function loadEveryCheckedInLesson(): LessonPayload[] {
  const details = readFileSync(path.join(SOURCE_DIR, "Lesson-Details.csv"), "utf8");
  const payloads: LessonPayload[] = [];
  for (const filename of readdirSync(SOURCE_DIR)) {
    if (!/^screens.*\.csv$/i.test(filename)) continue;
    const text = readFileSync(path.join(SOURCE_DIR, filename), "utf8");
    const table = parseAuthoringTable({ filename, text });
    const header = table[0] ?? [];
    const moduleIndex = header.findIndex(
      (name) => name.trim().toLowerCase() === "module number",
    );
    const lessonIndex = header.findIndex(
      (name) => name.trim().toLowerCase() === "lesson number",
    );
    const seen = new Set<string>();
    for (const row of table.slice(1)) {
      const moduleNumber = Number(row[moduleIndex] ?? "");
      const lessonNumber = Number(row[lessonIndex] ?? "");
      if (!moduleNumber || !lessonNumber) continue;
      const key = `${moduleNumber}:${lessonNumber}`;
      if (seen.has(key)) continue;
      seen.add(key);
      payloads.push(
        loadLessonPayload({
          moduleNumber,
          lessonNumber,
          screens: { filename, text },
          lessonDetails: { filename: "Lesson-Details.csv", text: details },
        }),
      );
    }
  }
  return payloads.sort(
    (left, right) =>
      left.moduleNumber - right.moduleNumber || left.lessonNumber - right.lessonNumber,
  );
}

function sortedKeys(entries: readonly BlankHeartErrorKey[]): string[] {
  return entries.map((entry) => blankHeartErrorKey(entry)).sort();
}

describe("heart-costing screens need error text", () => {
  const payloads = loadEveryCheckedInLesson();
  const blanks = payloads.flatMap((payload) => findBlankHeartErrors(payload));

  it("matches the temporary Module 1 allowlist and rejects every other blank", () => {
    const module1 = blanks.filter((blank) => blank.moduleNumber === 1);
    const elsewhere = blanks.filter((blank) => blank.moduleNumber !== 1);
    expect(elsewhere, "new lessons cannot ship a blank Error cell").toEqual([]);
    expect(sortedKeys(module1)).toEqual(sortedKeys(M1_BLANK_HEART_ERRORS));
    expect(M1_BLANK_HEART_ERRORS.length).toBeGreaterThan(0);
  });

  it("keeps the writer list in docs/m1-blank-errors.md", () => {
    const docPath = path.join(process.cwd(), "docs/m1-blank-errors.md");
    const doc = readFileSync(docPath, "utf8");
    const module1 = blanks.filter((blank) => blank.moduleNumber === 1);
    expect(doc).toBe(formatBlankHeartErrorDoc(module1));
    expect(doc).toContain("Storybird");
    expect(doc).toContain("temporary");
  });

  it("marks the allowlist temporary until Storybird fills the cells", () => {
    const source = readFileSync(
      path.join(process.cwd(), "lib/academy/lessons/payload/m1-blank-error-allowlist.ts"),
      "utf8",
    );
    expect(source.toLowerCase()).toContain("temporary");
    expect(source).toContain("Storybird");
  });

  it("does not score story cards, free choices, tap-reveal, the hub, or a single spent bucket", () => {
    const lesson = (lessonNumber: number) => {
      const payload = payloads.find((item) => item.moduleNumber === 1 && item.lessonNumber === lessonNumber);
      if (!payload) throw new Error(`Missing lesson ${lessonNumber}`);
      return resolvePayloadLesson(payload, "explorer", lessonNumber);
    };

    const screen = (lessonNumber: number, label: string) => {
      const found = lesson(lessonNumber).screens.find((item) => item.sourceLabel === label);
      if (!found) throw new Error(`Missing lesson ${lessonNumber} screen ${label}`);
      return found;
    };

    expect(screenHeartCost(screen(8, "1")).costsHeart).toBe(false);
    expect(screenHeartCost(screen(8, "1-buy")).costsHeart).toBe(false);
    expect(screenHeartCost(screen(1, "3")).costsHeart).toBe(false);
    expect(screenHeartCost(screen(9, "1")).costsHeart).toBe(false);
    expect(screenHeartCost(screen(3, "2")).costsHeart).toBe(false);
    expect(screenHeartCost(screen(3, "7")).costsHeart).toBe(false);

    expect(screenHeartCost(screen(1, "6"))).toMatchObject({
      costsHeart: true,
      wrongAnswer: "letting go early",
    });
    expect(screenHeartCost(screen(2, "6"))).toMatchObject({
      costsHeart: true,
      wrongAnswer: "a wrong order on Submit",
    });
    expect(screenHeartCost(screen(1, "4"))).toMatchObject({
      costsHeart: true,
      wrongAnswer: "a drop in the wrong bucket",
    });
  });
});
