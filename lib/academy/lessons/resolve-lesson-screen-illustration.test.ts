import { describe, expect, it } from "vitest";
import { PAIR_SHEET_IMAGES_BASE } from "@/lib/academy/illustrations/illustration-registry";
import { lessonImageSrcs } from "@/lib/academy/lessons/lesson-image-srcs";
import {
  loadBundledLessonPayload,
  loadLessonPayload,
} from "@/lib/academy/lessons/payload/load-lesson-payload";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import { missingLessonImages } from "@/lib/academy/lessons/payload/validate-lesson-assets";
import {
  payloadGameDropsNamedPicture,
  resolveLessonScreenIllustration,
  screenDropsNamedPicture,
  supportsLessonScreenIllustration,
} from "@/lib/academy/lessons/resolve-lesson-screen-illustration";
import type { ScreenConfig } from "@/lib/academy/lessons/types";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

const wordDrop = {
  type: "word-drop",
  id: "hook-word-drop",
  narrativeBefore: "Cash must be",
  narrativeAfter: "right away!",
  options: ["Spent", "Saved"],
  correctOption: "Spent",
  wrongError: "Try again.",
} as ScreenConfig;

describe("resolveLessonScreenIllustration", () => {
  it("keeps the lesson illustration when no pair file name is set", () => {
    const resolved = resolveLessonScreenIllustration({
      ...wordDrop,
      illustrationId: "holly-working",
    });
    expect(resolved?.src).toContain("holly");
    expect(resolved?.src).not.toContain("/characters/pairs/");
  });

  it("maps a character file name to the registry, not a random pose", () => {
    const resolved = resolveLessonScreenIllustration({
      ...wordDrop,
      illustrationId: "lars-thinking",
      pairImage: "Holly-happy.webp",
    });
    expect(resolved?.src).toContain("holly-celebrating-512.webp");
    expect(resolved?.src).not.toContain("lars-thinking");
  });

  it("shows the pairs-folder file and ignores illustrationId", () => {
    const resolved = resolveLessonScreenIllustration({
      ...wordDrop,
      illustrationId: "lars-happy",
      pairImage: "mia-senna-walking.webp",
    });
    expect(resolved?.src).toBe(
      `${PAIR_SHEET_IMAGES_BASE}/mia-senna-walking.webp`,
    );
  });

  it("shows a picture on a multi-select list when the payload names one", () => {
    const resolved = resolveLessonScreenIllustration({
      type: "binary-choice",
      id: "pressure-sign",
      prompt: "Select which parts of the sign are making Lars rush.",
      optionLayout: "radio-list",
      optionA: { label: "DON'T MISS OUT!", isCorrect: true },
      optionB: { label: "Made in France", isCorrect: false },
      wrongError: "That's just sign info, not a rush trick.",
      pairImage: "fishing-rod-sign.webp",
    });
    expect(resolved?.src).toContain("fishing-rod-sign.webp");
  });

  it("shows no picture when the sheet says not allowed", () => {
    const resolved = resolveLessonScreenIllustration({
      ...wordDrop,
      illustrationId: "lars-happy",
      pairImage: false,
    });
    expect(resolved).toBeUndefined();
  });

  it("ignores a picture name on a lightning round and leaves other templates alone", () => {
    const lightning = {
      type: "spotlight-rounds",
      id: "buy-first",
      prompt: "Tap the one to buy first.",
      rounds: [],
      pairImage: "concept-gift-box.webp",
      illustrationId: "holly-working",
    } as ScreenConfig;

    expect(screenDropsNamedPicture(lightning)).toBe(true);
    expect(supportsLessonScreenIllustration(lightning)).toBe(false);
    expect(resolveLessonScreenIllustration(lightning)).toBeUndefined();
    expect(lessonImageSrcs([lightning]).join("\n")).not.toContain("concept-gift-box.webp");
    expect(
      resolveLessonScreenIllustration({
        ...wordDrop,
        pairImage: "concept-gift-box.webp",
      })?.src,
    ).toContain("concept-gift-box.webp");
  });

  it("ignores a picture name on a two-bucket sort and a spent total, and still paints steps", () => {
    const wants = {
      type: "bucket-sort",
      id: "birthday-money",
      intro: "Sort the birthday money.",
      buckets: [
        { id: "want", label: "Want" },
        { id: "need", label: "Need" },
      ],
      items: [{ id: "gift", label: "Gift", bucket: "want" }],
      pairImage: "concept-gift-box.webp",
      illustrationId: "holly-working",
    } as ScreenConfig;
    const steps = {
      ...wants,
      id: "steps",
      layout: "steps-row",
      buckets: [
        { id: "step1", label: "Step 1" },
        { id: "step2", label: "Step 2" },
      ],
      items: [
        { id: "wait", label: "Wait", bucket: "step1" },
        { id: "buy", label: "Buy", bucket: "step2" },
      ],
    } as ScreenConfig;
    const spent = {
      ...wants,
      id: "spent",
      layout: "spent-total",
      buckets: [{ id: "spent", label: "Spent" }],
      items: [{ id: "ticket", label: "Ticket", bucket: "spent", price: 8 }],
    } as ScreenConfig;

    expect(screenDropsNamedPicture(wants)).toBe(true);
    expect(supportsLessonScreenIllustration(wants)).toBe(false);
    expect(resolveLessonScreenIllustration(wants)).toBeUndefined();
    expect(lessonImageSrcs([wants]).join("\n")).not.toContain("concept-gift-box.webp");
    expect(resolveLessonScreenIllustration(steps)?.src).toContain("concept-gift-box.webp");
    expect(screenDropsNamedPicture(spent)).toBe(true);
    expect(supportsLessonScreenIllustration(spent)).toBe(false);
    expect(resolveLessonScreenIllustration(spent)).toBeUndefined();
    expect(lessonImageSrcs([spent]).join("\n")).not.toContain("concept-gift-box.webp");
    const match = {
      type: "link-match",
      id: "emergencies",
      intro: "Match each event to what the cash can do.",
      pairs: [{ id: "headphones", event: "I broke the headphones", benefit: "I can replace them" }],
      pairImage: "lars-senna-sidebyside.webp",
    } as ScreenConfig;
    expect(screenDropsNamedPicture(match)).toBe(true);
    expect(supportsLessonScreenIllustration(match)).toBe(false);
    expect(resolveLessonScreenIllustration(match)).toBeUndefined();
    const tap = {
      type: "tap-reveal",
      id: "short-fun-demo",
      intro: "Senna's money is gone, and the fun lasted only 10 minutes.",
      buckets: [
        { id: "short", label: "Short Fun", tone: "short" as const },
        { id: "long", label: "More Fun for Longer", tone: "long" as const },
      ],
      items: [{ id: "donut", label: "Doughnut box", bucket: "short" }],
      pairImage: "concept-coin-stack.webp",
    } as ScreenConfig;
    const wantsPreload = lessonImageSrcs([wants]).join("\n");

    expect(screenDropsNamedPicture(tap)).toBe(true);
    expect(supportsLessonScreenIllustration(tap)).toBe(false);
    expect(resolveLessonScreenIllustration(tap)).toBeUndefined();
    expect(lessonImageSrcs([tap]).join("\n")).not.toContain("concept-coin-stack.webp");
    expect(wantsPreload).not.toContain("concept-gift-box.webp");
    expect(wantsPreload).not.toMatch(/thinking-512\.webp/);
    expect(payloadGameDropsNamedPicture("tap-reveal", "SHORT: Doughnut\nLONG: Guitar")).toBe(
      true,
    );
    expect(payloadGameDropsNamedPicture("bucket-sort", "WANT: Gift\nNEED: Shoes")).toBe(true);
    expect(payloadGameDropsNamedPicture("bucket-sort", "STEP1: Wait.\nSTEP2: Buy.")).toBe(false);
    expect(payloadGameDropsNamedPicture("bucket-sort", "SPENT: Ticket $8\nTOTAL: 8")).toBe(true);
    expect(payloadGameDropsNamedPicture("spotlight-rounds", "A: One | B: Two | CORRECT: A")).toBe(
      true,
    );
    expect(payloadGameDropsNamedPicture("link-match", "PAIRS: A = B")).toBe(true);
    expect(payloadGameDropsNamedPicture("multiple-choice", "CHOICE A: Yes")).toBe(false);
    expect(payloadGameDropsNamedPicture("allocation-slider", "TOTAL: 40\nKEEP: 30")).toBe(false);
  });

  it("agrees with the sheet rule on every Module 1 row", () => {
    const cohorts: MasteryCohort[] = ["explorer", "pathfinder", "maverick"];
    for (let lessonNumber = 1; lessonNumber <= 9; lessonNumber += 1) {
      const payload = loadBundledLessonPayload(1, lessonNumber);
      for (const cohort of cohorts) {
        const lesson = resolvePayloadLesson(payload, cohort, lessonNumber);
        for (const screen of lesson.screens) {
          const row = payload.screens.find((item) => item.screenLabel === screen.sourceLabel);
          if (!row || row.gameType !== screen.type) continue;
          const settings = row.settings[cohort].trim() || row.settings.pathfinder;
          expect(
            payloadGameDropsNamedPicture(row.gameType, settings),
            `${cohort} L${lessonNumber} ${screen.sourceLabel}`,
          ).toBe(screenDropsNamedPicture(screen));
          if (!screenDropsNamedPicture(screen)) continue;
          expect(
            resolveLessonScreenIllustration(screen),
            `${cohort} L${lessonNumber} ${screen.sourceLabel}`,
          ).toBeUndefined();
          expect(supportsLessonScreenIllustration(screen)).toBe(false);
        }
      }
    }
  });
});

