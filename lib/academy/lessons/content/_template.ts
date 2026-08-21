/**
 * DEVELOPER REFERENCE ONLY — content authors should NOT edit this file.
 *
 * Content authors: use the spreadsheet workflow instead:
 *   templates/lesson-authoring/INSTRUCTIONS.md
 *
 * Copy Lesson-Details.csv + Screens.csv → fill in Google Sheets →
 *   npm run lesson:import -- path/to/your-folder
 */

import {
  explorerCompletionScreen,
  teenCompletionScreen,
} from "@/lib/academy/lessons/completion-screen";
import type {
  CohortLessonDefinition,
  ScreenConfig,
  ScreenOverrideMap,
} from "@/lib/academy/lessons/types";

// ═══════════════════════════════════════════════════════════════════════════
// STEP 1 — METADATA
// Confirm milestoneId with Academy map / developer before shipping.
// ═══════════════════════════════════════════════════════════════════════════

const M1_L3_META = {
  milestoneId: 3,
  levelId: 1,
  lessonNumber: 3,
  moduleTitle: "How the Money Game Works",
  lessonTitle: "REPLACE: Lesson Title From Design Doc",
  shellLabel: "How the Money Game Works · Lesson 3 · REPLACE: Lesson Title",
  totalScreens: 8,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// STEP 2 — REWARDS & SKILL
// skillSlug must match an existing Vault skill (or coordinate new skill with dev).
// ═══════════════════════════════════════════════════════════════════════════

const M1_L3_REWARDS = {
  skillSlug: "REPLACE-kebab-skill-id",
  achievementSkillSlug: "REPLACE-kebab-skill-id",
  xpReward: 150,
  perfectStreakBonus: 50,
} as const;

const TEEN_REWARDS = {
  xpReward: 50,
  perfectStreakBonus: 0,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// STEP 3 — BASE SCREENS (Pathfinder Excel → all 8 rows)
// Keep: type, id, correct answers, bucket assignments.
// Change per cohort later via overrides — not here.
// ═══════════════════════════════════════════════════════════════════════════

const M1_L3_BASE_SCREENS: ScreenConfig[] = [
  // ── Row 1 · The Fill-the-Blank Drop ─────────────────────────────────────
  // Archetype: The Fill-the-Blank Drop → type: "word-drop"
  // Excel text split at [ ______ ] → narrativeBefore + narrativeAfter
  // Excel pool → options[] ; correct capsule → correctOption
  {
    type: "word-drop",
    id: "hook-word-drop",
    narrativeBefore: "REPLACE: text before the blank",
    narrativeAfter: "right away!",
    options: ["Spent", "Saved", "Hidden"],
    correctOption: "Spent",
    wrongError: "REPLACE: error message from Excel",
  },

  // ── Row 2 · The Sentence Finisher ───────────────────────────────────────
  // Archetype: The Sentence Finisher → type: "binary-choice"
  // Excel 🟢 → optionA isCorrect: true ; 🔴 → optionB isCorrect: false
  {
    type: "binary-choice",
    id: "short-fun-reality",
    prompt: "REPLACE: setup sentence ending with ...",
    optionA: { label: "REPLACE: correct ending", isCorrect: true },
    optionB: { label: "REPLACE: wrong ending", isCorrect: false },
    wrongError: "REPLACE: error message",
    errorStyle: "inline-red",
  },

  // ── Row 3 · The Flash Tap ────────────────────────────────────────────────
  // Archetype: The Flash Tap → type: "tap-reveal" (emoji + label locked in TapRevealScreen)
  {
    type: "tap-reveal",
    id: "tap-short-vs-long",
    intro: "REPLACE: tap intro from Excel",
    buckets: [
      { id: "short", label: "Short Fun", tone: "short" },
      { id: "long", label: "More Fun for Longer", tone: "long" },
    ],
    items: [
      { id: "item-a", emoji: "🧪", label: "Short fun item A", bucket: "short" },
      { id: "item-b", emoji: "🍬", label: "Short fun item B", bucket: "short" },
      { id: "item-c", emoji: "🧥", label: "Long fun item C", bucket: "long" },
      { id: "item-d", emoji: "🥤", label: "Long fun item D", bucket: "long" },
    ],
  },

  // ── Row 4 · The Sorting Game ─────────────────────────────────────────────
  // Archetype: The Sorting Game → type: "bucket-sort"
  // Each Excel item → { id, emoji, label, bucket: "short"|"long" }
  {
    type: "bucket-sort",
    id: "sort-short-vs-long",
    intro: "Your turn! Sort these items into the correct bucket.",
    buckets: [
      { id: "short", label: "Short Fun" },
      { id: "long", label: "More Fun for Longer" },
    ],
    items: [
      { id: "sort-a", emoji: "🧋", label: "REPLACE item A", bucket: "short" },
      { id: "sort-b", emoji: "🪄", label: "REPLACE item B", bucket: "short" },
      { id: "sort-c", emoji: "🔊", label: "REPLACE item C", bucket: "long" },
      { id: "sort-d", emoji: "📓", label: "REPLACE item D", bucket: "long" },
    ],
  },

  // ── Row 5 · The Quick Choice (Trap) ──────────────────────────────────────
  // Archetype: The Quick Choice → type: "binary-choice" + errorStyle: "banner"
  {
    type: "binary-choice",
    id: "countdown-trap",
    prompt: "REPLACE: countdown trap question",
    optionA: { label: "REPLACE: true reason", isCorrect: true },
    optionB: { label: "REPLACE: false reason", isCorrect: false },
    wrongError: "REPLACE: trap error message",
    errorStyle: "banner",
  },

  // ── Row 6 · Hold / Freeze / Silence ──────────────────────────────────────
  // Archetype: The 24-Hour Freeze (or hold-to-silence) → type: "hold-to-fill"
  {
    type: "hold-to-fill",
    id: "impulse-pause",
    narrative: "REPLACE: hold screen narrative",
    holdLabel: "🔕 HOLD TO SILENCE 🔕",
    frozenLabel: "🔕 SILENCED 🔕",
    successMessage: "REPLACE: success quote after hold completes",
    holdDurationMs: 2000,
  },

  // ── Row 7 · The Celebration ──────────────────────────────────────────────
  // Archetype: The Celebration → type: "narrative-bonus"
  // Teen: bonusXp 50 + tap label. Explorer override often sets bonusXp: 0.
  {
    type: "narrative-bonus",
    id: "resolution",
    narrative: "REPLACE: celebration narrative",
    bonusXp: 50,
    bonusTapLabel: "[ COLLECT 50 COINS BONUS ]",
    autoReadyWhenNoBonus: false,
  },

  // ── Row 8 · Lesson Recap ─────────────────────────────────────────────────
  // Archetype: Lesson Recap Screen → teenCompletionScreen (Pathfinder base)
  // Explorer swaps via override — see EXPLORER_OVERRIDES below.
  teenCompletionScreen({
    skillTitle: "REPLACE: Skill Name",
    xpReward: TEEN_REWARDS.xpReward,
  }),
];

// ═══════════════════════════════════════════════════════════════════════════
// STEP 4 — EXPLORER OVERRIDES (Explorer Excel → diff only)
// Omit any screen where Explorer matches Pathfinder exactly.
// ═══════════════════════════════════════════════════════════════════════════

const EXPLORER_OVERRIDES: ScreenOverrideMap = {
  "hook-word-drop": {
    narrativeBefore: "REPLACE: Lars hook text before blank",
    wrongError: "REPLACE: Lars hook error",
  },
  "short-fun-reality": {
    prompt: "REPLACE: Lars screen 2 prompt",
    optionA: { label: "REPLACE: correct", isCorrect: true },
    optionB: { label: "REPLACE: wrong", isCorrect: false },
    wrongError: "REPLACE: error",
  },
  "tap-short-vs-long": {
    intro: "REPLACE: Lars screen 3 intro",
    items: [
      { id: "worms", emoji: "🍬", label: "Sour Worms", bucket: "short" },
      { id: "popcorn", emoji: "🍿", label: "Cinema Popcorn", bucket: "short" },
      { id: "headphones", emoji: "🎧", label: "Wireless Headphones", bucket: "long" },
      { id: "skateboard", emoji: "🛹", label: "Skateboard", bucket: "long" },
    ],
  },
  "sort-short-vs-long": {
    items: [
      { id: "pizza", emoji: "🍕", label: "Pizza slice", bucket: "short" },
      { id: "bubble-tea", emoji: "🥤", label: "Bubble tea with all the toppings", bucket: "short" },
      { id: "controller", emoji: "🎮", label: "Gaming controller", bucket: "long" },
      { id: "emote", emoji: "💃", label: "Dance Emote", bucket: "long" },
    ],
  },
  "countdown-trap": {
    prompt: "REPLACE: Lars trap prompt",
    optionA: { label: "REPLACE: correct", isCorrect: true },
    optionB: { label: "REPLACE: wrong", isCorrect: false },
    wrongError: "REPLACE: error",
  },
  "impulse-pause": {
    narrative: "REPLACE: Lars hold narrative",
    holdLabel: "❄️ HOLD TO FREEZE ❄️",
    frozenLabel: "❄️ FROZEN ❄️",
    successMessage: "REPLACE: Lars success message",
  },
  resolution: {
    narrative: "REPLACE: Lars resolution (no bonus tap)",
    bonusXp: 0,
    bonusTapLabel: "",
    autoReadyWhenNoBonus: true,
  },
  "milestone-splash": {
    _replace: true,
    ...explorerCompletionScreen(),
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 5 — MAVERICK OVERRIDES (Maverick Excel → diff only)
// ═══════════════════════════════════════════════════════════════════════════

const MAVERICK_OVERRIDES: ScreenOverrideMap = {
  "hook-word-drop": {
    narrativeBefore: "REPLACE: Aiden hook text before blank",
    wrongError: "REPLACE: Aiden hook error",
  },
  "short-fun-reality": {
    prompt: "REPLACE: Aiden screen 2 prompt",
    optionA: { label: "REPLACE: correct", isCorrect: true },
    optionB: { label: "REPLACE: wrong", isCorrect: false },
    wrongError: "REPLACE: error",
  },
  "tap-short-vs-long": {
    intro: "REPLACE: Aiden screen 3 intro",
    items: [
      { id: "energy-snack", emoji: "⚡", label: "Energy drink + snack", bucket: "short" },
      { id: "scratch-ticket", emoji: "🎫", label: "Scratch-it lottery ticket", bucket: "short" },
      { id: "speaker", emoji: "🔊", label: "Wireless speaker", bucket: "long" },
      { id: "multitool", emoji: "🔧", label: "Multi-tool / pocket knife", bucket: "long" },
    ],
  },
  "sort-short-vs-long": {
    intro: "Your turn!",
    items: [
      { id: "delivery", emoji: "🍔", label: "Food delivery with priority fee", bucket: "short" },
      { id: "merch", emoji: "👕", label: "Disposable concert merch", bucket: "short" },
      { id: "guitar", emoji: "🎸", label: "Second-hand quality guitar", bucket: "long" },
      { id: "clothing", emoji: "🧥", label: "High-quality piece of clothing", bucket: "long" },
    ],
  },
  "countdown-trap": {
    prompt: "REPLACE: Aiden trap prompt",
    optionA: { label: "REPLACE: correct", isCorrect: true },
    optionB: { label: "REPLACE: wrong", isCorrect: false },
    wrongError: "REPLACE: error",
  },
  "impulse-pause": {
    narrative: "REPLACE: Aiden hold narrative",
    holdLabel: "⏸️ HOLD TO PAUSE ⏸️",
    frozenLabel: "⏸️ PAUSED ⏸️",
    successMessage: "REPLACE: Aiden success quote",
  },
  resolution: {
    narrative: "REPLACE: Aiden celebration + bonus XP copy",
    bonusXp: 50,
    bonusTapLabel: "[ COLLECT 50 COINS BONUS ]",
    autoReadyWhenNoBonus: false,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// STEP 6 — EXPORT (required — developer imports this symbol)
// ═══════════════════════════════════════════════════════════════════════════

export const M1_L3_LESSON_DEFINITION: CohortLessonDefinition = {
  meta: M1_L3_META,
  rewards: M1_L3_REWARDS,
  baseScreens: M1_L3_BASE_SCREENS,
  byCohort: {
    explorer: {
      characterName: "Lars",
      screenOverrides: EXPLORER_OVERRIDES,
    },
    pathfinder: {
      characterName: "Holly",
      rewards: TEEN_REWARDS,
    },
    maverick: {
      characterName: "Aiden",
      screenOverrides: MAVERICK_OVERRIDES,
      rewards: TEEN_REWARDS,
    },
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// SCREEN ID CHECKLIST (reuse when archetypes match M1-L1)
// ═══════════════════════════════════════════════════════════════════════════
//  1. hook-word-drop      word-drop
//  2. short-fun-reality   binary-choice (inline-red)
//  3. tap-short-vs-long   tap-reveal
//  4. sort-short-vs-long  bucket-sort
//  5. countdown-trap      binary-choice (banner)
//  6. impulse-pause       hold-to-fill
//  7. resolution          narrative-bonus
//  8. milestone-splash    completion (helpers)
//
// Different lesson archetypes (M1-L2): true-false, spotlight-rounds, custom
// See m1-l2.ts + README.md "Developer handoff"
