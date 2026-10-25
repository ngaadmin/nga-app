import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getIllustrationPath, getPairSheetImagePath } from "@/lib/academy/illustrations/illustration-registry";
import { rehomeBetweenLessonBeats } from "@/lib/academy/lessons/payload/explorer-m1/convert-explorer-workbook";
import { loadExplorerM1Payload } from "@/lib/academy/lessons/payload/explorer-m1/load-explorer-m1-payload";
import type { PayloadScreenRow } from "@/lib/academy/lessons/payload/types";
import { selectLessonPayload } from "@/lib/academy/lessons/payload/explorer-m1/select-payload";
import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { parseAuthoringTable } from "@/lib/academy/lessons/payload/parse-authoring-table";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import { fallbackNextIndex } from "@/lib/academy/lessons/payload/lesson-graph";
import { missingLessonImages } from "@/lib/academy/lessons/payload/validate-lesson-assets";
import { resolveLessonScreenIllustration } from "@/lib/academy/lessons/resolve-lesson-screen-illustration";
import { moduleCloserGoldSkillLine } from "@/lib/academy/lessons/completion-screen";
import { STORY_CREDIT } from "@/lib/academy/lessons/story-audio/audio-base";
import type { LessonPayload } from "@/lib/academy/lessons/payload/types";

function row(gameType: string, screenLabel: string, settings = ""): PayloadScreenRow {
  const copy = { explorer: settings, pathfinder: settings, maverick: settings };
  const text = { explorer: screenLabel, pathfinder: screenLabel, maverick: screenLabel };
  return {
    screenNumber: gameType === "scenario-beat" ? 0 : 1,
    screenLabel,
    gameType,
    text,
    image: text,
    settings: copy,
    error: { explorer: "", pathfinder: "", maverick: "" },
  };
}

describe("between-lesson beat placement", () => {
  it("moves a single trailer onto the next lesson and a wrap in front of the medal", () => {
    const lessons = new Map<number, PayloadScreenRow[]>([
      [
        1,
        [row("word-drop", "1"), row("completion", "8"), row("scenario-beat", "l1-trailer")],
      ],
      [
        7,
        [
          row("drag-to-target", "7"),
          row("completion", "8"),
          row("scenario-beat", "l7-wrap"),
          row("scenario-beat", "l7-open-a"),
          row("scenario-beat", "l7-open-b"),
        ],
      ],
      [8, [row("spotlight-rounds", "1"), row("completion", "8")]],
      [
        9,
        [
          row("skill-hub", "1", "BUTTON: Finish → GO Screen 8 WHEN complete"),
          row("completion", "8"),
          row("scenario-beat", "l9-close-a"),
          row("scenario-beat", "l9-close-b"),
        ],
      ],
    ]);

    rehomeBetweenLessonBeats(lessons);

    expect(lessons.get(1)?.map((screen) => screen.screenLabel)).toEqual(["1", "8"]);
    expect(lessons.get(7)?.map((screen) => screen.screenLabel)).toEqual([
      "l1-trailer",
      "7",
      "l7-wrap",
      "8",
    ]);
    expect(lessons.get(8)?.map((screen) => screen.screenLabel)).toEqual([
      "l7-open-a",
      "l7-open-b",
      "1",
      "8",
    ]);
    expect(lessons.get(9)?.map((screen) => screen.screenLabel)).toEqual([
      "1",
      "l9-close-a",
      "l9-close-b",
      "8",
    ]);
    expect(lessons.get(9)?.[0]?.settings.explorer).toContain("GO Screen l9-close-a");
  });
});

