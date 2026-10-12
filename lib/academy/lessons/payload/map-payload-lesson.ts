import { lessonCashInXp } from "@/lib/academy/lessons/completion-xp";
import {
  isMedalIllustrationId,
  medalIdForSkillNumber,
  type MedalDisplayStatus,
  type MedalIllustrationId,
} from "@/lib/academy/illustrations/medal-registry";
import type { LessonPayload, PayloadCohortCopy, PayloadScreenRow } from "@/lib/academy/lessons/payload/types";
import type { ResolvedLessonContent, ScreenConfig } from "@/lib/academy/lessons/types";
import { getSkillRegistryRecord } from "@/lib/skills/skills-registry";
import { ACADEMY_MODULE_TITLES } from "@/lib/dashboard/academy-content";
import type { AcademyLevelId } from "@/lib/dashboard/academy-state";
import type { MasteryCohort } from "@/lib/dashboard/mastery-cohort";

type SettingEntry = { key: string; value: string };

const ITEM_BUCKETS = new Set(["SHORT", "LONG", "NEED", "WANT", "YES", "NO"]);

const BUCKET_LABEL: Record<string, { id: string; label: string; tone: "short" | "long" | "need" | "want"; icon: string }> = {
  SHORT: { id: "short", label: "Short Fun", tone: "short", icon: "⏱️" },
  LONG: { id: "long", label: "More Fun for Longer", tone: "long", icon: "🌱" },
  NEED: { id: "need", label: "Needs", tone: "need", icon: "✅" },
  WANT: { id: "want", label: "Wants", tone: "want", icon: "✨" },
  YES: { id: "yes", label: "Yes", tone: "need", icon: "✅" },
  NO: { id: "no", label: "No", tone: "want", icon: "🚫" },
};

function cohortField(copy: PayloadCohortCopy, cohort: MasteryCohort): string {
  const own = copy[cohort].trim();
  if (own) return own;
  return copy.pathfinder.trim();
}

/** Pathfinder Game Settings are the base. A cohort cell replaces any keys it sets. */
function mergedSettings(copy: PayloadCohortCopy, cohort: MasteryCohort): SettingEntry[] {
  const base = parseSettings(copy.pathfinder);
  if (cohort === "pathfinder") return base;
  const own = copy[cohort].trim();
  if (!own) return base;
  const overlay = parseSettings(own);
  const overlayKeys = new Set(overlay.map((entry) => entry.key));
  return [
    ...base.filter((entry) => !overlayKeys.has(entry.key)),
    ...overlay,
  ];
}

/** A later settings key on the same line, e.g. `CHOICE B:` or `CORRECT:`. */
function settingsKeySplit(): RegExp {
  return new RegExp(
    String.raw`\s+(?=(?:CHOICE\s+[A-Z]|ICON\s+[A-Z]|CORRECT|OPTIONS|BUTTON|CONTINUE|SOURCE|TARGET|RESULT|ORDER|ITEMS|ROUNDS|MEDAL|AVAILABLE|LABEL|HOLD|FROZEN|SUCCESS|ID|SHORT|LONG|NEED|WANT|YES|NO|(?<!CHOICE )[A-H])\s*:)`,
    "gi",
  );
}

