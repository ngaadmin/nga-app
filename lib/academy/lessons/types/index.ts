/**
 * Academy lesson content schema
 * ─────────────────────────────
 * Static TypeScript modules under `lib/academy/lessons/content/` define each lesson.
 * Cohort variants use `baseScreens` + per-cohort `screenOverrides` (see cohort-overrides.ts).
 * Maverick inherits Pathfinder when `maverick` is omitted.
 *
 * @example Word-drop screen (M1-L1 Screen 1)
 * ```ts
 * {
 *   type: "word-drop",
 *   id: "hook-word-drop",
 *   narrativeBefore: "Holly made $25... the cash must be",
 *   narrativeAfter: "right away!",
 *   options: ["Spent", "Saved", "Hidden"],
 *   correctOption: "Spent",
 *   wrongError: "Not quite! ...",
 * }
 * ```
 *
 * @example Binary-choice screen (M1-L1 Screen 5)
 * ```ts
 * {
 *   type: "binary-choice",
 *   id: "countdown-trap",
 *   prompt: 'Holly\'s playing online and a game alert flashes...',
 *   optionA: { label: "To stop her from pausing...", isCorrect: true },
 *   optionB: { label: "Because they want to make sure...", isCorrect: false },
 *   wrongError: "Don't fall for the countdown! ...",
 *   errorStyle: "banner",
 * }
 * ```
 *
 * @example Bucket-sort screen (M1-L1 Screen 4)
 * ```ts
 * {
 *   type: "bucket-sort",
 *   id: "sort-short-vs-long",
 *   intro: "Your turn! Sort these items into the correct bucket.",
 *   buckets: [
 *     { id: "short", label: "Short Fun" },
 *     { id: "long", label: "More Fun for Longer" },
 *   ],
 *   items: [
 *     { id: "bubble-tea", emoji: "🧋", label: "Giant bubble tea", bucket: "short" },
 *   ],
 * }
 * ```
 *
 * @example Custom screen (M1-L2 budget checkboxes)
 * ```ts
 * { type: "custom", id: "budget-wallet", renderer: "m1-l2-budget-wallet" }
 * ```
 */

export * from "./meta";
export * from "./declarative";
export * from "./shared-blocks";
export * from "./screens/index";
export * from "./lesson-content";
export * from "./resolve";

export type {
  ScreenOverrideMap,
  ScreenOverridePatch,
} from "../cohort-overrides";