describe("explorer module 1 payload", () => {
  it("resolves Mia pose files to the character folder", () => {
    expect(getPairSheetImagePath("mia-thinking.webp")).toBe(
      "/assets/illustrations/characters/mia/Mia-thinking.webp",
    );
    expect(getPairSheetImagePath("Mia-celebrating.webp")).toBe(
      "/assets/illustrations/characters/mia/Mia-celebrating.webp",
    );
  });

  it("keeps Pathfinder on the bundled sheet", () => {
    const bundled = { lessonNumber: 1 } as LessonPayload;
    const explorer = { lessonNumber: 9 } as LessonPayload;
    expect(selectLessonPayload("pathfinder", bundled, explorer)).toBe(bundled);
    expect(selectLessonPayload("maverick", bundled, explorer)).toBe(bundled);
    expect(selectLessonPayload("explorer", bundled, explorer)).toBe(explorer);
    expect(selectLessonPayload("explorer", bundled, undefined)).toBe(bundled);
  });

  it("plays story beats without a bonus and credits the first voice in each lesson", () => {
    const credited = new Set<string>();
    for (let lessonNumber = 1; lessonNumber <= 9; lessonNumber += 1) {
      const payload = loadExplorerM1Payload(lessonNumber);
      expect(payload, `lesson ${lessonNumber}`).toBeTruthy();
      if (!payload) continue;
      const content = resolvePayloadLesson(payload, "explorer", lessonNumber);
      const beats = content.screens.filter(
        (screen) => screen.type === "narrative-bonus" && screen.audio,
      );
      for (const beat of beats) {
        if (beat.type !== "narrative-bonus") continue;
        expect(beat.bonusXp).toBe(0);
        expect(beat.resolution).toBeUndefined();
        expect(beat.audio?.src.startsWith("/academy-audio/explorer-m1/")).toBe(true);
        if (beat.credit) {
          expect(beat.credit).toBe(STORY_CREDIT);
          credited.add(beat.id);
        }
      }
    }
    expect(credited).toEqual(
      new Set([
        "explorer-m1-intro-beat1",
        "explorer-m1-l1-beat3",
        "explorer-m1-l2-beat4",
        "explorer-m1-l3-beat3",
        "explorer-m1-l4-beat4",
        "explorer-m1-l5-beat3",
        "explorer-m1-l6-beat3",
        "explorer-m1-l7-beat2",
        "explorer-m1-l9-beat1",
      ]),
    );
  });

  it("opens lesson 1 with the module intro before the first practice screen", () => {
    const payload = loadExplorerM1Payload(1);
    if (!payload) throw new Error("missing lesson 1");
    const screens = resolvePayloadLesson(payload, "explorer", 1).screens;
    const intro = screens[0];
    expect(intro?.type).toBe("narrative-bonus");
    if (intro?.type !== "narrative-bonus") return;
    expect(intro.id).toBe("explorer-m1-intro-beat1");
    expect(intro.narrative).toBe(
      "Meet Lars. He's 11, loves riding his bike and he lives with Mom, Dad and his big brother Senna. Lars spends every dollar the minute it lands in his hands. Follow along with Lars as he goes from being broke, to earning and having money to buy what he really wants. You'll learn the same moves right alongside him.",
    );
    expect(intro.successMessage).toBe("Are you ready? Let's go!");
    expect(intro.credit).toBe(STORY_CREDIT);
    expect(intro.audio).toEqual({
      src: "/academy-audio/explorer-m1/explorer-m1-intro-beat1-6a9361ab.mp3",
      durationMs: 19226,
    });
    const brief =
      "Lars at home, grinning beside his bike, with Mom, Dad and his big brother Senna in the background, coins and a bill slipping through his fingers.";
    const introSource = JSON.parse(
      readFileSync(
        path.join(process.cwd(), "lib/academy/lessons/payload/source/explorer-m1/intro.json"),
        "utf8",
      ),
    ) as { image?: string };
    expect(introSource.image).toBe("lemonade-family-scene-r10.webp");
    expect(payload.screens[0]?.image).toEqual({
      explorer: introSource.image,
      pathfinder: introSource.image,
      maverick: introSource.image,
    });
    expect(intro.pairImage).toBe(introSource.image);
    expect(intro.illustration).toEqual({ label: brief, alt: brief });
    expect(resolveLessonScreenIllustration(intro)).toEqual({
      src: "/assets/illustrations/characters/pairs/lemonade-family-scene-r10.webp",
      alt: brief,
      label: brief,
    });
    expect(missingLessonImages(payload)).toEqual([]);
    expect(screens[1]?.type).toBe("word-drop");
    const firstLessonBeat = screens.find((screen) => screen.id === "explorer-m1-l1-beat1");
    expect(firstLessonBeat?.type).toBe("narrative-bonus");
    if (firstLessonBeat?.type !== "narrative-bonus") return;
    expect(firstLessonBeat.credit).toBeUndefined();
    expect(firstLessonBeat.audio?.src).toContain("explorer-m1-l1-beat1-6e798820.mp3");
    expect(firstLessonBeat.pairImage).toBe("em1-02-l1r7-senna-coins-r3.webp");
    expect(resolveLessonScreenIllustration(firstLessonBeat)).toMatchObject({
      src: "/assets/illustrations/characters/pairs/em1-02-l1r7-senna-coins-r3.webp",
    });
    const secondLessonBeat = screens.find((screen) => screen.id === "explorer-m1-l1-beat2");
    expect(secondLessonBeat?.type).toBe("narrative-bonus");
    if (secondLessonBeat?.type !== "narrative-bonus") return;
    expect(secondLessonBeat.credit).toBeUndefined();
    expect(secondLessonBeat.pairImage).toBe("prop-ex-m1-stand-set-lars-r1.webp");
    expect(resolveLessonScreenIllustration(secondLessonBeat)).toMatchObject({
      src: "/assets/illustrations/characters/pairs/prop-ex-m1-stand-set-lars-r1.webp",
    });
    const numbered = screens.filter((screen) => screen.type !== "narrative-bonus");
    expect(numbered.some((screen) => "pairImage" in screen && screen.pairImage === "em1-02-l1r7-senna-coins-r3.webp")).toBe(false);
    expect(numbered.some((screen) => "pairImage" in screen && screen.pairImage === "em1-03-l1r11-lars-lemonade-r3.webp")).toBe(false);

    const lesson2 = loadExplorerM1Payload(2);
    if (!lesson2) throw new Error("missing lesson 2");
    expect(missingLessonImages(lesson2)).toEqual([]);
    const lesson2Screens = resolvePayloadLesson(lesson2, "explorer", 2).screens;
    const bikeBeat = lesson2Screens.find((screen) => screen.id === "explorer-m1-l2-beat1");
    expect(bikeBeat?.type).toBe("narrative-bonus");
    if (bikeBeat?.type !== "narrative-bonus") return;
    expect(bikeBeat.pairImage).toBe("em1-04-l2r20-lars-mom-bike-note-r3.webp");
    expect(resolveLessonScreenIllustration(bikeBeat)).toMatchObject({
      src: "/assets/illustrations/characters/pairs/em1-04-l2r20-lars-mom-bike-note-r3.webp",
    });
    expect(
      lesson2Screens.some(
        (screen) =>
          screen.type !== "narrative-bonus" &&
          "pairImage" in screen &&
          screen.pairImage === "em1-04-l2r20-lars-mom-bike-note-r3.webp",
      ),
    ).toBe(false);
  });

  it("plays opening beats, then practice, then a closing beat, then the medal", () => {
    const openings: Record<number, readonly string[]> = {
      1: ["explorer-m1-intro-beat1"],
      2: ["explorer-m1-l1-beat3"],
      3: ["explorer-m1-l2-beat4"],
      4: ["explorer-m1-l3-beat3"],
      5: ["explorer-m1-l4-beat4"],
      6: ["explorer-m1-l5-beat3"],
      7: ["explorer-m1-l6-beat3"],
      8: ["explorer-m1-l7-beat2", "explorer-m1-l7-beat3"],
      9: [],
    };
    for (let lessonNumber = 1; lessonNumber <= 9; lessonNumber += 1) {
      const payload = loadExplorerM1Payload(lessonNumber);
      if (!payload) throw new Error(`missing lesson ${lessonNumber}`);
      const screens = resolvePayloadLesson(payload, "explorer", lessonNumber).screens;
      const labels = screens.map((screen) => screen.sourceLabel ?? screen.id);
      const completion = screens.findIndex((screen) => screen.type === "completion");
      expect(completion, `lesson ${lessonNumber} medal`).toBe(screens.length - 1);
      expect(
        screens.slice(completion + 1).map((screen) => screen.type),
        `lesson ${lessonNumber} after medal`,
      ).toEqual([]);

      const opening = openings[lessonNumber] ?? [];
      expect(
        screens.slice(0, opening.length).map((screen) => screen.id),
        `lesson ${lessonNumber} opening`,
      ).toEqual(opening);
      for (const [offset, beatId] of opening.entries()) {
        const beat = screens[offset];
        expect(beat?.type, beatId).toBe("narrative-bonus");
        const next = fallbackNextIndex(beat!, offset, labels);
        expect(next === undefined || (next > offset && next < completion), `${beatId} advances`).toBe(
          true,
        );
      }

      const closing = [...screens.entries()]
        .reverse()
        .find(([index, screen]) => index < completion && screen.type === "narrative-bonus");
      expect(closing, `lesson ${lessonNumber} closing beat`).toBeTruthy();
      if (!closing) continue;
      const [index, beat] = closing;
      const next = fallbackNextIndex(beat, index, labels);
      const destination = next ?? index + 1;
      expect(screens[destination]?.type, `lesson ${lessonNumber} last beat`).toBe("completion");
    }

    const lesson2 = loadExplorerM1Payload(2);
    if (!lesson2) throw new Error("missing lesson 2");
    const opener = resolvePayloadLesson(lesson2, "explorer", 2).screens[0];
    expect(opener?.type).toBe("narrative-bonus");
    if (opener?.type === "narrative-bonus") {
      expect(opener.narrative.startsWith("Senna's birthday is on Saturday")).toBe(true);
    }
  });

  it("shows the approved gelato scene on the share beat", () => {
    const payload = loadExplorerM1Payload(5);
    if (!payload) throw new Error("missing lesson 5");
    const beat = resolvePayloadLesson(payload, "explorer", 5).screens.find(
      (screen) => screen.id === "explorer-m1-l5-beat1",
    );
    expect(beat?.type).toBe("narrative-bonus");
    if (beat?.type !== "narrative-bonus") return;
    const brief =
      "Lars and Mia leaving the gelato shop, sharing one gelato with two spoons, Mia in a birthday badge.";
    expect(beat.pairImage).toBe("beat-ex-m1-l5-r4.webp");
    expect(beat.illustration).toEqual({ label: brief, alt: brief });
    expect(beat.narrative).toBe(
      "Lars and Mia share the birthday gelato. She's happy Lars came along, and Lars is grateful for Mia's generosity. He decides to repay the favor to Mia when he can.\n\nHis startup envelope still holds $10.",
    );
    expect(resolveLessonScreenIllustration(beat)?.src).toBe(
      "/assets/illustrations/characters/pairs/beat-ex-m1-l5-r4.webp",
    );
  });

  it("plays the five cleared copy cells in US spelling", () => {
    const textOf = (lessonNumber: number) => {
      const payload = loadExplorerM1Payload(lessonNumber);
      if (!payload) throw new Error(`missing lesson ${lessonNumber}`);
      return resolvePayloadLesson(payload, "explorer", lessonNumber).screens.map((screen) => {
        if (screen.type === "narrative-bonus") return screen.narrative;
        if ("prompt" in screen && typeof screen.prompt === "string") return screen.prompt;
        return "";
      });
    };
    expect(textOf(1)).toContain(
      "Lars spent all his birthday money. At home, he watches his big brother Senna count his bills and coins.\n\nSenna earned it walking dogs in the neighborhood. \"It's a great way to make some money,\" Senna says.",
    );
    expect(textOf(1)).toContain(
      "The next day, Lars gets his $5 pocket money. Then his tablet flashes: 💥 RARE SKIN DEAL! ONLY 1 MINUTE LEFT! 💥 Why is the game rushing him?",
    );
    expect(textOf(4)).toContain(
      "One afternoon, Lars's friends all ping him. A new skin has dropped on their favorite game. A limited time offer and the countdown is ticking.\n\nLars remembers Mason's words. His startup money is still $0.",
    );
    expect(textOf(8)).toContain("Lars sees a glow-in-the-dark yo-yo for $6. What do you want Lars to do?");
  });

  it("scores Cath's Lesson 5 share choice and Lesson 6 yes/no sort", () => {
    const lesson5 = loadExplorerM1Payload(5);
    if (!lesson5) throw new Error("missing lesson 5");
    const share = resolvePayloadLesson(lesson5, "explorer", 5).screens.find(
      (screen) => screen.type === "binary-choice" && screen.prompt.startsWith("The gelato costs $5."),
    );
    expect(share?.type).toBe("binary-choice");
    if (share?.type !== "binary-choice") return;
    expect(share.options).toBeTruthy();
    if (!share.options) return;
    expect(share.options.map((option) => ({ label: option.label, isCorrect: option.isCorrect }))).toEqual([
      { label: "Skip his own gelato and ask if Mia wants to share.", isCorrect: true },
      { label: "Buy his own, because the deal ends today.", isCorrect: false },
    ]);

    const lesson6 = loadExplorerM1Payload(6);
    if (!lesson6) throw new Error("missing lesson 6");
    const sort = resolvePayloadLesson(lesson6, "explorer", 6).screens.find(
      (screen) => screen.type === "bucket-sort" && screen.intro.includes("good ideas for Lars"),
    );
    expect(sort?.type).toBe("bucket-sort");
    if (sort?.type !== "bucket-sort") return;
    expect(sort.buckets.map((bucket) => bucket.label)).toEqual(["Yes", "No"]);
    expect(sort.items.map((item) => ({ label: item.label, bucket: item.bucket }))).toEqual([
      { label: "Pay his $5 half", bucket: "yes" },
      { label: "Save the remaining $3 for later", bucket: "yes" },
      { label: "Buy the dart blaster and movie ticket", bucket: "no" },
      { label: "Borrow $5 from Senna", bucket: "no" },
    ]);
  });

  it("plays the folded Lesson 9 close as one beat before the medal", () => {
    const payload = loadExplorerM1Payload(9);
    if (!payload) throw new Error("missing lesson 9");
    const screens = resolvePayloadLesson(payload, "explorer", 9).screens;
    const beats = screens.filter((screen) => screen.type === "narrative-bonus");
    expect(beats.map((beat) => beat.id)).toEqual(["explorer-m1-l9-beat1"]);
    const beat = beats[0];
    if (!beat || beat.type !== "narrative-bonus") return;
    expect(beat.narrative).toBe(
      "With $15 in his envelope, Lars buys a jug, cups, lemons and sugar. Mia's sign goes on the front.\nOn Saturday, his stand opens by the front gate.\nHe's one step closer to his mountain bike!",
    );
    expect(beat.pairImage).toBe("beat-ex-m1-l9-r1.webp");
    expect(beat.credit).toBe(STORY_CREDIT);
    expect(beat.audio?.src).toContain("explorer-m1-l9-beat1-0f124ac0.mp3");
    const completion = screens.findIndex((screen) => screen.type === "completion");
    expect(screens[completion - 1]?.id).toBe("explorer-m1-l9-beat1");
  });

  it("gives every explorer story beat a 1600x1200 workbook still", () => {
    const workbook = parseAuthoringTable({
      filename: "workbook.xlsx",
      bytes: new Uint8Array(
        readFileSync(
          path.join(
            process.cwd(),
            "lib/academy/lessons/payload/source/explorer-m1/workbook.xlsx",
          ),
        ),
      ),
    });
    const headers = workbook[0] ?? [];
    const column = (name: string) =>
      headers.findIndex((header) => header.trim().toLowerCase() === name.toLowerCase());
    const lessonCol = column("Lesson Number");
    const textCol = column("Explorer Text");
    const imageCol = column("Explorer Image");
    const sheetByText = new Map<string, string>();
    for (const row of workbook.slice(1)) {
      if ((row[lessonCol] ?? "").trim().toLowerCase() !== "scenario beat") continue;
      const text = (row[textCol] ?? "").replace(/\s+/g, " ").trim();
      sheetByText.set(text, (row[imageCol] ?? "").trim());
    }

    const blanks: string[] = [];
    const problems: string[] = [];
    const minBytes = 23 * 1024;
    const maxBytes = 82 * 1024;

    for (let lessonNumber = 1; lessonNumber <= 9; lessonNumber += 1) {
      const payload = loadExplorerM1Payload(lessonNumber);
      if (!payload) throw new Error(`missing lesson ${lessonNumber}`);
      const screens = resolvePayloadLesson(payload, "explorer", lessonNumber).screens;
      for (const screen of screens) {
        if (screen.type !== "narrative-bonus" || !screen.id.includes("beat")) continue;
        const text = screen.narrative.replace(/\s+/g, " ").trim();
        const sheetImage = sheetByText.get(text);
        const file = typeof screen.pairImage === "string" ? screen.pairImage : "";
        const label = `L${lessonNumber} ${screen.id}`;
        if (!file) {
          blanks.push(label);
          continue;
        }
        if (sheetImage === "" && screen.id !== "explorer-m1-intro-beat1") {
          problems.push(`${label} workbook image is blank`);
        } else if (sheetImage && sheetImage !== file) {
          problems.push(`${label} plays ${file} but the workbook maps ${sheetImage}`);
        }
        const src = getPairSheetImagePath(file);
        const disk = src ? path.join(process.cwd(), "public", src) : "";
        if (!src || !existsSync(disk)) {
          problems.push(`${label} missing ${file}`);
          continue;
        }
        const bytes = readFileSync(disk);
        const tag = bytes.subarray(12, 16).toString("ascii");
        const width = tag === "VP8X" ? 1 + bytes.readUIntLE(24, 3) : 0;
        const height = tag === "VP8X" ? 1 + bytes.readUIntLE(27, 3) : 0;
        if (tag !== "VP8X" || width !== 1600 || height !== 1200) {
          problems.push(`${label} ${file} is ${width}x${height} ${tag}`);
        }
        if (bytes.length < minBytes || bytes.length > maxBytes) {
          problems.push(`${label} ${file} is ${bytes.length} bytes`);
        }
      }
    }

    expect(blanks).toEqual([]);
    expect(problems).toEqual([]);
    expect(sheetByText.size).toBe(26);
  });

  it("lists the three Module 1 gold skills on the explorer lesson 9 close", () => {
    const payload = loadExplorerM1Payload(9);
    if (!payload) throw new Error("missing lesson 9");
    const content = resolvePayloadLesson(payload, "explorer", 9);
    const completion = content.screens.find((screen) => screen.type === "completion");
    expect(completion?.type).toBe("completion");
    expect(moduleCloserGoldSkillLine(1)?.text).toBe(
      "Turned gold: Catch Impulse Spending, Choose Needs Over Wants, Don't Spend Money You Don't Have",
    );
    const bundled = loadBundledLessonPayload(1, 1);
    expect(selectLessonPayload("pathfinder", bundled, payload)?.lessonTitle).toBe(
      bundled.lessonTitle,
    );
  });

  it("resolves every explorer picture, including drag sprites, to a file on disk", () => {
    const missing: string[] = [];
    const blankDrags: string[] = [];
    const publicFile = (src: string) => existsSync(path.join(process.cwd(), "public", src));

    for (let lessonNumber = 1; lessonNumber <= 9; lessonNumber += 1) {
      const payload = loadExplorerM1Payload(lessonNumber);
      if (!payload) throw new Error(`missing lesson ${lessonNumber}`);
      const screens = resolvePayloadLesson(payload, "explorer", lessonNumber).screens;
      screens.forEach((screen, index) => {
        const picture = resolveLessonScreenIllustration(screen);
        if (picture?.src && !publicFile(picture.src)) {
          missing.push(`L${lessonNumber} s${index} scene ${picture.src}`);
        }
        if (screen.type !== "drag-to-target") return;
        const sprites: string[] = [];
        if (screen.sourceIllustrationId) sprites.push(getIllustrationPath(screen.sourceIllustrationId));
        if (screen.targetIllustrationId) sprites.push(getIllustrationPath(screen.targetIllustrationId));
        for (const fileName of [screen.sourceImageFile, screen.targetImageFile]) {
          if (!fileName) continue;
          const src = getPairSheetImagePath(fileName);
          if (!src) missing.push(`L${lessonNumber} s${index} unresolved ${fileName}`);
          else sprites.push(src);
        }
        for (const src of sprites) {
          if (!publicFile(src)) missing.push(`L${lessonNumber} s${index} drag ${src}`);
        }
        if (sprites.length === 0 && !screen.itemEmoji && !screen.targetEmoji) {
          blankDrags.push(`L${lessonNumber} s${index} ${screen.sourceLabel} → ${screen.targetLabel}`);
        }
      });
    }

    expect(blankDrags).toEqual([]);
    expect(missing).toEqual([]);

    const lesson2 = loadExplorerM1Payload(2);
    if (!lesson2) throw new Error("missing lesson 2");
    const gift = resolvePayloadLesson(lesson2, "explorer", 2).screens.find(
      (screen) => screen.type === "drag-to-target" && screen.sourceIllustrationId === "concept-gift-box",
    );
    expect(gift).toMatchObject({
      sourceLabel: "Gift box",
      targetLabel: "Senna",
      sourceIllustrationId: "concept-gift-box",
      targetIllustrationId: "senna-celebrating",
      pairImage: "lars-senna-sidebyside.webp",
    });
    if (!gift || gift.type !== "drag-to-target") return;
    expect(resolveLessonScreenIllustration(gift)).toMatchObject({
      src: "/assets/illustrations/pairs/lars-senna-sidebyside.webp",
      alt: "lars senna sidebyside",
    });
    expect(resolveLessonScreenIllustration(gift)?.label).toBeUndefined();
    expect(getIllustrationPath("concept-gift-box")).toBe(
      "/assets/illustrations/concepts/concept-gift-box.webp",
    );
    expect(getIllustrationPath("senna-celebrating")).toBe(
      "/assets/illustrations/characters/senna/senna-celebrating-512.webp",
    );
  });
});