function parseSettings(raw: string): SettingEntry[] {
  const entries: SettingEntry[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    for (const part of trimmed.split(settingsKeySplit())) {
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

/** Button copy only. Routing such as `→ SET cash=6 → GO Screen 2` stays out of the label. */
function choiceLabel(value: string): string {
  const head = value.split(/\s*→\s*/)[0] ?? "";
  return head.replace(/\s+/g, " ").trim();
}

function authoredChoices(
  entries: readonly SettingEntry[],
): { letter: string; label: string }[] {
  const fromChoiceKeys = entries.filter((entry) => /^CHOICE [A-Z]$/.test(entry.key));
  const source =
    fromChoiceKeys.length > 0
      ? fromChoiceKeys
      : entries.filter((entry) => /^[A-H]$/.test(entry.key));
  const seen = new Set<string>();
  const choices: { letter: string; label: string }[] = [];
  for (const entry of source) {
    const letter = entry.key.replace(/^CHOICE\s+/, "");
    if (seen.has(letter)) continue;
    const label = choiceLabel(entry.value);
    if (!label) continue;
    seen.add(letter);
    choices.push({ letter, label });
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

function splitEmojiLabel(text: string): { emoji?: string; label: string } {
  const match = /^(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*)\s*(.*)$/u.exec(
    text,
  );
  if (!match) return { label: text.trim() };
  const emoji = match[1];
  const label = (match[2] ?? "").trim();
  return { emoji, label: label || text.trim() };
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
};

function medalIdFromImage(fileName: string): MedalIllustrationId | undefined {
  const trimmed = fileName.trim();
  if (!trimmed || trimmed.toLowerCase() === "not allowed") return undefined;
  const base = trimmed.replace(/\.(webp|png|jpe?g)$/i, "");
  return isMedalIllustrationId(base) ? base : undefined;
}

function medalTierFromSettings(value: string | undefined): PayloadMedalTier | undefined {
  const tier = value?.trim().toLowerCase();
  if (tier === "bronze" || tier === "silver" || tier === "gold") return tier;
  if (tier === "unlocked" || tier === "unlock" || tier === "white") return "unlocked";
  return undefined;
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

function screenId(entries: readonly SettingEntry[], screenNumber: number): string {
  const authored = settingValue(entries, "ID");
  if (authored) {
    return authored
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
  return `screen-${screenNumber}`;
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
  const trueFalse = /true or false:\s*(.+?)\s+(TRUE|FALSE)\s*$/is.exec(raw.trim());
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

function rankOrderFromSettings(raw: string, error: string): {
  items: { id: string; label: string }[];
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
    if (inItems) labels.push(line);
  }

  const items = labels.map((label, index) => ({
    id: itemSlug(label, index),
    label,
  }));
  const tokens = orderHint.split(",").map((token) => token.trim()).filter(Boolean);
  const ordered = tokens
    .map((token) =>
      items.find((item) => item.label.toLowerCase().includes(token.toLowerCase()))?.id,
    )
    .filter((id): id is string => Boolean(id));
  const correctOrder =
    ordered.length === items.length && items.length > 0
      ? ordered
      : items.map((item) => item.id);
  const fallback = error.trim() || "That order isn't right yet. Try again.";
  const errors = Object.fromEntries(items.map((item) => [item.id, fallback]));
  return { items, correctOrder, errors };
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
  const text = cohortField(row.text, cohort);
  const error = cohortField(row.error, cohort);
  const settings = mergedSettings(row.settings, cohort);
  const image = pairImage(cohortField(row.image, cohort));
  const id = screenId(settings, row.screenNumber);
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
      const correct = (settingValue(settings, "CORRECT") ?? "true").trim().toLowerCase();
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
      const source = settingValue(settings, "SOURCE") ?? "";
      const target = settingValue(settings, "TARGET") ?? "";
      const emoji = source.match(/\p{Extended_Pictographic}\uFE0F?/u)?.[0];
      const sourceLabel = (emoji ? source.replace(emoji, "") : source).trim() || "Start";
      return {
        type: "drag-to-target",
        id,
        intro: text,
        sourceLabel,
        targetLabel: target.trim() || "Target",
        ...(emoji ? { itemEmoji: emoji } : {}),
        coinCount: 1,
        successMessage: "",
        ...picture,
      };
    }
    case "savings-goal": {
      const raw = cohortField(row.settings, cohort);
      const available = Number.parseInt(/AVAILABLE:\s*\$(\d+)/i.exec(raw)?.[1] ?? "", 10);
      const itemsLine = /^ITEMS:\s*(.*)$/im.exec(raw)?.[1] ?? "";
      const items = [...itemsLine.matchAll(/(\p{Extended_Pictographic}\uFE0F?)\s*([^($]+?)\s*\(\$(\d+)\)/gu)].map(
        (match, index) => ({
          id: itemSlug((match[2] ?? "").trim(), index),
          label: (match[2] ?? "").trim(),
          price: Number(match[3]),
          emoji: match[1],
        }),
      );
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
      return {
        type: "savings-goal",
        id,
        intro: text.replace(/\bthe items\b/i, dragThese ?? "the items"),
        meterLabel: settingValue(settings, "LABEL") || "Remaining",
        showsRemaining: true,
        targetAmount: Number.isFinite(available) && available > 0 ? available : prices || 1,
        poolColumnLabel: "Items",
        dropZoneLabel: "Chosen",
        items,
        workshopSignTitle: text,
        lockedLabel: "Locked",
        unlockedLabel: "Done",
        goalAchievedLabel: "Goal reached",
        ...picture,
      };
    }
    case "binary-choice":
    case "multiple-choice": {
      const choices = authoredChoices(settings);
      const correct = correctChoiceLetters(settings);
      const loose = looseBinaryChoice(cohortField(row.settings, cohort), text);
      const options =
        choices.length > 0
          ? choices.map((choice) => ({
              label: choice.label,
              isCorrect: correct.has(choice.letter),
            }))
          : [loose?.optionA, loose?.optionB]
              .filter((option): option is { label: string; isCorrect: boolean } =>
                Boolean(option?.label),
              );
      return {
        type: row.gameType,
        id,
        prompt: choices.length > 0 ? text : (loose?.prompt ?? text),
        options,
        optionA: options[0] ?? { label: "", isCorrect: true },
        optionB: options[1] ?? { label: "", isCorrect: false },
        wrongError: error,
        errorStyle: "inline-red",
        ...picture,
      };
    }
    case "tap-reveal":
    case "bucket-sort": {
      const rows = itemRows(settings);
      const bucketKeys = [...new Set(rows.map((item) => item.bucket))];
      const buckets = bucketKeys.map((key) => {
        const meta = BUCKET_LABEL[key] ?? {
          id: key.toLowerCase(),
          label: key,
          tone: "short" as const,
          icon: "•",
        };
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
        return {
          type: "tap-reveal",
          id,
          intro: text,
          buckets,
          items,
          ...picture,
        };
      }
      return {
        type: "bucket-sort",
        id,
        intro: text,
        buckets,
        items,
        ...picture,
      };
    }
    case "spotlight-rounds": {
      return {
        type: "spotlight-rounds",
        id,
        prompt: text,
        rounds: [
          {
            iconA: settingValue(settings, "ICON A") ?? "A",
            optionA: choiceLabel(settingValue(settings, "CHOICE A") ?? settingValue(settings, "A") ?? ""),
            iconB: settingValue(settings, "ICON B") ?? "B",
            optionB: choiceLabel(settingValue(settings, "CHOICE B") ?? settingValue(settings, "B") ?? ""),
            correct: correctIsB(settings) ? "b" : "a",
            error,
          },
        ],
        ...picture,
      };
    }
    case "rank-order": {
      const ranked = rankOrderFromSettings(cohortField(row.settings, cohort), error);
      return {
        type: "rank-order",
        id,
        intro: text,
        items: ranked.items,
        correctOrder: ranked.correctOrder,
        errors: ranked.errors,
        submitLabel: "Submit Answer",
        ...picture,
      };
    }
    case "allocation-slider": {
      const raw = [cohortField(row.settings, cohort), text].filter(Boolean).join("\n");
      const amounts = [...raw.matchAll(/\$(\d+)/g)].map((match) => Number(match[1]));
      const setAside = amounts[0] ?? 0;
      const remains = /remains/i.test(raw) ? (amounts[1] ?? 0) : 0;
      const total = setAside + remains || setAside || 1;
      return {
        type: "allocation-slider",
        id,
        intro: text || raw,
        total,
        targetMin: setAside || total,
        reserveGoals: [
          {
            id: "reserve",
            label: "Set aside",
            amount: setAside || total,
          },
        ],
        sliderError: error || "Slide until the amount is set aside.",
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
        ...picture,
      };
    }
    case "completion": {
      const settingsTier = medalTierFromSettings(settingValue(settings, "MEDAL"));
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

/** Cohort-specific screens plus the standard cash-in rewards. */
export function resolvePayloadLesson(
  payload: LessonPayload,
  cohort: MasteryCohort,
  milestoneId: number,
): ResolvedLessonContent {
  const skillSlug = payload.skillId.trim();
  const characterName = payload.characters[cohort].trim();
  const title = moduleTitle(payload.moduleNumber);

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
    screens: payload.screens.map((row) =>
      mapPayloadScreen(row, cohort, {
        skillId: skillSlug,
        skillName: payload.skillName,
      }),
    ),
    rewards: {
      skillSlug,
      achievementSkillSlug: skillSlug,
      ...lessonCashInXp(false),
    },
  };
}