describe("ignored picture names do not fail the asset check", () => {
  it("skips a missing file on a lightning round and a two-bucket sort", () => {
    const payload = loadLessonPayload({
      moduleNumber: 1,
      lessonNumber: 2,
      lessonDetails: {
        filename: "Lesson-Details.csv",
        text: `Module Number,Lesson Number,Field,Value
1,2,Lesson Title,Birthday money
1,2,Level,1
1,2,Pathfinder Character,Holly
1,2,Explorer Character,Lars
1,2,Maverick Character,Aiden
`,
      },
      screens: {
        filename: "Screens.csv",
        text: `Module Number,Lesson Number,Screen,Game Type,Explorer Text,Pathfinder Text,Maverick Text,Explorer Image,Pathfinder Image,Maverick Image,Explorer Settings,Game Settings,Maverick Settings,Error Explorer,Error Pathfinder,Error Maverick,Notes
1,2,1,spotlight-rounds,Tap,Tap,Tap,missing-lightning.webp,missing-lightning.webp,missing-lightning.webp,"A: Now | B: Later | CORRECT: A","A: Now | B: Later | CORRECT: A","A: Now | B: Later | CORRECT: A",,,,
1,2,2,bucket-sort,Sort,Sort,Sort,missing-buckets.webp,missing-buckets.webp,missing-buckets.webp,"WANT: Gift\nNEED: Shoes","WANT: Gift\nNEED: Shoes","WANT: Gift\nNEED: Shoes",,,,
1,2,3,word-drop,Cash must be ______.,Cash must be ______.,Cash must be ______.,still-shown.webp,still-shown.webp,still-shown.webp,"OPTIONS: Spent\nCORRECT: Spent","OPTIONS: Spent\nCORRECT: Spent","OPTIONS: Spent\nCORRECT: Spent",,,,
`,
      },
    });

    const names = missingLessonImages(payload).map((item) => item.fileName);
    expect(names).not.toContain("missing-lightning.webp");
    expect(names).not.toContain("missing-buckets.webp");
    expect(names).toContain("still-shown.webp");
  });
});
