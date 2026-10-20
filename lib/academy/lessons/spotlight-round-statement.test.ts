import { readFileSync } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SpotlightRoundsScreen } from "@/components/academy/lesson/screens/spotlight-rounds-screen";
import type { LessonFlow } from "@/lib/academy/lessons/hooks/use-lesson-flow";
import { splitPromptParagraphs } from "@/lib/academy/lessons/prompt-paragraphs";
import {
  cashMatches,
  displayCashText,
} from "@/lib/academy/lessons/payload/cash-placeholder";
import { loadBundledLessonPayload } from "@/lib/academy/lessons/payload/load-lesson-payload";
import { resolvePayloadLesson } from "@/lib/academy/lessons/payload/map-payload-lesson";
import { parseAuthoringTable } from "@/lib/academy/lessons/payload/parse-authoring-table";
import type { PayloadCohortCopy } from "@/lib/academy/lessons/payload/types";
import type { SpotlightRoundsScreenConfig } from "@/lib/academy/lessons/types";
import type { LessonRewards } from "@/lib/academy/lessons/types/meta";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

const COHORTS: readonly MasteryCohort[] = ["explorer", "pathfinder", "maverick"];

/** `Round 1 | statement | True | False | CORRECT: A` */
const STATEMENT_LINE =
  /^Round\s+\d+\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*CORRECT\s*:\s*([AB])\s*$/i;

const REWARDS: LessonRewards = {
  skillSlug: "keep-spare-cash",
  achievementSkillSlug: "keep-spare-cash",
  xpReward: 100,
  perfectStreakBonus: 50,
};

const FLOW = {
  setBonusRunUnit: () => {},
  recordBonusRunCorrect: () => {},
  incrementMistake: () => {},
  markScreenReady: () => {},
} as unknown as LessonFlow;

type SheetSpotlight = {
  moduleNumber: number;
  lessonNumber: number;
  screenLabel: string;
  cohort: MasteryCohort;
  settings: string;
};

function columnIndex(headers: readonly string[], name: string): number {
  const index = headers.findIndex((header) => header.trim().toLowerCase() === name.toLowerCase());
  if (index < 0) throw new Error(`Missing column "${name}".`);
  return index;
}

function cell(row: readonly string[], index: number): string {
  return (row[index] ?? "").trim();
}

/** Blank cohort cells use the Pathfinder column, same as the payload mapper. */
function cohortSettings(copy: PayloadCohortCopy, cohort: MasteryCohort): string {
  const own = copy[cohort].trim();
  if (own) return own;
  return copy.pathfinder.trim();
}

function sheetSpotlights(): SheetSpotlight[] {
  const rows = parseAuthoringTable({
    filename: "Screens1.csv",
    text: readFileSync(
      path.join(process.cwd(), "lib/academy/lessons/payload/source/Screens1.csv"),
      "utf8",
    ),
  });
  const headers = rows[0] ?? [];
  const moduleIndex = columnIndex(headers, "Module Number");
  const lessonIndex = columnIndex(headers, "Lesson Number");
  const screenIndex = columnIndex(headers, "Screen");
  const gameIndex = columnIndex(headers, "Game Type");
  const explorerIndex = columnIndex(headers, "Explorer Settings");
  const pathfinderIndex = columnIndex(headers, "Game Settings");
  const maverickIndex = columnIndex(headers, "Maverick Settings");
  const found: SheetSpotlight[] = [];

  for (const row of rows.slice(1)) {
    if (cell(row, gameIndex) !== "spotlight-rounds") continue;
    const moduleNumber = Number.parseInt(cell(row, moduleIndex), 10);
    const lessonNumber = Number.parseInt(cell(row, lessonIndex), 10);
    const screenLabel = cell(row, screenIndex);
    const copy: PayloadCohortCopy = {
      explorer: cell(row, explorerIndex),
      pathfinder: cell(row, pathfinderIndex),
      maverick: cell(row, maverickIndex),
    };
    for (const cohort of COHORTS) {
      found.push({
        moduleNumber,
        lessonNumber,
        screenLabel,
        cohort,
        settings: cohortSettings(copy, cohort),
      });
    }
  }

  return found;
}

function statementsIn(raw: string): string[] {
  const statements: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const match = STATEMENT_LINE.exec(line.trim());
    if (!match) continue;
    const statement = (match[1] ?? "").replace(/\s+/g, " ").trim();
    if (statement) statements.push(statement);
  }
  return statements;
}

