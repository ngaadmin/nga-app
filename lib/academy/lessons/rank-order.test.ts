import { describe, expect, it } from "vitest";
import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { mapPayloadScreen } from "@/lib/academy/lessons/payload/map-payload-lesson";
import type { PayloadScreenRow } from "@/lib/academy/lessons/payload/types";
import {
  openingRankOrder,
  rankOrderMatches,
  resolveRankOrderIds,
  tokenScore,
} from "@/lib/academy/lessons/rank-order";
import type { RankOrderScreenConfig } from "@/lib/academy/lessons/types/screens/rank-order";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

const COHORTS: readonly MasteryCohort[] = ["explorer", "pathfinder", "maverick"];

function bundledLessonNumbers(): number[] {
  const numbers: number[] = [];
  for (let lessonNumber = 1; lessonNumber <= 24; lessonNumber += 1) {
    try {
      loadBundledLessonPayload(1, lessonNumber);
      numbers.push(lessonNumber);
    } catch {
      // Screens1.csv has no row for this lesson.
    }
  }
  return numbers;
}

function settingsText(row: PayloadScreenRow, cohort: MasteryCohort): string {
  const own = row.settings[cohort].trim();
  return own || row.settings.pathfinder.trim();
}

function orderTokens(raw: string): string[] {
  const line = raw
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find((entry) => /^ORDER:/i.test(entry));
  if (!line) return [];
  return line
    .replace(/^ORDER:\s*/i, "")
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);
}

function rankOrderCases(): {
  lessonNumber: number;
  cohort: MasteryCohort;
  row: PayloadScreenRow;
}[] {
  const cases: {
    lessonNumber: number;
    cohort: MasteryCohort;
    row: PayloadScreenRow;
  }[] = [];
  for (const lessonNumber of bundledLessonNumbers()) {
    const payload = loadBundledLessonPayload(1, lessonNumber);
    for (const row of payload.screens) {
      if (row.gameType !== "rank-order") continue;
      for (const cohort of COHORTS) {
        cases.push({ lessonNumber, cohort, row });
      }
    }
  }
  return cases;
}

describe("rankOrderMatches", () => {
  it("is true only when the full order matches", () => {
    expect(rankOrderMatches(["keep", "cheaper", "borrow"], ["keep", "cheaper", "borrow"])).toBe(
      true,
    );
    expect(rankOrderMatches(["borrow", "cheaper", "keep"], ["keep", "cheaper", "borrow"])).toBe(
      false,
    );
    expect(rankOrderMatches(["keep", "cheaper"], ["keep", "cheaper", "borrow"])).toBe(false);
    expect(rankOrderMatches([], [])).toBe(false);
  });
});

describe("resolveRankOrderIds", () => {
  const items = [
    { id: "keep-0", label: "Don't buy anything - keep the $10 for 'needs'." },
    { id: "cheaper-1", label: "Choose something cheaper, so he has some money left." },
    { id: "borrow-2", label: "Borrow money from dad to buy the lemonade." },
  ];

  it("maps ORDER keys that are not the item ids", () => {
    expect(resolveRankOrderIds(items, ["keep", "cheaper", "borrow"])).toEqual([
      "keep-0",
      "cheaper-1",
      "borrow-2",
    ]);
  });

  it("matches a curly apostrophe in didn't buy", () => {
    const sequence = [
      { id: "skip", label: "Lars didn\u2019t buy the Dart Blaster last week." },
      { id: "spend", label: "Lars has enough money and spends $9 on his half." },
      { id: "remain", label: "Lars still has $6 left." },
    ];
    expect(resolveRankOrderIds(sequence, ["didn't buy", "spends", "left"])).toEqual([
      "skip",
      "spend",
      "remain",
    ]);
    expect(tokenScore(sequence[0]!.label, "didn't buy")).toBeGreaterThan(0);
  });
});

describe("openingRankOrder", () => {
  it("does not open on the correct order", () => {
    const ids = ["keep", "cheaper", "borrow"];
    expect(openingRankOrder(ids, ids)).not.toEqual(ids);
  });
});

describe("Screens1.csv rank-order screens", () => {
  const cases = rankOrderCases();

  it("finds a rank-order screen on every track", () => {
    expect(cases.length).toBeGreaterThan(0);
    expect(new Set(cases.map((entry) => entry.cohort))).toEqual(new Set(COHORTS));
  });

  it.each(cases)(
    "lesson $lessonNumber $cohort correct order evaluates as correct",
    ({ lessonNumber, cohort, row }) => {
      expect(lessonNumber).toBeGreaterThan(0);
      const screen = mapPayloadScreen(row, cohort);
      expect(screen.type).toBe("rank-order");
      if (screen.type !== "rank-order") return;
      const ranked = screen as RankOrderScreenConfig;
      const tokens = orderTokens(settingsText(row, cohort));
      expect(tokens.length).toBe(ranked.items.length);

      const resolved = resolveRankOrderIds(ranked.items, tokens);
      expect(ranked.correctOrder).toEqual(resolved);
      expect(rankOrderMatches([...ranked.correctOrder], resolved)).toBe(true);

      tokens.forEach((token, index) => {
        const item = ranked.items.find((entry) => entry.id === resolved[index]);
        expect(item, token).toBeDefined();
        expect(tokenScore(item?.label ?? "", token), token).toBeGreaterThan(0);
      });

      expect(
        openingRankOrder(
          ranked.items.map((item) => item.id),
          ranked.correctOrder,
        ),
      ).not.toEqual([...ranked.correctOrder]);
    },
  );
});
