import { lessonCashInXp } from "@/lib/academy/lessons/completion-xp";
import { parseCashUpdate, type CashComparison, type CashUpdate } from "@/lib/academy/lessons/payload/cash-placeholder";
import { goToScreenLabel, parseDecisionScript } from "@/lib/academy/lessons/payload/decision-choices";
import { screenLabelKey } from "@/lib/academy/lessons/payload/lesson-graph";
import {
  characterPoseFilePath,
  isIllustrationId,
} from "@/lib/academy/illustrations/illustration-registry";
import {
  isMedalIllustrationId,
  medalIdForSkillNumber,
  type MedalDisplayStatus,
  type MedalIllustrationId,
} from "@/lib/academy/illustrations/medal-registry";
import type { LessonPayload, PayloadCohortCopy, PayloadScreenRow } from "@/lib/academy/lessons/payload/types";
import { peelLeadingEmoji } from "@/lib/academy/lessons/peel-leading-emoji";
import {
  resolveRankOrderIds,
  unmatchedRankOrderTokens,
} from "@/lib/academy/lessons/rank-order";
import {
  assertSortAuthoring,
  isUnrecognisedSettingLine,
  sortAuthoringIssues,
} from "@/lib/academy/lessons/payload/validate-sort-settings";
import type { ResolvedLessonContent, ScreenConfig } from "@/lib/academy/lessons/types";
import { getSkillRegistryRecord } from "@/lib/skills/skills-registry";
import { ACADEMY_MODULE_TITLES } from "@/lib/dashboard/academy-content";
import type { AcademyLevelId } from "@/lib/dashboard/academy-state";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

type SettingEntry = { key: string; value: string };

const ITEM_BUCKETS = new Set(["SHORT", "LONG", "NEED", "WANT", "YES", "NO", "SPENT"]);

const BUCKET_LABEL: Record<string, { id: string; label: string; tone: "short" | "long" | "need" | "want"; icon: string }> = {
  SHORT: { id: "short", label: "Short Fun", tone: "short", icon: "⚡" },
  LONG: { id: "long", label: "More Fun for Longer", tone: "long", icon: "🌈" },
  NEED: { id: "need", label: "Needs", tone: "need", icon: "🛠️" },
  WANT: { id: "want", label: "Wants", tone: "want", icon: "🎈" },
  YES: { id: "yes", label: "Yes", tone: "need", icon: "🛡️" },
  NO: { id: "no", label: "No", tone: "want", icon: "🚫" },
  SPENT: { id: "spent", label: "Spent", tone: "need", icon: "💸" },
};

/** Wants/Needs headings name the learner in the story. Other buckets keep their label. */
function bucketMeta(
  key: string,
  text: string,
): { id: string; label: string; tone: "short" | "long" | "need" | "want"; icon: string } {
  const meta = BUCKET_LABEL[key] ?? {
    id: key.toLowerCase(),
    label: key,
    tone: "short" as const,
    icon: "•",
  };
  if (key !== "WANT" && key !== "NEED") return meta;
  const name = /\b(Lars|Holly|Aiden)\b/.exec(text)?.[1];
  if (!name) return meta;
  return {
    ...meta,
    label: key === "WANT" ? `Things ${name} wants` : `Things ${name} needs`,
  };
}

function cohortField(copy: PayloadCohortCopy, cohort: MasteryCohort): string {
  const own = copy[cohort].trim();
  if (own) return own;
  return copy.pathfinder.trim();
}

/**
 * Pathfinder settings are the base. A cohort cell that sets every base key
 * replaces the cell. A partial cell keeps the Pathfinder keys it does not set.
 */
function mergedSettingsRaw(copy: PayloadCohortCopy, cohort: MasteryCohort): string {
  const baseRaw = copy.pathfinder;
  if (cohort === "pathfinder") return baseRaw;
  const own = copy[cohort].trim();
  if (!own) return baseRaw;
  const baseEntries = parseSettings(baseRaw);
  const overlayEntries = parseSettings(own);
  const overlayKeys = new Set(overlayEntries.map((entry) => entry.key));
  const baseKeys = new Set(baseEntries.map((entry) => entry.key));
  const coversAll =
    baseEntries.length > 0 && [...baseKeys].every((key) => overlayKeys.has(key));
  if (coversAll) return own;
  const keptBase = baseRaw.split(/\r?\n/).filter((line) => {
    const match = /^([^:]+):\s*/.exec(line.trim());
    if (!match) return overlayEntries.length === 0;
    const key = (match[1] ?? "").trim().toUpperCase();
    return !overlayKeys.has(key);
  });
  return [...keptBase, own].filter((line) => line.trim()).join("\n");
}

function mergedSettings(copy: PayloadCohortCopy, cohort: MasteryCohort): SettingEntry[] {
  return parseSettings(mergedSettingsRaw(copy, cohort));
}

const SETTINGS_KEY =
  /(?:CHOICE\s+[A-Z]|ICON\s+[A-Z]|CORRECT|OPTIONS|BUTTON|CONTINUE|SOURCE|TARGET|RESULT|ORDER|ITEMS|ROUNDS|MEDAL|AVAILABLE|LABEL|HOLD|FROZEN|SUCCESS|ID|SHORT|LONG|NEED|WANT|YES|NO)\s*:|(?:^|\s)([A-H])\s*:/gi;

/** Split one settings line on later keys such as `CHOICE B:` or `CORRECT:`. */
function settingsParts(line: string): string[] {
  const starts: number[] = [];
  SETTINGS_KEY.lastIndex = 0;
  for (const match of line.matchAll(SETTINGS_KEY)) {
    const token = match[0] ?? "";
    const letter = match[1];
    const index = letter
      ? (match.index ?? 0) + token.indexOf(letter)
      : (match.index ?? 0);
    if (letter && /CHOICE\s+$/i.test(line.slice(0, index))) continue;
    starts.push(index);
  }
  if (starts.length === 0) return [line];
  const parts: string[] = [];
  const first = starts[0] ?? 0;
  if (first > 0) parts.push(line.slice(0, first));
  for (let index = 0; index < starts.length; index += 1) {
    const from = starts[index] ?? 0;
    const to = starts[index + 1] ?? line.length;
    parts.push(line.slice(from, to));
  }
  return parts;
}

function parseSettings(raw: string): SettingEntry[] {
  const entries: SettingEntry[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    for (const part of settingsParts(trimmed)) {
      const match = /^([^:]+):\s*(.*)$/.exec(part.trim());
      if (!match) continue;
      entries.push({
        key: (match[1] ?? "").trim().toUpperCase(),
        value: (match[2] ?? "").trim(),
      });
    }
  }
  return entries;
}

/**
 * `CONTINUE → GO Screen 3` on its own, including after CHOICE lines.
 * A choice whose label is the word Continue (`CHOICE A: Continue → GO`) is not this.
 * Returns the Screen cell to open, such as `3` or `2-alt`.
 */
function continueGoLabel(raw: string): string | undefined {
  const withoutChoices = raw.replace(/CHOICE\s+[A-Z]\s*:[^\n\r]*/gi, "");
  const match = /CONTINUE\s*(?:→|->)\s*GO\s+Screen\s+([A-Za-z0-9-]+)/i.exec(withoutChoices);
  return match?.[1];
}

/** Button copy only. Routing such as `→ SET cash=6 → GO Screen 2` stays out of the label. */
function choiceLabel(value: string): string {
  const head = value.split(/\s*→\s*/)[0] ?? "";
  return head.replace(/\s+/g, " ").trim();
}

function authoredChoices(
  entries: readonly SettingEntry[],
): {
  letter: string;
  label: string;
  cashUpdate?: CashUpdate;
  goToLabel?: string;
  showWhen?: CashComparison;
  requiresCompletedHub?: boolean;
}[] {
  const fromChoiceKeys = entries.filter((entry) => /^CHOICE [A-Z]$/.test(entry.key));
  const source =
    fromChoiceKeys.length > 0
      ? fromChoiceKeys
      : entries.filter((entry) => /^[A-H]$/.test(entry.key));
  const seen = new Set<string>();
  const choices: {
    letter: string;
    label: string;
    cashUpdate?: CashUpdate;
    goToLabel?: string;
    showWhen?: CashComparison;
    requiresCompletedHub?: boolean;
  }[] = [];
  for (const entry of source) {
    const letter = entry.key.replace(/^CHOICE\s+/, "");
    if (seen.has(letter)) continue;
    const label = choiceLabel(entry.value);
    if (!label) continue;
    seen.add(letter);
    const cashUpdate = parseCashUpdate(entry.value);
    const goToLabel = goToScreenLabel(entry.value);
    choices.push({
      letter,
      label,
      ...(cashUpdate ? { cashUpdate } : {}),
      ...(goToLabel ? { goToLabel } : {}),
    });
  }
  return choices;
}

