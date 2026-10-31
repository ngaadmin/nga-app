import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it, vi } from "vitest";

import {
  characterPoseFilePath,
  getPairSheetImagePath,
} from "@/lib/academy/illustrations/illustration-registry";
import { celebratingPortraitSrc } from "@/lib/academy/lessons/celebrating-portrait";
import { lessonImageSrcs } from "@/lib/academy/lessons/lesson-image-srcs";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import { assertLessonPayloadAssets } from "@/lib/academy/lessons/payload/validate-lesson-assets";
import { publishMasterDraft } from "@/lib/academy/lessons/payload/master/publish-master";
import {
  MASTER_WORKBOOK_PATH,
  masterModuleFromSheets,
  readMasterModule,
} from "@/lib/academy/lessons/payload/master/read-master";
import { readWorkbookSheets } from "@/lib/academy/lessons/payload/parse-authoring-table";
import { mediaBaseName } from "@/lib/academy/media/academy-media";
import { isHeldLarsMedia } from "@/lib/academy/media/held-media";
import { planMediaUploads } from "@/lib/academy/media/media-sync";

vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test-project.supabase.co");

const M1_SHEETS = ["M1 Explorer", "M1 Pathfinder", "M1 Maverick"] as const;

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
    const sheetNames = readWorkbookSheets(readFileSync(MASTER_WORKBOOK_PATH)).map((sheet) => sheet.name);
    expect(sheetNames).toEqual([
      "M1 Explorer",
      "M1 Pathfinder",
      "M1 Maverick",
      "M2 Explorer",
      "M2 Pathfinder",
      "M2 Maverick",
      "Lesson Details",
    ]);
    expect(master.issues).toEqual([]);
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

  it("resolves the Explorer picture cells on rows 91 through 93", () => {
    const explorer = readWorkbookSheets(readFileSync(MASTER_WORKBOOK_PATH)).find(
      (sheet) => sheet.name === "M1 Explorer" || sheet.name === "Explorer M1",
    );
    const header = explorer?.rows[0]?.values ?? [];
    const imageCol = header.findIndex((name) => name.trim() === "Explorer Image");
    const expected: Record<number, string> = {
      91: "/assets/illustrations/pairs/lars-mia-chatting.webp",
      92: "/assets/illustrations/pairs/lars-mia-sidebyside.webp",
      93: "/assets/illustrations/concepts/concept-piggy-bank-r2.webp",
    };
    for (const [rowNumber, path] of Object.entries(expected)) {
      const row = explorer?.rows.find((entry) => entry.row === Number(rowNumber));
      const fileName = row?.values[imageCol]?.trim() ?? "";
      expect(getPairSheetImagePath(fileName), `row ${rowNumber}`).toBe(path);
    }
  });

  it("names a picture on every M1 row and still drops a blank or not allowed cell", () => {
    const sheets = readWorkbookSheets(readFileSync(MASTER_WORKBOOK_PATH));
    for (const sheetName of M1_SHEETS) {
      const sheet = sheets.find((entry) => entry.name === sheetName);
      const header = sheet?.rows[0]?.values ?? [];
      const imageCol = header.findIndex(
        (name) => /image$/i.test(name.trim()) && !/name$/i.test(name.trim()),
      );
      expect(sheet?.rows.slice(1).length ?? 0).toBe(110);
      for (const row of sheet?.rows.slice(1) ?? []) {
        const value = row.values[imageCol]?.trim() ?? "";
        expect(value, `${sheetName} row ${row.row}`).not.toBe("");
        expect(value.toLowerCase(), `${sheetName} row ${row.row}`).not.toBe("not allowed");
      }
    }
    expect(master.missing.filter((item) => item.kind === "image")).toEqual([]);
    expect(master.missing.some((item) => item.name.toLowerCase() === "not allowed")).toBe(false);

    const dropped = masterModuleFromSheets([
      lessonDetailsSheet(),
      {
        name: "M1 Explorer",
        rows: [
          { row: 1, values: cohortHeader("Explorer") },
          ...[1, 2, 3, 4, 5, 6, 7, 8].map((lesson) => ({
            row: lesson + 1,
            values: ["1", String(lesson), "1", "word-drop", "Hi", "concept-wallet.webp", "OPTIONS: a\nCORRECT: a", ""],
          })),
          {
            row: 10,
            values: ["1", "9", "1", "word-drop", "Named", "concept-wallet.webp", "OPTIONS: a\nCORRECT: a", ""],
          },
          {
            row: 11,
            values: ["1", "9", "2", "word-drop", "Blank", "", "OPTIONS: b\nCORRECT: b", ""],
          },
          {
            row: 12,
            values: ["1", "9", "3", "word-drop", "Omitted", "not allowed", "OPTIONS: c\nCORRECT: c", ""],
          },
        ],
      },
      { name: "M1 Pathfinder", rows: lessonRows("Pathfinder", "Pathfinder") },
      { name: "M1 Maverick", rows: lessonRows("Maverick", "Maverick") },
    ]);
    expect(dropped.issues).toEqual([]);
    expect(dropped.missing.some((item) => item.name.toLowerCase() === "not allowed")).toBe(false);
    const lessonNine = dropped.byCohort.explorer.find((lesson) => lesson.lessonNumber === 9);
    expect(lessonNine?.screens.map((screen) => screen.image.explorer)).toEqual([
      "concept-wallet.webp",
      "",
      "",
    ]);
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
    expect(getPairSheetImagePath("senna-older-aiden19-sidebyside-r1-512.webp")).toBe(
      "/assets/illustrations/pairs/senna-older-aiden19-sidebyside-r1-512.webp",
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

  it("keeps the medal id and renders the app file the sheet names", () => {
    for (const cohort of ["explorer", "pathfinder", "maverick"] as const) {
      const lessonOne = resolvePayloadLesson(
        master.byCohort[cohort].find((lesson) => lesson.lessonNumber === 1)!,
        cohort,
        1,
      );
      const lessonTwo = resolvePayloadLesson(
        master.byCohort[cohort].find((lesson) => lesson.lessonNumber === 2)!,
        cohort,
        2,
      );
      const lessonThree = resolvePayloadLesson(
        master.byCohort[cohort].find((lesson) => lesson.lessonNumber === 3)!,
        cohort,
        3,
      );
      const first = lessonOne.screens.find((screen) => screen.type === "completion");
      const second = lessonTwo.screens.find((screen) => screen.type === "completion");
      const third = lessonThree.screens.find((screen) => screen.type === "completion");
      expect(first).toMatchObject({
        medalId: "medal-skill1-bronze",
        medalSrc: "/assets/illustrations/medal/medal-skill1-bronze-r2-app.webp",
      });
      expect(second).toMatchObject({
        medalId: "medal-skill2-bronze",
        medalSrc: "/assets/illustrations/medal/medal-skill2-bronze-r2-app.webp",
      });
      expect(third).toMatchObject({
        medalId: "medal-skill3-bronze",
        medalSrc: "/assets/illustrations/medal/medal-skill3-bronze-r2.webp",
      });
    }
  });

  it("resolves Max and Pippa celebrating without a piggy-bank stand-in", () => {
    expect(characterPoseFilePath("max-celebrating")).toBe(
      "/assets/illustrations/characters/max/max-celebrating-512.webp",
    );
    expect(characterPoseFilePath("pippa-celebrating")).toBe(
      "/assets/illustrations/characters/pippa/pippa-celebrating-512.webp",
    );
    for (const pose of ["max-celebrating-512.webp", "pippa-celebrating-512.webp"] as const) {
      const character = pose.startsWith("max") ? "max" : "pippa";
      expect(
        existsSync(
          path.join(process.cwd(), "public/assets/illustrations/characters", character, pose),
        ),
        pose,
      ).toBe(false);
    }
    expect(characterPoseFilePath("aiden19-celebrating")).toBe(
      "/assets/illustrations/characters/aiden19/aiden19-celebrating-r1-512.webp",
    );
    expect(
      existsSync(
        path.join(
          process.cwd(),
          "public/assets/illustrations/characters/aiden19/aiden19-celebrating-r1-512.webp",
        ),
      ),
    ).toBe(true);
    const maverickLesson = master.byCohort.maverick.find((lesson) => lesson.lessonNumber === 2);
    const pathfinderLesson = master.byCohort.pathfinder.find((lesson) => lesson.lessonNumber === 2);
    expect(maverickLesson).toBeDefined();
    expect(pathfinderLesson).toBeDefined();
    if (!maverickLesson || !pathfinderLesson) return;
    const maverickDrag = resolvePayloadLesson(maverickLesson, "maverick", 2).screens.find(
      (screen) => screen.type === "drag-to-target" && screen.targetImageFile === "aiden19-celebrating",
    );
    const pathfinderDrag = resolvePayloadLesson(pathfinderLesson, "pathfinder", 2).screens.find(
      (screen) => screen.type === "drag-to-target" && screen.targetImageFile === "pippa-celebrating",
    );
    expect(maverickDrag).toMatchObject({ targetLabel: "Aiden", sourceLabel: "Gift box" });
    expect(pathfinderDrag).toMatchObject({ targetLabel: "Pippa", sourceLabel: "Gift box" });
    expect(JSON.stringify(maverickDrag)).not.toContain("piggy");
    expect(JSON.stringify(pathfinderDrag)).not.toContain("piggy");
  });

  it("resolves every lesson for every cohort", () => {
    for (const cohort of ["explorer", "pathfinder", "maverick"] as const) {
      for (const lesson of master.byCohort[cohort]) {
        expect(() => resolvePayloadLesson(lesson, cohort, lesson.lessonNumber)).not.toThrow();
        expect(() =>
          assertLessonPayloadAssets(lesson, lesson.lessonNumber, { pictures: "bucket" }),
        ).not.toThrow();
      }
    }
  });

  it("has an upload source under the size cap for every picture and clip that isn't held", () => {
    const plan = planMediaUploads([...master.media.images, ...master.media.audio]);
    const problems = plan.filter((item) => item.status === "no-source" || item.status === "too-large");
    // Not drawn yet: the Pathfinder Lesson 2 target. Stays pending, so promote refuses it.
    expect(problems).toEqual([{ objectPath: "images/pippa-celebrating-512.webp", status: "no-source" }]);
    expect(plan.filter((item) => item.status === "held").every((item) => isHeldLarsMedia(item.objectPath))).toBe(true);
    expect(master.media.images.length).toBeGreaterThan(50);
    expect(master.media.audio.length).toBeGreaterThan(50);
  });

  it("points every picture and clip at the academy-media bucket", () => {
    expect(master.mediaBase).toBe("https://test-project.supabase.co/storage/v1/object/public/academy-media");
    const text = JSON.stringify(master.byCohort);
    expect(text).not.toMatch(/"\/academy-audio\//);
    expect(text).toContain("https://test-project.supabase.co/storage/v1/object/public/academy-media/audio/");
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
    const saveDraft = vi.fn();
    const result = await publishMasterDraft(rejected, {
      store: { findByHash: async () => null, saveDraft },
    });
    expect(result).toMatchObject({ ok: false, wrote: false });
    expect(saveDraft).not.toHaveBeenCalled();
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

describe("master media list matches what the player requests", () => {
  const master = readMasterModule(readFileSync(MASTER_WORKBOOK_PATH));

  it("names every picture a lesson loads, drag art and close portrait included", () => {
    const names = new Set(master.media.images);
    const cohorts = ["explorer", "pathfinder", "maverick"] as const;
    for (const cohort of cohorts) {
      for (const lesson of master.byCohort[cohort]) {
        const content = resolvePayloadLesson(lesson, cohort, lesson.lessonNumber);
        for (const src of lessonImageSrcs(content.screens, content.characterName)) {
          expect(names.has(`images/${mediaBaseName(src)}`), `${cohort} L${lesson.lessonNumber} ${src}`).toBe(true);
        }
      }
    }
    for (const name of [
      "images/concept-gift-box-r2.webp",
      "images/money-coin.webp",
      "images/piggy-bank.webp",
      "images/senna-older-celebrating-r1-512.webp",
    ]) {
      expect(names.has(name), name).toBe(true);
    }
  });

  it("lists a drag picture missing from storage, so publish is blocked", async () => {
    const known = new Set(master.media.images.filter((name) => name !== "images/money-coin.webp"));
    for (const name of master.media.audio) known.add(name);
    const checked = readMasterModule(readFileSync(MASTER_WORKBOOK_PATH), { knownMedia: known });
    expect(checked.missing.some((item) => item.name === "money-coin.webp")).toBe(true);
    const result = await publishMasterDraft(checked, {
      previous: null,
      store: { findByHash: async () => null, saveDraft: async () => "x" },
    });
    expect(result.ok).toBe(false);
  });

  it("shows the older Senna on the Maverick close screen", () => {
    for (const lesson of master.byCohort.maverick) {
      const content = resolvePayloadLesson(lesson, "maverick", lesson.lessonNumber);
      const close = content.screens.find((screen) => screen.type === "completion");
      if (close?.type === "completion" && close.leadCharacter?.toLowerCase() === "senna") {
        expect(close.portraitSrc).toMatch(/senna-older-celebrating/);
      }
    }
    expect(celebratingPortraitSrc("Senna", "explorer")).toMatch(/\/senna-celebrating/);
    expect(celebratingPortraitSrc("Senna", "maverick")).toMatch(/senna-older-celebrating-r1-512\.webp$/);
    expect(celebratingPortraitSrc(undefined, "maverick")).toMatch(/lars-celebrating/);
  });
});
