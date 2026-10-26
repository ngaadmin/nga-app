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

/** Picture cells that literally say "not allowed". The reader treats each as no picture. */
const NOT_ALLOWED_IMAGE_ROWS: Record<string, number[]> = {
  "M1 Explorer": [5, 6, 15, 20, 27, 28, 29, 33, 38, 39, 44, 52, 55, 62, 65],
  "M1 Pathfinder": [5, 29, 33, 38, 39, 44, 65],
  "M1 Maverick": [5, 29, 33, 38, 39, 44, 65],
};

const SCREEN_HEADER = [
  "Module Number",
  "Lesson Number",
  "Screen",
  "Game Type",
  "Explorer Text",
  "Explorer Image",
  "Explorer Settings",
  "Audio File Name",
];

function cohortHeader(label: string): string[] {
  return SCREEN_HEADER.map((name) => name.replace("Explorer", label));
}

function lessonRows(label: string, text: string): { row: number; values: string[] }[] {
  const rows = [{ row: 1, values: cohortHeader(label) }];
  for (let lesson = 1; lesson <= 9; lesson += 1) {
    rows.push({
      row: lesson + 1,
      values: ["1", String(lesson), "1", "word-drop", text, "", "OPTIONS: a\nCORRECT: a", ""],
    });
  }
  return rows;
}