function correctChoiceLetters(entries: readonly SettingEntry[]): Set<string> {
  const raw = (settingValue(entries, "CORRECT") ?? "A").trim().toUpperCase();
  if (/^[A-H](?:\s*\+\s*[A-H])*$/.test(raw)) {
    return new Set(raw.match(/[A-H]/g) ?? ["A"]);
  }
  return new Set([raw.startsWith("B") ? "B" : "A"]);
}

function parseSavingsGoalItems(
  itemText: string,
): { id: string; label: string; price: number; emoji: string }[] {
  const items: { id: string; label: string; price: number; emoji: string }[] = [];
  for (const chunk of itemText.split(/(?<=\))/)) {
    const trimmed = chunk.trim();
    if (!trimmed || /^RESULT\b/i.test(trimmed)) continue;
    const chars = [...trimmed];
    const emoji = readEmojiAt(chars, 0);
    const body = emoji ? chars.slice(emoji.end).join("") : trimmed;
    const priced = /^\s*([^($]+?)\s*\(\$(\d+)\)/.exec(body);
    if (!priced?.[1]) continue;
    const label = priced[1].trim();
    if (!label) continue;
    items.push({
      id: itemSlug(label, items.length),
      label,
      price: Number(priced[2]),
      emoji: emoji?.emoji ?? "",
    });
  }
  return items;
}

function settingValue(entries: readonly SettingEntry[], key: string): string | undefined {
  const found = entries.find((entry) => entry.key === key && entry.value);
  return found?.value;
}

function settingValues(entries: readonly SettingEntry[], key: string): string[] {
  return entries
    .filter((entry) => entry.key === key && entry.value)
    .map((entry) => entry.value);
}

function pipeList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split("|").map((part) => part.trim()).filter(Boolean);
}

function pairImage(value: string): string | false | undefined {
  if (!value) return undefined;
  if (value.toLowerCase() === "not allowed") return false;
  return value;
}

function readEmojiAt(
  chars: readonly string[],
  start: number,
): { emoji: string; end: number } | undefined {
  const firstChar = chars[start] ?? "";
  if (!/^\p{Extended_Pictographic}$/u.test(firstChar)) return undefined;
  let end = start + 1;
  while (end < chars.length) {
    const codePoint = chars[end]?.codePointAt(0) ?? 0;
    if (codePoint === 0xfe0f) {
      end += 1;
      continue;
    }
    if (codePoint === 0x200d) {
      const joined = chars[end + 1]?.codePointAt(0) ?? 0;
      if (joined <= 0xffff) break;
      end += 2;
      if ((chars[end]?.codePointAt(0) ?? 0) === 0xfe0f) end += 1;
      continue;
    }
    break;
  }
  return { emoji: chars.slice(start, end).join(""), end };
}

