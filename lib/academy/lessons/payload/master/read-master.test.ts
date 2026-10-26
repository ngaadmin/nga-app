import { readFileSync } from "node:fs";

import { describe, expect, it, vi } from "vitest";

import { getPairSheetImagePath } from "@/lib/academy/illustrations/illustration-registry";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import { assertLessonPayloadAssets } from "@/lib/academy/lessons/payload/validate-lesson-assets";
import { publishMasterModule } from "@/lib/academy/lessons/payload/master/publish-master";
import {
  MASTER_WORKBOOK_PATH,
  masterModuleFromSheets,
  readMasterModule,
} from "@/lib/academy/lessons/payload/master/read-master";
import { readWorkbookSheets } from "@/lib/academy/lessons/payload/parse-authoring-table";

const KNOWN_BLANK_ART: Record<string, number[]> = {
  "Pathfinder M1": [34, 37, 97],
  "Maverick M1": [14, 37, 97, 100],
};

describe("master workbook reader", () => {
  const master = readMasterModule(readFileSync(MASTER_WORKBOOK_PATH));

  it("accepts the workbook and resolves every named picture and clip", () => {
    expect(master.issues).toEqual([]);
    expect(master.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(master.missing.filter((item) => item.kind === "audio")).toEqual([]);
    expect(master.missing.filter((item) => item.kind === "image")).toEqual([]);
    expect(master.byCohort.explorer).toHaveLength(9);
    expect(master.byCohort.pathfinder).toHaveLength(9);
    expect(master.byCohort.maverick).toHaveLength(9);
    expect(
      master.byCohort.explorer[0]?.screens.some((screen) =>
        screen.settings.explorer.includes("explorer-m1-intro-beat1-3cb1a9a8.mp3"),
      ),
    ).toBe(true);
  });

  it("uses Lesson Details for Maverick titles and Senna", () => {
    const maverick = master.byCohort.maverick;
    expect(maverick[0]).toMatchObject({
      lessonTitle: "The spending spree",
      characters: { maverick: "Senna" },
    });
    expect(maverick.find((lesson) => lesson.lessonNumber === 6)?.lessonTitle).toBe(
      "The movie night",
    );
    expect(maverick.find((lesson) => lesson.lessonNumber === 7)?.lessonTitle).toBe(
      "Leveling up",
    );
  });

  it("maps Explorer mia filenames through the existing registry", () => {
    const explorer = readWorkbookSheets(readFileSync(MASTER_WORKBOOK_PATH)).find(
      (sheet) => sheet.name === "Explorer M1",
    );
    const header = explorer?.rows[0]?.values ?? [];
    const imageCol = header.findIndex((name) => name.trim() === "Explorer Image");
    for (const rowNumber of [91, 92, 93]) {
      const row = explorer?.rows.find((entry) => entry.row === rowNumber);
      const fileName = row?.values[imageCol]?.trim() ?? "";
      expect(fileName.toLowerCase().startsWith("mia-")).toBe(true);
      expect(getPairSheetImagePath(fileName)).toMatch(/\/characters\/mia\/Mia-/);
    }
  });

  it("leaves the known art-gap rows blank", () => {
    const sheets = readWorkbookSheets(readFileSync(MASTER_WORKBOOK_PATH));
    for (const [sheetName, rows] of Object.entries(KNOWN_BLANK_ART)) {
      const sheet = sheets.find((entry) => entry.name === sheetName);
      const header = sheet?.rows[0]?.values ?? [];
      const imageCol = header.findIndex((name) => /image$/i.test(name.trim()) && !/name$/i.test(name.trim()));
      for (const rowNumber of rows) {
        const row = sheet?.rows.find((entry) => entry.row === rowNumber);
        expect(row?.values[imageCol]?.trim() ?? "", `${sheetName} row ${rowNumber}`).toBe("");
      }
    }
    expect(Object.values(KNOWN_BLANK_ART).flat()).toHaveLength(7);
  });

  it("resolves every lesson for every cohort", () => {
    for (const cohort of ["explorer", "pathfinder", "maverick"] as const) {
      for (const lesson of master.byCohort[cohort]) {
        expect(() => resolvePayloadLesson(lesson, cohort, lesson.lessonNumber)).not.toThrow();
        expect(() => assertLessonPayloadAssets(lesson, lesson.lessonNumber)).not.toThrow();
      }
    }
  });

  it("rejects a bad row with the sheet name and row number and does not publish", async () => {
    const rejected = masterModuleFromSheets([
      {
        name: "Lesson Details",
        rows: [{ row: 1, values: ["Cohort", "Module Number", "Lesson Number", "Lesson Title", "Level", "Main Character", "Skill Name", "Skill ID"] }],
      },
      {
        name: "Explorer M1",
        rows: [
          {
            row: 1,
            values: ["Module Number", "Lesson Number", "Screen", "Game Type", "Explorer Text", "Explorer Image", "Explorer Settings", "Audio File Name"],
          },
          { row: 4, values: ["1", "0", "1", "word-drop", "Hi", "", "", ""] },
        ],
      },
      {
        name: "Pathfinder M1",
        rows: [
          {
            row: 1,
            values: ["Module Number", "Lesson Number", "Screen", "Game Type", "Pathfinder Text", "Pathfinder Image", "Pathfinder Settings", "Audio File Name"],
          },
        ],
      },
      {
        name: "Maverick M1",
        rows: [
          {
            row: 1,
            values: ["Module Number", "Lesson Number", "Screen", "Game Type", "Maverick Text", "Maverick Image", "Maverick Settings", "Audio File Name"],
          },
        ],
      },
    ]);

    expect(rejected.contentHash).toBe("");
    expect(rejected.byCohort.explorer).toEqual([]);
    expect(rejected.issues).toContainEqual({
      sheet: "Explorer M1",
      row: 4,
      reason: "Lesson Number must be 1 through 9 or Scenario Beat.",
    });
    const save = vi.fn();
    const result = await publishMasterModule(rejected, {
      currentHash: async () => "previous",
      save,
    });
    expect(result).toMatchObject({ ok: false, wrote: false });
    expect(save).not.toHaveBeenCalled();
  });
});