function renderSpotlight(screen: SpotlightRoundsScreenConfig): string {
  return renderToStaticMarkup(
    createElement(SpotlightRoundsScreen, {
      screen,
      screenIndex: 0,
      flow: FLOW,
      rewards: REWARDS,
    }),
  );
}

/** Text a kid would read. React escapes apostrophes in the markup. */
function visibleText(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function withRoundFirst(
  screen: SpotlightRoundsScreenConfig,
  index: number,
): SpotlightRoundsScreenConfig {
  if (index <= 0) return screen;
  const rounds = [...screen.rounds];
  const picked = rounds[index];
  if (!picked) return screen;
  rounds.splice(index, 1);
  return { ...screen, rounds: [picked, ...rounds] };
}

describe("spotlight round statements", () => {
  const sheets = sheetSpotlights();

  it("renders every Screens1 round statement on the shared spotlight screen", () => {
    const rendered: string[] = [];

    for (const sheet of sheets) {
      const statements = statementsIn(sheet.settings);
      if (statements.length === 0) continue;

      const content = resolvePayloadLesson(
        loadBundledLessonPayload(sheet.moduleNumber, sheet.lessonNumber),
        sheet.cohort,
        sheet.lessonNumber,
      );
      const screen = content.screens.find(
        (item) => item.type === "spotlight-rounds" && item.sourceLabel === sheet.screenLabel,
      );
      const where = `M${sheet.moduleNumber} L${sheet.lessonNumber} screen ${sheet.screenLabel} ${sheet.cohort}`;
      expect(screen, where).toMatchObject({ type: "spotlight-rounds" });
      if (screen?.type !== "spotlight-rounds") continue;

      for (const statement of statements) {
        const index = screen.rounds.findIndex((round) => round.prompt === statement);
        expect(index, `${where} dropped "${statement}"`).toBeGreaterThanOrEqual(0);
        const html = visibleText(renderSpotlight(withRoundFirst(screen, index)));
        expect(html, `${where} round ${index + 1}`).toContain(statement);
        for (const other of statements) {
          if (other === statement) continue;
          expect(html, `${where} should show one round at a time`).not.toContain(other);
        }
        rendered.push(statement);
      }
    }

    expect(rendered).toContain(
      "Lars saved his money last week so now he can pay his half of the cinema outing.",
    );
    expect(rendered.length).toBeGreaterThanOrEqual(9);
  });

  it("still renders the prompt and choices on every other spotlight screen", () => {
    expect(sheets.length).toBeGreaterThan(0);
    let checked = 0;

    for (const sheet of sheets) {
      if (statementsIn(sheet.settings).length > 0) continue;
      const content = resolvePayloadLesson(
        loadBundledLessonPayload(sheet.moduleNumber, sheet.lessonNumber),
        sheet.cohort,
        sheet.lessonNumber,
      );
      const screen = content.screens.find(
        (item) => item.type === "spotlight-rounds" && item.sourceLabel === sheet.screenLabel,
      );
      const where = `M${sheet.moduleNumber} L${sheet.lessonNumber} screen ${sheet.screenLabel} ${sheet.cohort}`;
      expect(screen?.type, where).toBe("spotlight-rounds");
      if (screen?.type !== "spotlight-rounds") continue;

      const html = visibleText(renderSpotlight(screen));
      const prompt = screen.decisionPath
        ? displayCashText(screen.prompt, null)
        : screen.prompt;
      for (const paragraph of splitPromptParagraphs(prompt)) {
        expect(html, where).toContain(paragraph);
      }

      if (screen.decisionPath) {
        const labels = (screen.options ?? [])
          .filter((option) => cashMatches(option.showWhen, null))
          .map((option) => displayCashText(option.label, null))
          .filter((label) => label.trim());
        expect(labels.length, where).toBeGreaterThan(0);
        for (const label of labels) expect(html, where).toContain(label);
      } else {
        const round = screen.rounds[0];
        expect(round?.optionA.trim(), where).not.toBe("");
        expect(round?.optionB.trim(), where).not.toBe("");
        expect(html, where).toContain(round?.optionA ?? "");
        expect(html, where).toContain(round?.optionB ?? "");
        expect(round?.prompt, where).toBeUndefined();
      }
      checked += 1;
    }

    expect(checked).toBeGreaterThan(0);
  });
});