/** `senna-celebrating` → Senna. `concept-gift-box` → Gift box. */
function labelFromIllustrationId(id: string): string {
  const character = /^(lars|senna|mia|holly|aiden|dash|immi)(?:-|$)/i.exec(id);
  const name = character?.[1];
  if (name) {
    const lower = name.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  const words = id
    .replace(/^concept-/, "")
    .split("-")
    .filter((word) => word.length > 0);
  const phrase = words.join(" ");
  if (!phrase) return id;
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}

function firstEmoji(text: string): string | undefined {
  const chars = [...text];
  for (let index = 0; index < chars.length; index += 1) {
    const found = readEmojiAt(chars, index);
    if (found) return found.emoji;
  }
  return undefined;
}

function splitEmojiLabel(text: string): { emoji?: string; label: string } {
  const chars = [...text.trimStart()];
  const found = readEmojiAt(chars, 0);
  if (!found) return { label: text.trim() };
  const label = chars.slice(found.end).join("").trim();
  return { emoji: found.emoji, label: label || text.trim() };
}

/** A leading emoji on a choice is the button orb. The rest stays the label. */
function withChoiceEmoji<T extends { label: string }>(
  choice: T,
): T & { emoji?: string } {
  const split = splitEmojiLabel(choice.label);
  if (!split.emoji) return choice;
  return { ...choice, label: split.label, emoji: split.emoji };
}

function itemSlug(label: string, index: number): string {
  const base = label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base || "item"}-${index}`;
}

function itemRows(entries: readonly SettingEntry[]): { bucket: string; text: string }[] {
  return entries
    .filter((entry) => ITEM_BUCKETS.has(entry.key) && entry.value)
    .map((entry) => ({ bucket: entry.key, text: entry.value }));
}

function stepRows(entries: readonly SettingEntry[]): SettingEntry[] {
  return entries
    .filter((entry) => /^STEP\d+$/.test(entry.key) && entry.value)
    .sort(
      (left, right) =>
        Number(left.key.slice(4)) - Number(right.key.slice(4)),
    );
}

const SPOTLIGHT_PAIR_LINE =
  /^A\s*:\s*(.+?)\s*\|\s*B\s*:\s*(.+?)\s*\|\s*CORRECT\s*:\s*([AB])\s*$/i;

/** `Round 1 | statement | True | False | CORRECT: A` */
const SPOTLIGHT_STATEMENT_LINE =
  /^Round\s+\d+\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*CORRECT\s*:\s*([AB])\s*$/i;

/** `ROUNDS:` lines. A pair line is one round. A statement line keeps its own prompt. */
function spotlightSheetRounds(raw: string, error: string) {
  const rounds: {
    prompt?: string;
    iconA: string;
    optionA: string;
    iconB: string;
    optionB: string;
    correct: "a" | "b";
    error: string;
  }[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    const statement = SPOTLIGHT_STATEMENT_LINE.exec(trimmed);
    if (statement) {
      const sideA = peelLeadingEmoji(statement[2] ?? "");
      const sideB = peelLeadingEmoji(statement[3] ?? "");
      const prompt = (statement[1] ?? "").replace(/\s+/g, " ").trim();
      rounds.push({
        ...(prompt ? { prompt } : {}),
        iconA: sideA.emoji ?? "",
        optionA: sideA.label,
        iconB: sideB.emoji ?? "",
        optionB: sideB.label,
        correct: (statement[4] ?? "A").toLowerCase() === "b" ? "b" : "a",
        error,
      });
      continue;
    }
    const match = SPOTLIGHT_PAIR_LINE.exec(trimmed);
    if (!match) continue;
    const sideA = peelLeadingEmoji(match[1] ?? "");
    const sideB = peelLeadingEmoji(match[2] ?? "");
    rounds.push({
      iconA: sideA.emoji ?? "",
      optionA: sideA.label,
      iconB: sideB.emoji ?? "",
      optionB: sideB.label,
      correct: (match[3] ?? "A").toLowerCase() === "b" ? "b" : "a",
      error,
    });
  }
  return rounds;
}

/**
 * Prose that sits above `A:` / `CHOICE A:` in a settings cell.
 * That line is the question those options belong to.
 */
function leadingSettingsQuestion(raw: string): string | undefined {
  const lines: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (
      /^(?:CHOICE\s+[A-Z]|BUTTON|[A-H]|CORRECT|OPTIONS|ITEMS|ROUNDS|ORDER|CONTINUE|IF|ELSE|TEXT|SOURCE|TARGET|YES|NO|NEED|WANT|SHORT|LONG|STEP\d+|ID|HUB|MEDAL|TOTAL|AVAILABLE)\b/i.test(
        trimmed,
      )
    ) {
      break;
    }
    lines.push(trimmed);
  }
  const question = lines.join(" ").replace(/\s+/g, " ").trim();
  return question || undefined;
}

/** TOTAL/KEEP win. KEEP is at-least. A bare "$9 ... ($6 remains)" line stays exact. */
function allocationAmounts(raw: string): {
  total: number;
  targetMin: number;
  match: "exact" | "at-least";
} {
  const totalMatch = /\bTOTAL:\s*\$?(\d+)/i.exec(raw);
  const keepMatch = /\bKEEP:\s*\$?(\d+)/i.exec(raw);
  const match = keepMatch ? "at-least" : "exact";
  if (totalMatch) {
    const total = Number(totalMatch[1]) || 1;
    const targetMin = keepMatch ? Number(keepMatch[1]) : total;
    return { total, targetMin, match };
  }
  const amounts = [...raw.matchAll(/\$(\d+)/g)].map((found) => Number(found[1]));
  const setAside = amounts[0] ?? 0;
  const remains = /remains/i.test(raw) ? (amounts[1] ?? 0) : 0;
  const total = setAside + remains || setAside || 1;
  return { total, targetMin: setAside || total, match };
}

/** Unkeyed "Slide …" sentence in a slider settings cell. */
function sliderInstruction(raw: string): string {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const prose = lines.filter((line) => !/^[A-Z][A-Z0-9 ]{0,24}:/.test(line));
  return prose.find((line) => /^slide\b/i.test(line)) ?? "";
}


function moodRows(entries: readonly SettingEntry[]): SettingEntry[] {
  return entries.filter(
    (entry) =>
      (entry.key === "RUSHING" || entry.key === "THINKING") && entry.value,
  );
}

function frozenLabelFromHold(holdLabel: string): string {
  const match = /HOLD TO\s+([A-Z]+)/i.exec(holdLabel);
  const word = match?.[1]?.toUpperCase();
  if (!word) return holdLabel;
  const past =
    word === "FREEZE"
      ? "FROZEN"
      : word.endsWith("E")
        ? `${word.slice(0, -1)}ED`
        : `${word}ED`;
  return holdLabel.replace(/HOLD TO\s+[A-Z]+/i, past);
}

type PayloadMedalTier = Exclude<MedalDisplayStatus, "locked">;

type PayloadScreenContext = {
  skillId?: string;
  skillName?: string;
  lessonNumber?: number;
  /** Lesson-Details cohort character. Completion art uses this name. */
  leadCharacter?: string;
};

function medalIdFromImage(fileName: string): MedalIllustrationId | undefined {
  const trimmed = fileName.trim();
  if (!trimmed || trimmed.toLowerCase() === "not allowed") return undefined;
  const base = trimmed.replace(/\.(webp|png|jpe?g)$/i, "");
  return isMedalIllustrationId(base) ? base : undefined;
}

function medalSettingToken(value: string | undefined): string | undefined {
  const token = value?.trim().toLowerCase().split(/\s+/)[0];
  return token || undefined;
}

function medalTierFromSettings(value: string | undefined): PayloadMedalTier | undefined {
  const tier = medalSettingToken(value);
  if (tier === "bronze" || tier === "silver" || tier === "gold") return tier;
  if (tier === "unlocked" || tier === "unlock" || tier === "white") return "unlocked";
  return undefined;
}

/** CSV Error cell. An empty cell stays empty — no stand-in sentence. */
function authoredError(error: string): { wrongError: string } | Record<string, never> {
  const trimmed = error.trim();
  return trimmed ? { wrongError: trimmed } : {};
}

function authoredHint(error: string): { releaseHint: string } | Record<string, never> {
  const trimmed = error.trim();
  return trimmed ? { releaseHint: trimmed } : {};
}

function medalTierFromId(medalId: MedalIllustrationId): PayloadMedalTier {
  if (medalId.endsWith("-bronze")) return "bronze";
  if (medalId.endsWith("-silver")) return "silver";
  if (medalId.endsWith("-gold")) return "gold";
  return "unlocked";
}

function firstMedalId(
  image: PayloadCohortCopy,
  cohort: MasteryCohort,
): MedalIllustrationId | undefined {
  const ordered = [
    image[cohort],
    image.pathfinder,
    image.explorer,
    image.maverick,
  ];
  for (const fileName of ordered) {
    const medalId = medalIdFromImage(fileName);
    if (medalId) return medalId;
  }
  return undefined;
}

function screenId(entries: readonly SettingEntry[], row: PayloadScreenRow): string {
  const authored = settingValue(entries, "ID");
  if (authored) {
    return authored
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  const slug = (row.screenLabel || String(row.screenNumber))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `screen-${slug || row.screenNumber}`;
}

function correctIsB(entries: readonly SettingEntry[]): boolean {
  return (settingValue(entries, "CORRECT") ?? "A").trim().toLowerCase().startsWith("b");
}

/** True/False and A/B lines used by later sheet lessons, alongside CHOICE A/B. */
function looseBinaryChoice(
  raw: string,
  story: string,
): {
  prompt: string;
  optionA: { label: string; isCorrect: boolean };
  optionB: { label: string; isCorrect: boolean };
} | undefined {
  const trueFalse = /true or false:\s*([\s\S]+?)\s+(TRUE|FALSE)\s*$/i.exec(raw.trim());
  if (trueFalse) {
    const question = (trueFalse[1] ?? "").trim();
    const isTrue = (trueFalse[2] ?? "").toUpperCase() === "TRUE";
    const prompt = story.trim() ? `${story.trim()}\n\n${question}` : question;
    return {
      prompt,
      optionA: { label: "True", isCorrect: isTrue },
      optionB: { label: "False", isCorrect: !isTrue },
    };
  }

  const labeled = [...raw.matchAll(/^([A-C])\s*:\s*(.+)$/gim)];
  if (labeled.length < 2) return undefined;
  const correct = (/^Correct:\s*([A-C])/im.exec(raw)?.[1] ?? "A").toUpperCase();
  const labelFor = (letter: string) =>
    choiceLabel(
      labeled.find((match) => (match[1] ?? "").toUpperCase() === letter)?.[2] ?? "",
    );
  return {
    prompt: story,
    optionA: { label: labelFor("A"), isCorrect: correct === "A" },
    optionB: { label: labelFor("B"), isCorrect: correct === "B" },
  };
}

function rankEmojiForLabel(label: string): string {
  const text = label.toLowerCase();
  if (text.includes("borrow")) return "🙅";
  if (text.includes("cheaper")) return "🛍️";
  if (text.includes("gelato") || text.includes("share")) return "🍦";
  if (
    text.includes("didn't buy") ||
    text.includes("didn’t buy") ||
    text.includes("don't buy") ||
    text.includes("don’t buy") ||
    text.includes("keep") ||
    text.includes("wait")
  ) {
    return "💰";
  }
  if (text.includes("want") || text.includes("need") || /\bask\b/.test(text)) return "🤔";
  if (text.includes("left")) return "💵";
  if (text.includes("spend")) return "🛍️";
  if (/\bbuy\b/.test(text)) return "💸";
  return "📌";
}

/** `PAIRS:` rows are `event = possibility`. Later lines have no key, so the settings splitter drops them. */
function linkMatchPairsFromSettings(raw: string): { event: string; benefit: string }[] {
  const pairs: { event: string; benefit: string }[] = [];
  let inPairs = false;

  for (const line of raw.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)) {
    if (/^PAIRS:\s*$/i.test(line)) {
      inPairs = true;
      continue;
    }
    const inline = /^PAIRS:\s*(.+)$/i.exec(line);
    if (inline?.[1]) {
      inPairs = true;
      const parsed = splitLinkMatchPair(inline[1]);
      if (parsed) pairs.push(parsed);
      continue;
    }
    if (/^[A-Z][A-Z0-9 _]*:\s*/.test(line) && !line.includes("=")) {
      inPairs = false;
      continue;
    }
    if (!inPairs && !line.includes("=")) continue;
    const parsed = splitLinkMatchPair(line);
    if (parsed) pairs.push(parsed);
  }

  return pairs;
}

function splitLinkMatchPair(line: string): { event: string; benefit: string } | undefined {
  const splitAt = line.indexOf("=");
  if (splitAt < 0) return undefined;
  const event = line.slice(0, splitAt).trim();
  const benefit = line.slice(splitAt + 1).trim();
  if (!event || !benefit) return undefined;
  return { event, benefit };
}

function rankOrderFromSettings(raw: string, error: string): {
  items: { id: string; label: string; emoji: string }[];
  correctOrder: string[];
  errors: Record<string, string>;
} {
  const labels: string[] = [];
  let orderHint = "";
  let inItems = false;
  for (const line of raw.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)) {
    if (/^ITEMS:\s*$/i.test(line)) {
      inItems = true;
      continue;
    }
    const namedItem = /^ITEMS:\s*(.+)$/i.exec(line);
    if (namedItem?.[1]) {
      labels.push(namedItem[1].trim());
      continue;
    }
    const order = /^ORDER:\s*(.*)$/i.exec(line);
    if (order) {
      inItems = false;
      orderHint = order[1] ?? "";
      continue;
    }
    if (isUnrecognisedSettingLine("rank-order", line)) continue;
    if (inItems) labels.push(line);
  }

  const items = labels.map((rawLabel, index) => {
    const split = splitEmojiLabel(rawLabel);
    return {
      id: itemSlug(split.label, index),
      label: split.label,
      emoji: split.emoji ?? rankEmojiForLabel(split.label),
    };
  });
  const tokens = orderHint.split(",").map((token) => token.trim()).filter(Boolean);
  const correctOrder = resolveRankOrderIds(items, tokens);
  const message = error.trim();
  const errors = message
    ? Object.fromEntries(items.map((item) => [item.id, message]))
    : {};
  return { items, correctOrder, errors };
}

function splitTrailingPrice(label: string): { label: string; price?: number } {
  const paren = /^(.*?)(?:\s*[-–—]\s*)?\(\$(\d+)\)\s*$/.exec(label.trim());
  if (paren?.[1] && paren[2]) {
    return { label: paren[1].trim(), price: Number(paren[2]) };
  }
  const plain = /^(.*?)(?:\s*[-–—]\s*)\$(\d+)\s*$/.exec(label.trim());
  if (plain?.[1] && plain[2]) {
    return { label: plain[1].trim(), price: Number(plain[2]) };
  }
  return { label: label.trim() };
}

function budgetMatchScore(label: string, token: string): number {
  const needle = token.trim().toLowerCase().replace(/\s+/g, " ");
  if (!needle) return 0;
  const labelNorm = label.trim().toLowerCase().replace(/\s+/g, " ");
  if (labelNorm === needle) return 4;
  const slug = (value: string) =>
    value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (slug(label) === slug(token)) return 3;
  const words = labelNorm.split(/[^a-z0-9]+/).filter(Boolean);
  if (words[0] === needle) return 2;
  if (!needle.includes(" ") && words.includes(needle)) return 1;
  return 0;
}

function matchBudgetItem<T extends { label: string }>(
  items: readonly T[],
  token: string,
): T | undefined {
  let best: T | undefined;
  let bestScore = 0;
  for (const item of items) {
    const score = budgetMatchScore(item.label, token);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}

/**
 * `TOTAL:`, tagged `NEED:` / `WANT:` item lines, and `CORRECT:` names.
 * A correct name matches the label, its slug, or a word in the label
 * (`bus`, `dog lead`, `cable`).
 */
function budgetSelectFromSettings(raw: string, error: string): {
  total: number;
  items: { id: string; label: string; price: number; emoji?: string }[];
  correctIds: string[];
  errors: { overBudget: string; wrongSelection: string };
} {
  const total = Number.parseInt(/\bTOTAL:\s*\$?(\d+)/i.exec(raw)?.[1] ?? "", 10);
  const items: { id: string; label: string; price: number; emoji?: string }[] = [];
  let correctRaw = "";
  for (const line of raw.split(/\r?\n/).map((entry) => entry.trim()).filter(Boolean)) {
    const correct = /^CORRECT:\s*(.*)$/i.exec(line);
    if (correct) {
      correctRaw = correct[1] ?? "";
      continue;
    }
    const tagged = /^(?:NEED|WANT)\s*:\s*(.+)$/i.exec(line);
    const inline = /^ITEMS:\s*(.+)$/i.exec(line);
    const body = tagged?.[1] ?? inline?.[1];
    if (!body) continue;
    const split = splitEmojiLabel(body);
    const priced = splitTrailingPrice(split.label);
    if (priced.price === undefined || !priced.label) continue;
    items.push({
      id: itemSlug(priced.label, items.length),
      label: priced.label,
      price: priced.price,
      ...(split.emoji ? { emoji: split.emoji } : {}),
    });
  }
  const correctIds = correctRaw
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)
    .flatMap((token) => {
      const match = matchBudgetItem(items, token);
      return match ? [match.id] : [];
    });
  const message = error.trim();
  return {
    total: Number.isFinite(total) ? total : 0,
    items,
    correctIds,
    errors: { overBudget: message, wrongSelection: message },
  };
}

/**
 * Turn one payload row into the existing screen config for that game template.
 * Completion medals stay on the lesson-number resolver — the sheet's medal
 * file is not applied here.
 */
export function mapPayloadScreen(
  row: PayloadScreenRow,
  cohort: MasteryCohort,
  context: PayloadScreenContext = {},
): ScreenConfig {
  if (
    cohort !== "pathfinder" &&
    !row.settings.pathfinder.trim() &&
    row.settings[cohort].trim()
  ) {
    throw new Error(
      `Screen ${row.screenLabel} fills ${cohort} settings while Pathfinder settings are blank.`,
    );
  }
  const text = cohortField(row.text, cohort);
  const error = cohortField(row.error, cohort);
  const settings = mergedSettings(row.settings, cohort);
  const image = pairImage(cohortField(row.image, cohort));
  const id = screenId(settings, row);
  const picture = image === undefined ? {} : { pairImage: image };

  switch (row.gameType) {
    case "word-drop": {
      const blank = "______";
      const blankAt = text.indexOf(blank);
      const narrativeBefore = blankAt >= 0 ? text.slice(0, blankAt).trim() : text.trim();
      const narrativeAfter = blankAt >= 0 ? text.slice(blankAt + blank.length).trim() : "";
      const optionsField = settingValue(settings, "OPTIONS") ?? "";
      const inlineCorrect = /\s+CORRECT:\s*(.+)$/i.exec(optionsField);
      const options = pipeList(
        inlineCorrect ? optionsField.slice(0, inlineCorrect.index) : optionsField,
      );
      const correctOption =
        settingValue(settings, "CORRECT") ??
        inlineCorrect?.[1]?.trim() ??
        options[0] ??
        "";
      const blankCount = text.split(blank).length - 1;
      const correctParts = correctOption
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      if (blankCount > 1 && correctParts.length !== blankCount) {
        throw new Error(
          `Screen ${row.screenLabel} (word-drop) has ${blankCount} blanks and ${correctParts.length} CORRECT parts.`,
        );
      }
      const answers = blankCount > 1 ? correctParts : [correctOption.trim()];
      for (const part of answers) {
        if (part && !options.includes(part)) {
          throw new Error(
            `Screen ${row.screenLabel} (word-drop) CORRECT "${part}" is not in OPTIONS.`,
          );
        }
      }
      if (blankCount > 1 && correctParts.length === blankCount) {
        return {
          type: "word-drop",
          id,
          narrativeBefore,
          narrativeAfter,
          prompt: text.replaceAll(blank, "[blank]"),
          options,
          correctOption: correctParts[0] ?? "",
          blanks: correctParts.map((part) => ({
            options,
            correctOption: part,
          })),
          wrongError: error,
          ...picture,
        };
      }
      return {
        type: "word-drop",
        id,
        narrativeBefore,
        narrativeAfter,
        options,
        correctOption,
        wrongError: error,
        ...picture,
      };
    }
    case "true-false": {
      const correctRaw = (settingValue(settings, "CORRECT") ?? "").trim();
      if (!/^(true|false)$/i.test(correctRaw)) {
        throw new Error(
          `Screen ${row.screenLabel} (true-false) needs CORRECT: True or CORRECT: False.`,
        );
      }
      const correct = correctRaw.toLowerCase();
      return {
        type: "true-false",
        id,
        prompt: text,
        correctAnswer: correct.startsWith("f") ? "false" : "true",
        wrongError: error,
        ...picture,
      };
    }
    case "drag-to-target": {
      const source = (settingValue(settings, "SOURCE") ?? "").replace(/\s*\/\s*$/, "").trim();
      const target = (settingValue(settings, "TARGET") ?? "").replace(/\s*\/\s*$/, "").trim();
      const targetSplit = splitEmojiLabel(target);
      const targetName = targetSplit.label;
      const sourceArt = isIllustrationId(source) ? source : undefined;
      const targetArt = isIllustrationId(targetName) ? targetName : undefined;
      const targetPose = !targetArt && characterPoseFilePath(targetName) ? targetName : undefined;
      const emoji = sourceArt ? undefined : firstEmoji(source);
      const sourceLabel = sourceArt
        ? labelFromIllustrationId(source)
        : (emoji ? source.replace(emoji, "") : source).trim() || "Start";
      const sourceImageFile = settingValue(settings, "ITEM");
      const authoredTargetImage = settingValue(settings, "IMAGE");
      const targetImageFile = authoredTargetImage ?? targetPose;
      return {
        type: "drag-to-target",
        id,
        intro: text,
        sourceLabel,
        targetLabel: targetArt || targetPose
          ? labelFromIllustrationId(targetName)
          : targetName || "Target",
        ...(emoji ? { itemEmoji: emoji } : {}),
        ...(targetSplit.emoji ? { targetEmoji: targetSplit.emoji } : {}),
        ...(sourceArt ? { sourceIllustrationId: sourceArt, itemSize: "lg" as const } : {}),
        ...(targetArt ? { targetIllustrationId: targetArt } : {}),
        ...(sourceImageFile ? { sourceImageFile, itemSize: "lg" as const } : {}),
        ...(targetImageFile ? { targetImageFile } : {}),
        coinCount: 1,
        sourceEmptyMessage: settingValue(settings, "SUCCESS") ?? "",
        successMessage: "",
        ...authoredError(error),
        ...picture,
      };
    }
    case "savings-goal": {
      const raw = mergedSettingsRaw(row.settings, cohort);
      const available = Number.parseInt(/AVAILABLE:\s*\$(\d+)/i.exec(raw)?.[1] ?? "", 10);
      const target = Number.parseInt(/TARGET:\s*\$?(\d+)/i.exec(raw)?.[1] ?? "", 10);
      const itemChunks: string[] = [];
      let collectingItems = false;
      for (const line of raw.split(/\r?\n/)) {
        const trimmed = line.trim();
        if (/^ITEMS:\s*/i.test(trimmed)) {
          collectingItems = true;
          itemChunks.push(trimmed.replace(/^ITEMS:\s*/i, ""));
          continue;
        }
        if (collectingItems && /^(TARGET|AVAILABLE|LABEL|DROP|RESULT)\s*:/i.test(trimmed)) {
          collectingItems = false;
        }
        if (collectingItems) itemChunks.push(trimmed);
      }
      const items = parseSavingsGoalItems(itemChunks.join(" "));
      if (items.length === 0) {
        throw new Error(`Screen ${row.screenLabel} (savings-goal) has no items.`);
      }
      const prices = items.reduce((sum, item) => sum + item.price, 0);
      const named = items.map((item) => `the ${item.label.toLowerCase()}`);
      const dragThese =
        named.length === 0
          ? "the items"
          : named.length === 1
            ? named[0]
            : named.length === 2
              ? `${named[0]} and ${named[1]}`
              : `${named.slice(0, -1).join(", ")}, and ${named[named.length - 1]}`;
      const countsDown = Number.isFinite(available) && available > 0;
      return {
        type: "savings-goal",
        id,
        intro: text.replace(/\bthe items\b/i, dragThese ?? "the items"),
        meterLabel: settingValue(settings, "LABEL") || (countsDown ? "Remaining" : "Savings"),
        showsRemaining: countsDown,
        targetAmount: countsDown
          ? available
          : Number.isFinite(target) && target > 0
            ? target
            : prices || 1,
        poolColumnLabel: "Items",
        dropZoneLabel: settingValue(settings, "DROP") || "Chosen",
        items,
        workshopSignTitle: text,
        lockedLabel: "Locked",
        unlockedLabel: "Done",
        goalAchievedLabel: "Goal reached",
        ...authoredError(error),
        ...picture,
      };
    }
    case "binary-choice":
    case "multiple-choice": {
      const decisionScript = parseDecisionScript(mergedSettingsRaw(row.settings, cohort));
      const decisionChoices = decisionScript?.choices;
      const choices = decisionChoices
        ? decisionChoices.map((choice, index) => ({
            letter: String.fromCharCode(65 + index),
            ...choice,
          }))
        : authoredChoices(settings);
      const continueToLabel =
        choices.length === 0 ? continueGoLabel(mergedSettingsRaw(row.settings, cohort)) : undefined;
      if (continueToLabel) {
        return {
          type: row.gameType,
          id,
          prompt: text,
          options: [],
          continueToLabel,
          wrongError: error,
          errorStyle: "inline-red",
          ...picture,
        };
      }
      const rawSettings = mergedSettingsRaw(row.settings, cohort);
      const question = leadingSettingsQuestion(rawSettings);
      const skillHub = /^\s*HUB\s*$/im.test(rawSettings);
      const skillKeys = choices
        .filter((choice) => choice.goToLabel && !choice.requiresCompletedHub)
        .map((choice) => choice.goToLabel ?? "")
        .filter(Boolean);
      const correct = correctChoiceLetters(settings);
      const explicitCorrect = settings.some((entry) => entry.key === "CORRECT" && entry.value);
      const decisionPath =
        !explicitCorrect &&
        choices.some(
          (choice) =>
            choice.cashUpdate !== undefined ||
            choice.goToLabel !== undefined ||
            choice.showWhen !== undefined ||
            choice.requiresCompletedHub === true,
        );
      const loose = looseBinaryChoice(rawSettings, text);
      const mappedOptions = choices.map((choice) => {
        const shown = withChoiceEmoji(choice);
        return {
          label: shown.label,
          isCorrect: correct.has(choice.letter),
          ...(shown.emoji ? { emoji: shown.emoji } : {}),
          ...(choice.cashUpdate ? { cashUpdate: choice.cashUpdate } : {}),
          ...(choice.goToLabel ? { goToLabel: choice.goToLabel } : {}),
          ...(choice.showWhen ? { showWhen: choice.showWhen } : {}),
          ...(skillHub && choice.goToLabel && !choice.requiresCompletedHub
            ? { hubSkillKey: choice.goToLabel }
            : {}),
          ...(choice.requiresCompletedHub ? { requiresHubSkills: skillKeys } : {}),
        };
      });
      const options =
        mappedOptions.length > 0
          ? mappedOptions
          : [loose?.optionA, loose?.optionB].filter(
              (option): option is { label: string; isCorrect: boolean } =>
                Boolean(option?.label),
            );
      const prompt = mappedOptions.length > 0 ? (question ?? text) : (loose?.prompt ?? text);
      if (skillHub) {
        const skillOptions = mappedOptions.filter(
          (option) => option.hubSkillKey && !option.requiresHubSkills,
        );
        const finish = mappedOptions.find((option) => option.requiresHubSkills);
        if (skillOptions.length === 0) {
          throw new Error(`Screen ${row.screenLabel} (skill-hub) has no skills.`);
        }
        return {
          type: "skill-hub",
          id,
          prompt: text,
          skills: skillOptions.map((option) => ({
            label: option.label,
            ...(option.emoji ? { emoji: option.emoji } : {}),
            ...(option.goToLabel ? { goToLabel: option.goToLabel } : {}),
            hubSkillKey: option.hubSkillKey ?? "",
          })),
          finishLabel: finish?.label || "Finish",
          ...(finish?.goToLabel ? { finishToLabel: finish.goToLabel } : {}),
          options: mappedOptions,
          skillHub: true,
          ...picture,
        };
      }
      if (options.length === 0) {
        throw new Error(`Screen ${row.screenLabel} (${row.gameType}) has no choices.`);
      }
      if (explicitCorrect) {
        const present = new Set(choices.map((choice) => choice.letter));
        for (const letter of correctChoiceLetters(settings)) {
          if (!present.has(letter)) {
            throw new Error(
              `Screen ${row.screenLabel} (${row.gameType}) CORRECT ${letter} does not match a choice.`,
            );
          }
        }
      }
      return {
        type: row.gameType,
        id,
        prompt,
        options,
        optionA: options[0] ?? { label: "", isCorrect: true },
        optionB: options[1] ?? { label: "", isCorrect: false },
        wrongError: error,
        errorStyle: "inline-red",
        ...(options.length >= 5 && correctChoiceLetters(settings).size > 1
          ? { optionLayout: "radio-list" as const }
          : {}),
        ...(decisionPath ? { decisionPath: true } : {}),
        ...(skillHub ? { skillHub: true } : {}),
        ...(decisionScript && decisionScript.prompts.length > 0
          ? { promptWhen: decisionScript.prompts }
          : {}),
        ...picture,
      };
    }
    case "tap-reveal":
    case "bucket-sort": {
      const settingsRaw = mergedSettingsRaw(row.settings, cohort);
      const deliver = (screen: ScreenConfig): ScreenConfig => {
        if (row.gameType === "bucket-sort" && screen.type === "bucket-sort") {
          assertSortAuthoring(
            sortAuthoringIssues({
              lessonNumber: context.lessonNumber,
              screenLabel: row.screenLabel,
              cohort,
              gameType: "bucket-sort",
              raw: settingsRaw,
              itemCount: screen.items.length,
            }),
          );
        }
        return screen;
      };
      const steps = stepRows(settings);
      const moods = moodRows(settings);
      if (row.gameType === "bucket-sort" && steps.length > 0) {
        const buckets = steps.map((_, index) => ({
          id: `step${index + 1}`,
          label: `Step ${index + 1}`,
        }));
        const items = steps.map((entry, index) => {
          const parsed = splitEmojiLabel(entry.value);
          return {
            id: itemSlug(parsed.label, index),
            ...(parsed.emoji ? { emoji: parsed.emoji } : {}),
            label: parsed.label,
            bucket: `step${index + 1}`,
          };
        });
        return deliver({
          type: "bucket-sort",
          id,
          intro: text,
          layout: "steps-row",
          buckets,
          items,
          ...authoredError(error),
          ...picture,
        });
      }
      const spentRows = itemRows(settings).filter((item) => item.bucket === "SPENT");
      if (row.gameType === "bucket-sort" && spentRows.length > 0) {
        const spent = spentRows;
        const totalRaw = settingValue(settings, "TOTAL") ?? "";
        const targetTotal = Number.parseInt(totalRaw.replace(/[^\d]/g, ""), 10);
        const items = spent.map((item, index) => {
          const parsed = splitEmojiLabel(item.text);
          const priced = splitTrailingPrice(parsed.label);
          return {
            id: itemSlug(priced.label, index),
            ...(parsed.emoji ? { emoji: parsed.emoji } : {}),
            label: priced.label,
            bucket: "spent",
            ...(priced.price !== undefined ? { price: priced.price } : {}),
          };
        });
        return deliver({
          type: "bucket-sort",
          id,
          intro: text,
          layout: "spent-total",
          buckets: [{ id: "spent", label: "Spent" }],
          items,
          ...(Number.isFinite(targetTotal) ? { targetTotal } : {}),
          ...authoredError(error),
          ...picture,
        });
      }
      if (row.gameType === "bucket-sort" && moods.length > 0) {
        const items = moods.map((entry, index) => {
          const parsed = splitEmojiLabel(entry.value);
          return {
            id: itemSlug(parsed.label, index),
            ...(parsed.emoji ? { emoji: parsed.emoji } : {}),
            label: parsed.label,
            bucket: entry.key === "RUSHING" ? "rushing" : "thinking",
          };
        });
        return deliver({
          type: "bucket-sort",
          id,
          intro: text,
          layout: "statement-sort",
          buckets: [
            { id: "rushing", label: "I'm Rushing", tone: "rush", icon: "⚡" },
            { id: "thinking", label: "I'm Thinking", tone: "think", icon: "🧠" },
          ],
          items,
          ...authoredError(error),
          ...picture,
        });
      }
      const rows = itemRows(settings);
      const bucketKeys = [...new Set(rows.map((item) => item.bucket))];
      const buckets = bucketKeys.map((key) => {
        const meta = bucketMeta(key, text);
        return row.gameType === "tap-reveal"
          ? { id: meta.id, label: meta.label, tone: meta.tone }
          : { id: meta.id, label: meta.label, tone: meta.tone, icon: meta.icon };
      });
      const items = rows.map((item, index) => {
        const parsed = splitEmojiLabel(item.text);
        const bucket = BUCKET_LABEL[item.bucket]?.id ?? item.bucket.toLowerCase();
        return {
          id: itemSlug(parsed.label, index),
          emoji: parsed.emoji,
          label: parsed.label,
          bucket,
        };
      });
      if (row.gameType === "tap-reveal") {
        return deliver({
          type: "tap-reveal",
          id,
          intro: text,
          buckets,
          items,
          ...picture,
        });
      }
      return deliver({
        type: "bucket-sort",
        id,
        intro: text,
        buckets,
        items,
        ...authoredError(error),
        ...picture,
      });
    }
    case "spotlight-rounds": {
      const decisionScript = parseDecisionScript(mergedSettingsRaw(row.settings, cohort));
      const decisionChoices = decisionScript?.choices;
      const choices = decisionChoices
        ? decisionChoices.map((choice, index) => ({
            letter: String.fromCharCode(65 + index),
            ...choice,
          }))
        : authoredChoices(settings);
      const explicitCorrect = settings.some((entry) => entry.key === "CORRECT" && entry.value);
      const decisionPath =
        !explicitCorrect &&
        choices.some(
          (choice) =>
            choice.cashUpdate !== undefined ||
            choice.goToLabel !== undefined ||
            choice.showWhen !== undefined,
        );
      if (decisionPath) {
        const correct = correctChoiceLetters(settings);
        return {
          type: "spotlight-rounds",
          id,
          prompt: text,
          rounds: [],
          decisionPath: true,
          wrongError: error,
          options: choices.map((choice) => {
            const shown = withChoiceEmoji(choice);
            return {
              label: shown.label,
              isCorrect: correct.has(choice.letter),
              ...(shown.emoji ? { emoji: shown.emoji } : {}),
              ...(choice.cashUpdate ? { cashUpdate: choice.cashUpdate } : {}),
              ...(choice.goToLabel ? { goToLabel: choice.goToLabel } : {}),
              ...(choice.showWhen ? { showWhen: choice.showWhen } : {}),
            };
          }),
          ...(decisionScript && decisionScript.prompts.length > 0
            ? { promptWhen: decisionScript.prompts }
            : {}),
          ...picture,
        };
      }
      const sheetRounds = spotlightSheetRounds(mergedSettingsRaw(row.settings, cohort), error);
      if (sheetRounds.length > 0) {
        const blank = sheetRounds.find((round) => !round.optionA.trim() || !round.optionB.trim());
        if (blank) {
          throw new Error(
            `Screen ${row.screenLabel} (${row.gameType}) has a round with no options.`,
          );
        }
        return {
          type: "spotlight-rounds",
          id,
          prompt: text,
          rounds: sheetRounds,
          ...picture,
        };
      }
      const sideA = withChoiceEmoji({
        label: choiceLabel(
          settingValue(settings, "CHOICE A") ?? settingValue(settings, "A") ?? "",
        ),
      });
      const sideB = withChoiceEmoji({
        label: choiceLabel(
          settingValue(settings, "CHOICE B") ?? settingValue(settings, "B") ?? "",
        ),
      });
      if (!sideA.label || !sideB.label) {
        throw new Error(
          `Screen ${row.screenLabel} (${row.gameType}) has no choices of its own.`,
        );
      }
      return {
        type: "spotlight-rounds",
        id,
        prompt: text,
        rounds: [
          {
            iconA: settingValue(settings, "ICON A") ?? sideA.emoji ?? "",
            optionA: sideA.label,
            iconB: settingValue(settings, "ICON B") ?? sideB.emoji ?? "",
            optionB: sideB.label,
            correct: correctIsB(settings) ? "b" : "a",
            error,
          },
        ],
        ...picture,
      };
    }
    case "rank-order": {
      const settingsRaw = mergedSettingsRaw(row.settings, cohort);
      const ranked = rankOrderFromSettings(settingsRaw, error);
      const orderTokens = (settingsRaw.match(/^ORDER:\s*(.*)$/im)?.[1] ?? "")
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean);
      const unmatchedOrder = unmatchedRankOrderTokens(ranked.items, orderTokens);
      if (unmatchedOrder.length > 0) {
        throw new Error(
          `Screen ${row.screenLabel} (rank-order) ORDER does not match its items (${unmatchedOrder.join(", ")}).`,
        );
      }
      assertSortAuthoring(
        sortAuthoringIssues({
          lessonNumber: context.lessonNumber,
          screenLabel: row.screenLabel,
          cohort,
          gameType: "rank-order",
          raw: settingsRaw,
          itemCount: ranked.items.length,
        }),
      );
      return {
        type: "rank-order",
        id,
        intro: text,
        items: ranked.items,
        correctOrder: ranked.correctOrder,
        errors: ranked.errors,
        ...picture,
      };
    }
    case "link-match": {
      const pairs = linkMatchPairsFromSettings(mergedSettingsRaw(row.settings, cohort)).map(
        (pair, index) => ({
          id: itemSlug(pair.event, index),
          event: pair.event,
          benefit: pair.benefit,
        }),
      );
      if (pairs.length === 0) {
        throw new Error(`Screen ${row.screenLabel} (link-match) has no pairs.`);
      }
      return {
        type: "link-match",
        id,
        intro: text,
        eventColumnLabel: "Events",
        benefitColumnLabel: "Possibilities",
        pairs,
        ...(error.trim() ? { wrongError: error.trim() } : {}),
        ...picture,
      };
    }
    case "allocation-slider": {
      const settingsRaw = mergedSettingsRaw(row.settings, cohort);
      const instruction = sliderInstruction(settingsRaw);
      const raw = [instruction || settingsRaw, text].filter(Boolean).join("\n");
      const { total, targetMin, match } = allocationAmounts(`${settingsRaw}\n${raw}`);
      const story = text.trim();
      return {
        type: "allocation-slider",
        id,
        intro: story || instruction || raw,
        ...(instruction && instruction !== story ? { instruction } : {}),
        total,
        targetMin,
        match,
        reserveGoals: [
          {
            id: "reserve",
            label: settingValue(settings, "ITEM")?.trim() || "Set aside",
            amount: targetMin,
          },
        ],
        sliderError: error.trim(),
        ...picture,
      };
    }
    case "budget-select": {
      const budgetRaw = mergedSettingsRaw(row.settings, cohort);
      const budget = budgetSelectFromSettings(budgetRaw, error);
      if (!/\bTOTAL:\s*\$?\d+/i.test(budgetRaw)) {
        throw new Error(`Screen ${row.screenLabel} (budget-select) is missing TOTAL.`);
      }
      const correctTokens = (/^CORRECT:\s*(.*)$/im.exec(budgetRaw)?.[1] ?? "")
        .split(",")
        .map((token) => token.trim())
        .filter(Boolean);
      if (correctTokens.length === 0 || budget.correctIds.length !== correctTokens.length) {
        throw new Error(
          `Screen ${row.screenLabel} (budget-select) CORRECT does not match its items.`,
        );
      }
      if (budget.items.length === 0) {
        throw new Error(
          `Screen ${row.screenLabel} (budget-select) has no items.`,
        );
      }
      return {
        type: "budget-select",
        id,
        intro: text,
        total: budget.total,
        items: budget.items,
        correctIds: budget.correctIds,
        errors: budget.errors,
        ...picture,
      };
    }
    case "hold-to-fill": {
      const holdLabel = settingValue(settings, "HOLD") ?? "Hold";
      return {
        type: "hold-to-fill",
        id,
        narrative: text,
        holdLabel,
        frozenLabel: settingValue(settings, "FROZEN") ?? frozenLabelFromHold(holdLabel),
        successMessage: settingValue(settings, "SUCCESS") ?? "",
        holdDurationMs: 2000,
        ...authoredHint(error),
        ...picture,
      };
    }
    case "scenario-beat": {
      const credit = settingValue(settings, "CREDIT")?.trim();
      const audioSrc = settingValue(settings, "AUDIO")?.trim();
      const audioMsRaw = Number(settingValue(settings, "AUDIO_MS") ?? "");
      const brief = settingValue(settings, "IMAGE_BRIEF")?.trim();
      const follow = settingValue(settings, "FOLLOW")?.trim();
      const audio = audioSrc
        ? { src: audioSrc, durationMs: Number.isFinite(audioMsRaw) ? audioMsRaw : 0 }
        : undefined;
      return {
        type: "narrative-bonus",
        id,
        narrative: text.trim(),
        bonusXp: 0,
        bonusTapLabel: "",
        autoReadyWhenNoBonus: true,
        advance: { mode: "auto-ready" },
        ...(credit ? { credit } : {}),
        ...(audio ? { audio } : {}),
        ...(follow ? { successMessage: follow } : {}),
        ...(brief ? { illustration: { label: brief, alt: brief } } : {}),
        ...picture,
      };
    }
    case "completion": {
      const medalSetting = settingValue(settings, "MEDAL");
      const leadCharacter = context.leadCharacter?.trim();
      if (medalSettingToken(medalSetting) === "none") {
        return {
          type: "completion",
          id,
          useStandardPane: true,
          suppressMedal: true,
          ...(leadCharacter ? { leadCharacter } : {}),
        };
      }
      const settingsTier = medalTierFromSettings(medalSetting);
      const skillNumber = context.skillId
        ? getSkillRegistryRecord(context.skillId)?.skillNumber
        : undefined;
      const medalId =
        firstMedalId(row.image, cohort) ??
        (settingsTier && skillNumber
          ? medalIdForSkillNumber(skillNumber, settingsTier)
          : undefined);
      const medalTier = settingsTier ?? (medalId ? medalTierFromId(medalId) : undefined);
      const skillName = context.skillName?.trim();
      return {
        type: "completion",
        id,
        useStandardPane: true,
        ...(medalId ? { medalId, authoredMedal: true as const } : {}),
        ...(medalTier ? { medalTier } : {}),
        ...(skillName ? { skillName } : {}),
        ...(leadCharacter ? { leadCharacter } : {}),
      };
    }
    default:
      throw new Error(
        `No lesson template for game type "${row.gameType}" on screen ${row.screenNumber}.`,
      );
  }
}

function moduleTitle(moduleNumber: number): string {
  if (moduleNumber >= 1 && moduleNumber <= 6) {
    return ACADEMY_MODULE_TITLES[moduleNumber as AcademyLevelId];
  }
  return `Module ${moduleNumber}`;
}

/** Medal tier written on this lesson's completion row, if the sheet has one. */
export function payloadCompletionMedalTier(
  content: Pick<ResolvedLessonContent, "screens">,
): PayloadMedalTier | undefined {
  for (const screen of content.screens) {
    if (screen.type === "completion" && screen.medalTier) return screen.medalTier;
  }
  return undefined;
}

function requireScreenIndex(
  indexByLabel: ReadonlyMap<string, number>,
  label: string,
  fromLabel: string,
  lesson: { moduleNumber: number; lessonNumber: number; cohort: string },
): number {
  const index = indexByLabel.get(screenLabelKey(label));
  if (index === undefined) {
    throw new Error(
      `Module ${lesson.moduleNumber} lesson ${lesson.lessonNumber} (${lesson.cohort}) screen "${fromLabel}" points at missing screen "${label}".`,
    );
  }
  return index;
}

/** Point each GO / CONTINUE action at a real screen. A missing label is an error. */
function linkContinueTargets(
  screens: ScreenConfig[],
  labels: readonly string[],
  lesson: { moduleNumber: number; lessonNumber: number; cohort: string },
): ScreenConfig[] {
  const indexByLabel = new Map<string, number>();
  labels.forEach((label, index) => {
    const key = screenLabelKey(label);
    if (key && !indexByLabel.has(key)) indexByLabel.set(key, index);
  });
  return screens.map((screen, screenIndex) => {
    const fromLabel = labels[screenIndex] ?? String(screenIndex + 1);
    let next = screen;
    if (next.continueToLabel) {
      next = {
        ...next,
        continueToIndex: requireScreenIndex(
          indexByLabel,
          next.continueToLabel,
          fromLabel,
          lesson,
        ),
      };
    }
    if (!("options" in next) || !Array.isArray(next.options)) return next;
    const choices = next.options.filter(
      (option): option is Exclude<(typeof next.options)[number], string> =>
        typeof option === "object" && option !== null && "goToLabel" in option && Boolean(option.goToLabel),
    );
    if (choices.length === 0) return next;
    const linkedOptions = next.options.map((option) => {
      if (typeof option !== "object" || option === null || !("goToLabel" in option) || !option.goToLabel) {
        return option;
      }
      return {
        ...option,
        goToIndex: requireScreenIndex(indexByLabel, option.goToLabel, fromLabel, lesson),
      };
    });
    if (next.type === "skill-hub") {
      const indexForKey = (key: string | undefined) =>
        linkedOptions.find(
          (option) =>
            typeof option === "object" &&
            option !== null &&
            "hubSkillKey" in option &&
            option.hubSkillKey === key &&
            "goToIndex" in option &&
            typeof option.goToIndex === "number",
        );
      const finish = linkedOptions.find(
        (option) =>
          typeof option === "object" &&
          option !== null &&
          "requiresHubSkills" in option &&
          option.requiresHubSkills &&
          "goToIndex" in option &&
          typeof option.goToIndex === "number",
      );
      return {
        ...next,
        options: linkedOptions,
        skills: next.skills.map((skill) => {
          const match = indexForKey(skill.hubSkillKey);
          const goToIndex =
            match && "goToIndex" in match && typeof match.goToIndex === "number"
              ? match.goToIndex
              : skill.goToLabel
                ? requireScreenIndex(indexByLabel, skill.goToLabel, fromLabel, lesson)
                : undefined;
          return {
            ...skill,
            ...(typeof goToIndex === "number" ? { goToIndex } : {}),
          };
        }),
        ...(finish && "goToIndex" in finish && typeof finish.goToIndex === "number"
          ? { finishToIndex: finish.goToIndex }
          : {}),
      } as ScreenConfig;
    }
    return { ...next, options: linkedOptions } as ScreenConfig;
  });
}

function continueTargetIndex(screen: ScreenConfig): number | undefined {
  if (typeof screen.continueToIndex === "number") return screen.continueToIndex;
  if (!("options" in screen) || !Array.isArray(screen.options)) return undefined;
  const options = screen.options.filter(
    (option): option is { label?: string; goToIndex?: number } =>
      typeof option === "object" && option !== null,
  );
  if (options.length !== 1) return undefined;
  const only = options[0];
  if (!only || !/^continue$/i.test((only.label ?? "").trim())) return undefined;
  return typeof only.goToIndex === "number" ? only.goToIndex : undefined;
}

function isContinueOnlyScreen(screen: ScreenConfig): boolean {
  const options =
    "options" in screen && Array.isArray(screen.options)
      ? screen.options.filter((option) => typeof option === "object" && option !== null)
      : [];
  if (options.length === 1 && "label" in options[0] && /^continue$/i.test(String(options[0].label).trim())) {
    return true;
  }
  return Boolean(screen.continueToLabel) && options.length === 0;
}

/** Continue cards that land on the completion screen become a resolution beat. */
function presentClosingResolutions(screens: ScreenConfig[]): ScreenConfig[] {
  return screens.map((screen) => {
    if (!isContinueOnlyScreen(screen)) return screen;
    const targetIndex = continueTargetIndex(screen);
    if (targetIndex === undefined || screens[targetIndex]?.type !== "completion") return screen;
    const narrative = "prompt" in screen && typeof screen.prompt === "string" ? screen.prompt.trim() : "";
    if (!narrative) return screen;
    return {
      type: "narrative-bonus",
      id: screen.id,
      narrative,
      bonusXp: 0,
      bonusTapLabel: "",
      autoReadyWhenNoBonus: true,
      resolution: true,
      continueToLabel: screen.continueToLabel,
      continueToIndex: targetIndex,
      sourceLabel: screen.sourceLabel,
      pairImage: screen.pairImage,
      illustration: screen.illustration,
      illustrationId: screen.illustrationId,
      hubSkillKey: screen.hubSkillKey,
      advance: { mode: "auto-ready" },
    };
  });
}

/** Tag each screen inside a hub skill so returning to the hub can mark it done. */
function tagHubSkillKeys(screens: ScreenConfig[]): ScreenConfig[] {
  const hubIndex = screens.findIndex((screen) => screen.skillHub);
  if (hubIndex < 0) return screens;
  const hub = screens[hubIndex];
  if (!hub || !("options" in hub) || !hub.options) return screens;
  const tagged = screens.slice();
  const seen = new Set<number>();

  for (const option of hub.options) {
    if (typeof option !== "object" || option === null) continue;
    if (!("hubSkillKey" in option) || !option.hubSkillKey || !("goToIndex" in option) || typeof option.goToIndex !== "number") {
      continue;
    }
    const skillKey = option.hubSkillKey;
    const queue = [option.goToIndex];
    while (queue.length > 0) {
      const index = queue.shift();
      if (index === undefined || seen.has(index) || index === hubIndex) continue;
      seen.add(index);
      const screen = tagged[index];
      if (!screen) continue;
      tagged[index] = { ...screen, hubSkillKey: skillKey };
      const exits =
        "options" in screen && Array.isArray(screen.options)
          ? screen.options
              .map((choice) =>
                typeof choice === "object" && choice !== null && "goToIndex" in choice
                  ? choice.goToIndex
                  : undefined,
              )
              .filter((target): target is number => typeof target === "number")
          : [];
      const fallback =
        exits.length > 0
          ? exits
          : typeof screen.continueToIndex === "number"
            ? [screen.continueToIndex]
            : [];
      for (const target of fallback) {
        if (target !== hubIndex) queue.push(target);
      }
    }
  }

  const hubSkills = "skills" in hub && Array.isArray(hub.skills) ? hub.skills : [];
  for (const skill of hubSkills) {
    const key = skill.hubSkillKey;
    const returns = tagged.some((screen) => {
      if (screen.hubSkillKey !== key) return false;
      const exits =
        "options" in screen && Array.isArray(screen.options)
          ? screen.options
              .map((choice) =>
                typeof choice === "object" && choice !== null && "goToIndex" in choice
                  ? choice.goToIndex
                  : undefined,
              )
              .filter((target): target is number => typeof target === "number")
          : [];
      const targets =
        exits.length > 0
          ? exits
          : typeof screen.continueToIndex === "number"
            ? [screen.continueToIndex]
            : [];
      return targets.includes(hubIndex);
    });
    if (!returns) {
      throw new Error(`Skill hub branch "${key}" never returns to the hub.`);
    }
  }

  return tagged;
}

/** Cohort-specific screens plus the standard cash-in rewards. */
export function resolvePayloadLesson(
  payload: LessonPayload,
  cohort: MasteryCohort,
  milestoneId: number,
): ResolvedLessonContent {
  const skillSlug = payload.skillId.trim();
  const characterName = payload.characters[cohort].trim();
  const title = payload.moduleName.trim() || moduleTitle(payload.moduleNumber);
  const labels = payload.screens.map((row) => row.screenLabel);
  const linked = linkContinueTargets(
    payload.screens.map((row) => {
      const screen = mapPayloadScreen(row, cohort, {
        skillId: skillSlug,
        skillName: payload.skillName,
        lessonNumber: payload.lessonNumber,
        leadCharacter: characterName,
      });
      const raw = mergedSettingsRaw(row.settings, cohort);
      const hasGradedChoices =
        "options" in screen &&
        Array.isArray(screen.options) &&
        screen.options.some((option) => {
          if (!option || typeof option !== "object" || !("label" in option)) return false;
          const label = String(option.label ?? "").trim();
          return label.length > 0 && !/^continue$/i.test(label);
        });
      const continueLabel = hasGradedChoices
        ? undefined
        : (screen.continueToLabel ?? continueGoLabel(raw));
      return {
        ...screen,
        // Drag screens use sourceLabel as the item name. Other screens use it
        // as the spreadsheet Screen cell for continue/hub links.
        sourceLabel:
          screen.type === "drag-to-target" ? screen.sourceLabel : row.screenLabel,
        ...(continueLabel ? { continueToLabel: continueLabel } : {}),
        ...( /^\s*HUB\s*$/im.test(raw) ? { skillHub: true as const } : {}),
      };
    }),
    labels,
    {
      moduleNumber: payload.moduleNumber,
      lessonNumber: payload.lessonNumber,
      cohort,
    },
  );

  return {
    meta: {
      milestoneId,
      levelId: payload.level,
      lessonNumber: payload.lessonNumber,
      moduleTitle: title,
      lessonTitle: payload.lessonTitle,
      shellLabel: `${title} · Lesson ${payload.lessonNumber} · ${payload.lessonTitle}`,
      totalScreens: payload.screens.length,
      skillName: payload.skillName || undefined,
      characters: {
        explorer: payload.characters.explorer,
        pathfinder: payload.characters.pathfinder,
        maverick: payload.characters.maverick,
        support: payload.characters.support || undefined,
        lead: characterName || undefined,
      },
      shippedCohorts: ["explorer", "pathfinder", "maverick"],
    },
    characterName: characterName || undefined,
    screens: tagHubSkillKeys(presentClosingResolutions(linked)),
    rewards: {
      skillSlug,
      achievementSkillSlug: skillSlug,
      ...lessonCashInXp(false),
    },
  };
}
