import { findAllOfTheAboveCorrectKey } from "@/lib/academy/lessons/all-of-the-above";
import { allocationNextEnabled, type AllocationMatch } from "@/lib/academy/lessons/allocation-slider";
import { collectMultipleChoiceOptions } from "@/lib/academy/lessons/multiple-choice-options";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import type { LessonPayload } from "@/lib/academy/lessons/payload/types";
import type { ScreenConfig } from "@/lib/academy/lessons/types";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

const COHORTS: readonly MasteryCohort[] = ["explorer", "pathfinder", "maverick"];

/**
 * What a wrong answer is on a scored screen.
 * Story cards, free decisions, tap-reveal, and the skill hub are not here:
 * those screens never call the mistake counter.
 */
export type ScreenHeartCost = {
  costsHeart: boolean;
  wrongAnswer: string;
};

/**
 * Whether a miss on this screen is scored.
 * A scored miss empties the header coin meter and counts against the perfect bonus.
 * Mirrors the mistake calls in the screen components: a graded pick, a wrong
 * drop, an early release, a slider let-go on the wrong amount, and the same
 * misses. Continue cards, `decisionPath` choices, all-of-the-above statements,
 * a single spent bucket, tap-reveal, and the hub do not.
 */
export function screenHeartCost(screen: ScreenConfig): ScreenHeartCost {
  switch (screen.type) {
    case "word-drop":
      return wordDropCanMiss(screen)
        ? { costsHeart: true, wrongAnswer: "a wrong word in a blank" }
        : none();
    case "true-false":
      return { costsHeart: true, wrongAnswer: "the wrong True or False" };
    case "binary-choice":
    case "multiple-choice":
      return choiceHeartCost(screen);
    case "spotlight-rounds":
      if (screen.decisionPath || screen.rounds.length === 0) return none();
      return { costsHeart: true, wrongAnswer: "a wrong pick on a round" };
    case "bucket-sort":
      return bucketHeartCost(screen);
    case "rank-order":
      return screen.items.length > 1
        ? { costsHeart: true, wrongAnswer: "a wrong order on Submit" }
        : none();
    case "link-match":
      return screen.pairs.length > 1
        ? { costsHeart: true, wrongAnswer: "a mismatched pair" }
        : none();
    case "hold-to-fill":
      return { costsHeart: true, wrongAnswer: "letting go early" };
    case "drag-to-target":
      return { costsHeart: true, wrongAnswer: "letting go off the target" };
    case "savings-goal":
      return { costsHeart: true, wrongAnswer: "a drop outside the box" };
    case "allocation-slider":
      return sliderCanMiss(screen.total, screen.targetMin, screen.match ?? "exact")
        ? {
            costsHeart: true,
            wrongAnswer:
              screen.match === "at-least"
                ? "letting go of the slider below the amount to keep"
                : "letting go of the slider on an amount other than the target",
          }
        : none();
    case "budget-select":
      return budgetCanMiss(screen)
        ? {
            costsHeart: true,
            wrongAnswer: "checking an item that is not needed, or going over the total",
          }
        : none();
    case "tap-reveal":
    case "narrative-bonus":
    case "skill-hub":
    case "completion":
    case "custom":
      return none();
    default: {
      const uncovered: never = screen;
      return uncovered;
    }
  }
}

function none(): ScreenHeartCost {
  return { costsHeart: false, wrongAnswer: "" };
}

function wordDropCanMiss(screen: Extract<ScreenConfig, { type: "word-drop" }>): boolean {
  const blanks =
    screen.blanks && screen.blanks.length > 0
      ? screen.blanks
      : [{ options: screen.options, correctOption: screen.correctOption }];
  const pool =
    screen.options.length > 0 ? screen.options : blanks.flatMap((blank) => [...blank.options]);
  return blanks.some((blank) => pool.some((word) => word !== blank.correctOption));
}

function choiceHeartCost(
  screen: Extract<ScreenConfig, { type: "binary-choice" | "multiple-choice" }>,
): ScreenHeartCost {
  if (screen.decisionPath) return none();
  const options = collectMultipleChoiceOptions(screen);
  if (options.length === 0 || findAllOfTheAboveCorrectKey(options)) return none();
  if (!options.some((option) => option.isCorrect !== true)) return none();
  const severalCorrect = options.filter((option) => option.isCorrect).length > 1;
  if (screen.type === "binary-choice") {
    return { costsHeart: true, wrongAnswer: "the wrong choice" };
  }
  return {
    costsHeart: true,
    wrongAnswer: severalCorrect
      ? "selecting an option that is not one of the right answers"
      : "a wrong answer",
  };
}

function bucketHeartCost(
  screen: Extract<ScreenConfig, { type: "bucket-sort" }>,
): ScreenHeartCost {
  const canMiss = screen.items.some((item) =>
    screen.buckets.some((bucket) => bucket.id !== item.bucket),
  );
  if (!canMiss) return none();
  return {
    costsHeart: true,
    wrongAnswer:
      screen.layout === "steps-row" ? "a card on the wrong step" : "a drop in the wrong bucket",
  };
}

/** A non-zero let-go that fails the screen's match is scored. $0 does not. */
function sliderCanMiss(
  total: number,
  targetMin: number,
  match: AllocationMatch,
): boolean {
  const totalAmount = Math.round(total);
  if (totalAmount <= 0) return false;
  for (let amount = 1; amount <= totalAmount; amount += 1) {
    if (!allocationNextEnabled(amount, targetMin, match)) return true;
  }
  return false;
}

