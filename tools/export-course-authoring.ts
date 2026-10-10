/**
 * Live lessons → course-wide Lesson-Details.csv + Screens.csv
 * Usage: npx tsx tools/export-course-authoring.ts
 */
import fs from "node:fs";
import path from "node:path";
import { LESSON_DEFINITIONS } from "@/lib/academy/lessons/registry";
import { resolveLessonDefinition } from "@/lib/academy/lessons/types/resolve";
import type {
  CohortLessonDefinition,
  ScreenConfig,
} from "@/lib/academy/lessons/types";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

const OUT_DIR = path.join(process.cwd(), "templates/lesson-authoring");
const COPIED = "copied";

const DETAIL_HEADERS = [
  "Module Number",
  "Lesson Number",
  "Field",
  "Value",
  "Notes",
] as const;

const SCREEN_HEADERS = [
  "Module Number",
  "Lesson Number",
  "Screen",
  "Game Type",
  "Explorer Text",
  "Pathfinder Text",
  "Maverick Text",
  "Explorer Image",
  "Pathfinder Image",
  "Maverick Image",
  "Explorer Settings",
  "Game Settings",
  "Maverick Settings",
  "Error Explorer",
  "Error Pathfinder",
  "Error Maverick",
  "Notes",
] as const;

const GAME_TYPE_LABEL: Record<string, string> = {
  "word-drop": "Word Drop",
  "binary-choice": "Two Choices",
  "multiple-choice": "Multiple Choice",
  "true-false": "True False",
  "tap-reveal": "Tap to Reveal",
  "bucket-sort": "Drag Sort",
  "hold-to-fill": "Hold Button",
  "narrative-bonus": "Celebration",
  completion: "Lesson Complete",
  "rank-order": "Rank Choices",
  "spotlight-rounds": "Pick One Rounds",
  "budget-select": "Budget Checkboxes",
  "allocation-slider": "Budget Slider",
  "drag-to-target": "Gift Reveal",
  "savings-goal": "Value Accumulator",
  "link-match": "Tap Pairs",
};

const SKILL_NAME: Record<string, string> = {
  "stop-and-think": "Stop & Think",
  "put-needs-first": "Put Needs First",
  "keep-some-aside": "Keep Some Aside",
};

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function row(cells: string[]): string {
  return cells.map(csvEscape).join(",");
}

function mainText(screen: ScreenConfig): string {
  const s = screen as Record<string, unknown>;
  if (typeof s.narrativeBefore === "string") {
    return `${s.narrativeBefore} ______ ${String(s.narrativeAfter ?? "")}`.trim();
  }
  for (const key of ["prompt", "intro", "narrative", "scenePrompt"] as const) {
    if (typeof s[key] === "string" && s[key]) return s[key] as string;
  }
  return "";
}

function errorText(screen: ScreenConfig): string {
  const s = screen as Record<string, unknown>;
  if (typeof s.wrongError === "string") return s.wrongError;
  if (typeof s.sliderError === "string") return s.sliderError;
  return "";
}

function gameTypeLabel(screen: ScreenConfig): string {
  if (screen.type === "binary-choice" && screen.errorStyle === "banner") {
    return "Speed Choice";
  }
  return GAME_TYPE_LABEL[screen.type] ?? screen.type;
}

function pairImageCell(screen: ScreenConfig): string {
  const value = (screen as { pairImage?: unknown }).pairImage;
  if (value === false) return "not allowed";
  if (typeof value === "string" && value.trim()) return value.trim();
  return "";
}

function omitPairImage(screen: ScreenConfig): Record<string, unknown> {
  const copy = { ...(screen as unknown as Record<string, unknown>) };
  delete copy.pairImage;
  return copy;
}

function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function humanSettings(screen: ScreenConfig): string {
  const lines: string[] = [`ID: ${screen.id}`];
  const s = screen as Record<string, unknown>;

  if (screen.type === "word-drop") {
    const options = Array.isArray(s.options) ? (s.options as string[]) : [];
    if (options.length) lines.push(`OPTIONS: ${options.join(" | ")}`);
    if (s.correctOption) lines.push(`CORRECT: ${s.correctOption}`);
  }

  if (screen.type === "true-false") {
    lines.push(`CORRECT: ${s.correctAnswer ?? "false"}`);
  }

  if (screen.type === "binary-choice") {
    const a = s.optionA as { label?: string; isCorrect?: boolean } | undefined;
    const b = s.optionB as { label?: string; isCorrect?: boolean } | undefined;
    if (a?.label) lines.push(`CHOICE A: ${a.label}`);
    if (b?.label) lines.push(`CHOICE B: ${b.label}`);
    lines.push(`CORRECT: ${a?.isCorrect ? "A" : "B"}`);
  }

  if (screen.type === "multiple-choice") {
    lines.push(...choiceLines(screen));
  }

  if (screen.type === "tap-reveal" || screen.type === "bucket-sort") {
    const items = Array.isArray(s.items) ? (s.items as Array<Record<string, string>>) : [];
    if (items.length) {
      lines.push("ITEMS:");
      for (const item of items) {
        const bucket = (item.bucket ?? "").toUpperCase();
        const emoji = item.emoji ? `${item.emoji} ` : "";
        lines.push(`${bucket || "ITEM"}: ${emoji}${item.label ?? ""}`.trim());
      }
    }
  }

  if (screen.type === "rank-order") {
    const items = Array.isArray(s.items) ? (s.items as Array<{ id: string; label: string }>) : [];
    for (const item of items) lines.push(`ITEMS: ${item.label}`);
    const order = Array.isArray(s.correctOrder) ? (s.correctOrder as string[]) : [];
    if (order.length) lines.push(`ORDER: ${order.join(",")}`);
  }

  if (screen.type === "hold-to-fill") {
    if (s.holdLabel) lines.push(`HOLD: ${s.holdLabel}`);
  }

  return lines.join("\n");
}