function lessonDetailsSheet(): { name: string; rows: { row: number; values: string[] }[] } {
  const rows = [
    {
      row: 1,
      values: ["Cohort", "Module Number", "Lesson Number", "Lesson Title", "Level", "Main Character", "Skill Name", "Skill ID"],
    },
  ];
  let row = 2;
  for (const [cohort, lead] of [
    ["Explorer", "Lars"],
    ["Pathfinder", "Holly"],
    ["Maverick", "Senna"],
  ] as const) {
    for (let lesson = 1; lesson <= 9; lesson += 1) {
      rows.push({
        row,
        values: [cohort, "1", String(lesson), `Lesson ${lesson}`, "1", lead, "", ""],
      });
      row += 1;
    }
  }
  return { name: "Lesson Details", rows };
}

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
      (sheet) => sheet.name === "M1 Explorer" || sheet.name === "Explorer M1",
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

  it("treats a literal not allowed picture cell as no picture", () => {
    const sheets = readWorkbookSheets(readFileSync(MASTER_WORKBOOK_PATH));
    for (const [sheetName, rows] of Object.entries(NOT_ALLOWED_IMAGE_ROWS)) {
      const sheet = sheets.find((entry) => entry.name === sheetName);
      const header = sheet?.rows[0]?.values ?? [];
      const imageCol = header.findIndex((name) => /image$/i.test(name.trim()) && !/name$/i.test(name.trim()));
      for (const rowNumber of rows) {
        const row = sheet?.rows.find((entry) => entry.row === rowNumber);
        expect(row?.values[imageCol]?.trim() ?? "", `${sheetName} row ${rowNumber}`).toBe("not allowed");
      }
    }
    expect(master.missing.some((item) => item.name.toLowerCase() === "not allowed")).toBe(false);
    expect(master.issues).toEqual([]);
    expect(Object.values(NOT_ALLOWED_IMAGE_ROWS).flat()).toHaveLength(29);
  });

  it("resolves versioned pair, Mia, and app-medal filenames", () => {
    expect(getPairSheetImagePath("lars-mason-chatting-512.webp")).toBe(
      "/assets/illustrations/pairs/lars-mason-chatting-512.webp",
    );
    expect(getPairSheetImagePath("holly-senna-sidebyside-r1-512.webp")).toBe(
      "/assets/illustrations/pairs/holly-senna-sidebyside-r1-512.webp",
    );
    expect(getPairSheetImagePath("senna-older-max-chatting-r1-512.webp")).toBe(
      "/assets/illustrations/pairs/senna-older-max-chatting-r1-512.webp",
    );
    expect(getPairSheetImagePath("Mia-thinking-512.webp")).toBe(
      "/assets/illustrations/characters/mia/Mia-thinking-512.webp",
    );
    expect(getPairSheetImagePath("medal-skill1-bronze-app.webp")).toBe(
      "/assets/illustrations/medal/medal-skill1-bronze-app.webp",
    );
    expect(getPairSheetImagePath("senna-older-thinking-r1-512.webp")).toBe(
      "/assets/illustrations/characters/senna-older/senna-older-thinking-r1-512.webp",
    );
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
        name: "M1 Explorer",
        rows: [
          {
            row: 1,
            values: ["Module Number", "Lesson Number", "Screen", "Game Type", "Explorer Text", "Explorer Image", "Explorer Settings", "Audio File Name"],
          },
          { row: 4, values: ["1", "0", "1", "word-drop", "Hi", "", "", ""] },
        ],
      },
      {
        name: "M1 Pathfinder",
        rows: [
          {
            row: 1,
            values: ["Module Number", "Lesson Number", "Screen", "Game Type", "Pathfinder Text", "Pathfinder Image", "Pathfinder Settings", "Audio File Name"],
          },
        ],
      },
      {
        name: "M1 Maverick",
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
      sheet: "M1 Explorer",
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

  it("reads M1 tabs and ignores header-only M2 tabs", () => {
    const read = masterModuleFromSheets([
      lessonDetailsSheet(),
      {
        name: "M2 Explorer",
        rows: [
          { row: 1, values: cohortHeader("Explorer") },
          { row: 2, values: ["1", "0", "1", "word-drop", "M2 must not load", "", "", ""] },
        ],
      },
      { name: "M2 Pathfinder", rows: [{ row: 1, values: cohortHeader("Pathfinder") }] },
      { name: "M2 Maverick", rows: [{ row: 1, values: cohortHeader("Maverick") }] },
      { name: "M1 Explorer", rows: lessonRows("Explorer", "From M1 Explorer") },
      { name: "M1 Pathfinder", rows: lessonRows("Pathfinder", "From M1 Pathfinder") },
      { name: "M1 Maverick", rows: lessonRows("Maverick", "From M1 Maverick") },
    ]);

    expect(read.issues).toEqual([]);
    expect(read.contentHash).toMatch(/^[0-9a-f]{64}$/);
    expect(read.byCohort.explorer).toHaveLength(9);
    expect(read.byCohort.explorer[0]?.screens[0]?.text.explorer).toBe("From M1 Explorer");
    expect(read.byCohort.maverick[0]).toMatchObject({
      lessonTitle: "Lesson 1",
      characters: { maverick: "Senna" },
    });
    expect(read.issues.some((issue) => issue.sheet.startsWith("M2"))).toBe(false);
  });

  it("still reads legacy Explorer M1 sheet names", () => {
    const read = masterModuleFromSheets([
      lessonDetailsSheet(),
      {
        name: "Explorer M2",
        rows: [
          { row: 1, values: cohortHeader("Explorer") },
          { row: 2, values: ["2", "1", "1", "word-drop", "Not module 1", "", "", ""] },
        ],
      },
      { name: "Explorer M1", rows: lessonRows("Explorer", "Legacy explorer") },
      { name: "Pathfinder M1", rows: lessonRows("Pathfinder", "Legacy pathfinder") },
      { name: "Maverick M1", rows: lessonRows("Maverick", "Legacy maverick") },
    ]);

    expect(read.issues).toEqual([]);
    expect(read.byCohort.explorer[0]?.screens[0]?.text.explorer).toBe("Legacy explorer");
    expect(read.byCohort.pathfinder[0]?.screens[0]?.text.pathfinder).toBe("Legacy pathfinder");
    expect(read.byCohort.maverick[0]?.screens[0]?.text.maverick).toBe("Legacy maverick");
  });

  it("names the missing M1 tab when a cohort sheet is absent", () => {
    const read = masterModuleFromSheets([
      lessonDetailsSheet(),
      { name: "M2 Explorer", rows: [{ row: 1, values: cohortHeader("Explorer") }] },
    ]);
    expect(read.contentHash).toBe("");
    expect(read.issues).toContainEqual({
      sheet: "M1 Explorer",
      row: 1,
      reason: 'No sheet named "M1 Explorer".',
    });
  });
});