function budgetCanMiss(screen: Extract<ScreenConfig, { type: "budget-select" }>): boolean {
  if (screen.items.some((item) => !screen.correctIds.includes(item.id))) return true;
  const sum = screen.items.reduce((total, item) => total + item.price, 0);
  return sum > screen.total;
}

export type BlankHeartError = {
  moduleNumber: number;
  lessonNumber: number;
  screenLabel: string;
  gameType: string;
  cohort: MasteryCohort;
  wrongAnswer: string;
  text: {
    explorer: string;
    pathfinder: string;
    maverick: string;
  };
};

export type BlankHeartErrorKey = Pick<
  BlankHeartError,
  "moduleNumber" | "lessonNumber" | "screenLabel" | "cohort"
>;

/** Stable identity for the allowlist. One row per blank cohort cell. */
export function blankHeartErrorKey(entry: BlankHeartErrorKey): string {
  return `${entry.moduleNumber}|${entry.lessonNumber}|${entry.screenLabel}|${entry.cohort}`;
}

/**
 * Heart-costing screens whose own Error cell is empty for a cohort.
 * A blank cell is empty even when the player would fall back to Pathfinder.
 * Each cohort needs its own line.
 */
export function findBlankHeartErrors(payload: LessonPayload): BlankHeartError[] {
  const found: BlankHeartError[] = [];
  for (const cohort of COHORTS) {
    const content = resolvePayloadLesson(payload, cohort, payload.lessonNumber);
    payload.screens.forEach((row, index) => {
      const screen = content.screens[index];
      if (!screen) return;
      const cost = screenHeartCost(screen);
      if (!cost.costsHeart) return;
      if (row.error[cohort].trim()) return;
      found.push({
        moduleNumber: payload.moduleNumber,
        lessonNumber: payload.lessonNumber,
        screenLabel: row.screenLabel,
        gameType: row.gameType,
        cohort,
        wrongAnswer: cost.wrongAnswer,
        text: {
          explorer: row.text.explorer.trim(),
          pathfinder: row.text.pathfinder.trim(),
          maverick: row.text.maverick.trim(),
        },
      });
    });
  }
  return found;
}

const COHORT_LABEL: Record<MasteryCohort, string> = {
  explorer: "Explorer",
  pathfinder: "Pathfinder",
  maverick: "Maverick",
};

function screenSortKey(label: string): string {
  const digits = /^(\d+)/.exec(label.trim())?.[1];
  const number = digits ? digits.padStart(4, "0") : "9999";
  return `${number}:${label}`;
}

function oneLine(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed || "(no screen text)";
}

/**
 * Writer notes for the current blanks. Describes the miss. Does not invent
 * the error sentence.
 */
export function formatBlankHeartErrorDoc(blanks: readonly BlankHeartError[]): string {
  const groups = new Map<
    string,
    {
      lessonNumber: number;
      screenLabel: string;
      gameType: string;
      wrongAnswer: string;
      cohorts: MasteryCohort[];
      text: BlankHeartError["text"];
    }
  >();

  for (const blank of blanks) {
    const key = `${blank.lessonNumber}|${blank.screenLabel}|${blank.gameType}|${blank.wrongAnswer}`;
    const group = groups.get(key);
    if (group) {
      group.cohorts.push(blank.cohort);
      continue;
    }
    groups.set(key, {
      lessonNumber: blank.lessonNumber,
      screenLabel: blank.screenLabel,
      gameType: blank.gameType,
      wrongAnswer: blank.wrongAnswer,
      cohorts: [blank.cohort],
      text: blank.text,
    });
  }

  const ordered = [...groups.values()].sort((left, right) => {
    if (left.lessonNumber !== right.lessonNumber) return left.lessonNumber - right.lessonNumber;
    return screenSortKey(left.screenLabel).localeCompare(screenSortKey(right.screenLabel));
  });

  const lines = [
    "# Module 1 blank error lines",
    "",
    "Storybird: a miss on these screens empties the coin meter in the lesson header, and the Error cell is empty for the cohorts named below. Write a short error line for each blank cohort. Leave every other word on the screen as it is.",
    "",
    "This list is temporary. When a cell has text, take that cohort off the list.",
    "",
    "Not listed: story and continue cards, free choices with no wrong answer (lesson 8's decisions), tap-reveal, the skill hub, an all-of-the-above question (those picks do not empty the coin meter), and a single Spent bucket (every drop lands in the only bucket).",
    "",
    `${ordered.length} screens.`,
    "",
  ];

  for (const group of ordered) {
    const who = group.cohorts.map((cohort) => COHORT_LABEL[cohort]).join(", ");
    lines.push(
      `## Lesson ${group.lessonNumber}, screen ${group.screenLabel}`,
      "",
      `Game type: ${group.gameType}`,
      "",
      `Blank for: ${who}`,
      "",
      `Wrong answer: ${group.wrongAnswer}`,
      "",
      `Explorer: ${oneLine(group.text.explorer)}`,
      "",
      `Pathfinder: ${oneLine(group.text.pathfinder)}`,
      "",
      `Maverick: ${oneLine(group.text.maverick)}`,
      "",
    );
  }

  return `${lines.join("\n").trim()}\n`;
}