function itemLines(screen: ScreenConfig): string[] {
  const items = (screen as { items?: Array<Record<string, string>> }).items;
  if (!Array.isArray(items) || !items.length) return [];
  if (screen.type === "rank-order") {
    return items.map((item) => `ITEMS: ${item.label ?? ""}`);
  }
  const lines = ["ITEMS:"];
  for (const item of items) {
    const bucket = (item.bucket ?? "").toUpperCase();
    const emoji = item.emoji ? `${item.emoji} ` : "";
    lines.push(`${bucket || "ITEM"}: ${emoji}${item.label ?? ""}`.trim());
  }
  return lines;
}

function choiceLines(screen: ScreenConfig): string[] {
  if (screen.type === "binary-choice") {
    const s = screen as Record<string, unknown>;
    const a = s.optionA as { label?: string; isCorrect?: boolean } | undefined;
    const b = s.optionB as { label?: string; isCorrect?: boolean } | undefined;
    const lines: string[] = [];
    if (a?.label) lines.push(`CHOICE A: ${a.label}`);
    if (b?.label) lines.push(`CHOICE B: ${b.label}`);
    lines.push(`CORRECT: ${a?.isCorrect ? "A" : "B"}`);
    return lines;
  }
  if (screen.type !== "multiple-choice") return [];
  const s = screen as Record<string, unknown>;
  const lines: string[] = [];
  const correct: string[] = [];
  for (let index = 0; index < 26; index += 1) {
    const letter = String.fromCharCode(65 + index);
    const option = s[`option${letter}`] as
      | { label?: string; isCorrect?: boolean }
      | undefined;
    if (!option?.label) continue;
    lines.push(`CHOICE ${letter}: ${option.label}`);
    if (option.isCorrect) correct.push(letter);
  }
  const options = Array.isArray(s.options)
    ? (s.options as Array<{ label?: string; isCorrect?: boolean }>)
    : [];
  if (!lines.length && options.length) {
    options.forEach((option, index) => {
      const letter = String.fromCharCode(65 + index);
      if (!option.label) return;
      lines.push(`CHOICE ${letter}: ${option.label}`);
      if (option.isCorrect) correct.push(letter);
    });
  }
  if (correct.length) lines.push(`CORRECT: ${correct.join(", ")}`);
  return lines;
}

function cohortPayloadSettings(screen: ScreenConfig, base: ScreenConfig): string {
  if (sameJson(omitPairImage(screen), omitPairImage(base))) return "";
  const lines: string[] = [];
  const s = screen as Record<string, unknown>;
  const b = base as Record<string, unknown>;
  if (JSON.stringify(s.options) !== JSON.stringify(b.options) && Array.isArray(s.options)) {
    lines.push(`OPTIONS: ${(s.options as string[]).join(" | ")}`);
  }
  if (s.correctOption && s.correctOption !== b.correctOption) {
    lines.push(`CORRECT: ${s.correctOption}`);
  }
  if (s.correctAnswer && s.correctAnswer !== b.correctAnswer) {
    lines.push(`CORRECT: ${s.correctAnswer}`);
  }
  if (
    JSON.stringify(s.optionA) !== JSON.stringify(b.optionA) ||
    JSON.stringify(s.optionB) !== JSON.stringify(b.optionB) ||
    JSON.stringify(s.optionC) !== JSON.stringify(b.optionC) ||
    JSON.stringify(s.optionD) !== JSON.stringify(b.optionD) ||
    JSON.stringify(s.optionE) !== JSON.stringify(b.optionE) ||
    JSON.stringify(s.options) !== JSON.stringify(b.options)
  ) {
    lines.push(...choiceLines(screen));
  }
  if (JSON.stringify(s.items) !== JSON.stringify(b.items)) {
    lines.push(...itemLines(screen));
  }
  if (JSON.stringify(s.correctOrder) !== JSON.stringify(b.correctOrder) && Array.isArray(s.correctOrder)) {
    lines.push(`ORDER: ${(s.correctOrder as string[]).join(",")}`);
  }
  if (s.holdLabel && s.holdLabel !== b.holdLabel) {
    lines.push(`HOLD: ${s.holdLabel}`);
  }
  return lines.join("\n");
}

function skillName(slug: string, screens: readonly ScreenConfig[]): string {
  const completion = screens.find((s) => s.type === "completion") as
    | { skillLearnedLabel?: string }
    | undefined;
  const labeled = completion?.skillLearnedLabel?.replace(/^Skill Learned:\s*/i, "").trim();
  if (labeled) return labeled;
  return SKILL_NAME[slug] ?? slug;
}

function characterNames(def: CohortLessonDefinition) {
  const chars = def.meta.characters;
  return {
    explorer:
      def.byCohort.explorer?.characterName || chars?.explorer || chars?.lead || "Lars",
    pathfinder:
      def.byCohort.pathfinder?.characterName || chars?.pathfinder || "Holly",
    maverick: resolveLessonDefinition(def, "maverick").characterName || "Dash",
    support: chars?.support || "",
  };
}

function copiedOrText(own: string, explorer: string): string {
  return own.trim() === explorer.trim() ? COPIED : own;
}

function main() {
  const detailRows: string[] = [row([...DETAIL_HEADERS])];
  const screenRows: string[] = [row([...SCREEN_HEADERS])];

  const lessonIds = Object.keys(LESSON_DEFINITIONS)
    .map((key) => Number.parseInt(key, 10))
    .filter((id) => Number.isFinite(id))
    .sort((a, b) => a - b);

  for (const lessonId of lessonIds) {
    const def = LESSON_DEFINITIONS[lessonId];
    if (!def) continue;
    const moduleNum = String(def.meta.levelId);
    const lessonNum = String(def.meta.lessonNumber);
    const resolved = {
      explorer: resolveLessonDefinition(def, "explorer" as MasteryCohort),
      pathfinder: resolveLessonDefinition(def, "pathfinder" as MasteryCohort),
      maverick: resolveLessonDefinition(def, "maverick" as MasteryCohort),
    };
    const names = characterNames(def);
    const slug = def.rewards.skillSlug;
    const fields: Array<[string, string, string]> = [
      ["Lesson Title", def.meta.lessonTitle, "Shown in the app header"],
      ["Level", moduleNum, "Academy level 1–6"],
      ["Pathfinder Character", names.pathfinder, "Teen story voice"],
      ["Explorer Character", names.explorer, "Younger story"],
      ["Maverick Character", names.maverick, "Older teen story"],
      ["Support Character", names.support, "Optional peer / mentor"],
      ["Skill Name", skillName(slug, resolved.pathfinder.screens), "Bronze skill on Screen 8"],
      ["Skill ID", slug, "kebab-case skill slug"],
    ];

    for (const [field, value, notes] of fields) {
      detailRows.push(row([moduleNum, lessonNum, field, value, notes]));
    }

    const count = resolved.explorer.screens.length;
    for (let i = 0; i < count; i += 1) {
      const explorer = resolved.explorer.screens[i];
      const pathfinder = resolved.pathfinder.screens[i];
      const maverick = resolved.maverick.screens[i];
      if (!explorer || !pathfinder || !maverick) continue;
      const explorerText = mainText(explorer);
      const pathfinderText = mainText(pathfinder);
      const maverickText = mainText(maverick);
      const baseForSettings = pathfinder;
      const note =
        pathfinderText.trim() === explorerText.trim() ||
        maverickText.trim() === explorerText.trim()
          ? "copied = Pathfinder/Maverick cell uses the Explorer story"
          : "";

      screenRows.push(
        row([
          moduleNum,
          lessonNum,
          String(i + 1),
          gameTypeLabel(pathfinder),
          explorerText,
          copiedOrText(pathfinderText, explorerText),
          copiedOrText(maverickText, explorerText),
          pairImageCell(explorer),
          pairImageCell(pathfinder),
          pairImageCell(maverick),
          cohortPayloadSettings(explorer, baseForSettings),
          humanSettings(baseForSettings),
          cohortPayloadSettings(maverick, baseForSettings),
          errorText(explorer),
          errorText(pathfinder),
          errorText(maverick),
          note,
        ]),
      );
    }
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, "Lesson-Details.csv"), `${detailRows.join("\n")}\n`, "utf8");
  fs.writeFileSync(path.join(OUT_DIR, "Screens.csv"), `${screenRows.join("\n")}\n`, "utf8");
  console.log(`Wrote ${path.join(OUT_DIR, "Lesson-Details.csv")}`);
  console.log(`Wrote ${path.join(OUT_DIR, "Screens.csv")}`);
}

main();
