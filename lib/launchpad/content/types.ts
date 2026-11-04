import type { LaunchpadReadableSchemaVersion } from "@/lib/launchpad/content/schema-version";
import type { LogoIconId, LogoShapeId, NameColorId, NameFontId } from "@/lib/launchpad/content/identity";

/**
 * Launchpad venture content. One payload per venture, stored as one row in
 * launchpad_venture_versions (same versioned publish as Academy lessons).
 *
 *   venture
 *     floors (one per level; the gold milestone is on the wall)
 *       silver plaques (1 or more per floor)
 *         bronze milestones (1 or more per plaque; one door each)
 *           tasks (1 or more per bronze)
 *             task screens (typed templates with text slots)
 *
 * Progress is keyed by task id, so a task id must never move to another bronze.
 */

/** Floor screen templates. Every floor renders through the template for its type. */
export const LAUNCHPAD_FLOOR_TYPES = ["corridor"] as const;
export type LaunchpadFloorType = (typeof LAUNCHPAD_FLOOR_TYPES)[number];

/** Task screen templates, keyed by `type`, like Academy's screen types. */
export const LAUNCHPAD_TASK_SCREEN_TYPES = [
  "placeholder",
  "text",
  "checklist",
  "logo-picker",
  "name-picker",
  "context",
  "choice-capture",
  "rank-order",
  "short-text",
  "goal-loop",
] as const;
export type LaunchpadTaskScreenType = (typeof LAUNCHPAD_TASK_SCREEN_TYPES)[number];

export const LAUNCHPAD_PLACEHOLDER_BLOCK_KINDS = ["text", "illustration", "interactive"] as const;
export type LaunchpadPlaceholderBlockKind = (typeof LAUNCHPAD_PLACEHOLDER_BLOCK_KINDS)[number];

type TaskScreenBase = {
  id: string;
  /** Screen heading. Blank uses the task title. */
  heading?: string;
};

/** Labelled grey blocks while workbook content is TBC. */
export type LaunchpadPlaceholderScreen = TaskScreenBase & {
  type: "placeholder";
  blocks: readonly { kind: LaunchpadPlaceholderBlockKind; label: string }[];
};

/** A paragraph of copy, with an optional small note under it. */
export type LaunchpadTextScreen = TaskScreenBase & {
  type: "text";
  body: string;
  note?: string;
};

/** A short intro line and a list of items. */
export type LaunchpadChecklistScreen = TaskScreenBase & {
  type: "checklist";
  intro?: string;
  items: readonly string[];
};

/** One labelled choice in a picker. */
export type LaunchpadPickerOption<Id extends string = string> = { id: Id; label: string };

/** Picker screens save into the learner's answer for `answerKey` (see lib/launchpad/content/identity.ts). */
type PickerBase = TaskScreenBase & {
  answerKey: string;
  /** One line above the choices, e.g. "Pick a shape for your sticker." */
  prompt: string;
};

export const LOGO_PICKER_STEPS = ["shape", "color", "icon"] as const;
export const NAME_PICKER_STEPS = ["name", "font", "nameColor"] as const;

/**
 * Logo builder step (bronze "Design your logo"): a live logo preview at the
 * top, then the choices for this step. Shape, then color, then icon.
 */
export type LaunchpadLogoPickerScreen = PickerBase & { type: "logo-picker" } & (
    | { step: "shape"; options: readonly LaunchpadPickerOption<LogoShapeId>[] }
    | { step: "color"; options: readonly (LaunchpadPickerOption & { hex: string })[] }
    | {
        step: "icon";
        /** Icon choices per business, keyed by venture id. */
        iconSets: Readonly<Record<string, readonly LaunchpadPickerOption<LogoIconId>[]>>;
        /** Venture whose set is used when the venture has none of its own. */
        fallbackVentureId: string;
      }
  );

/**
 * Business name step (bronze "Name your business"): a live preview of the
 * logo with the name, then the name box, the font, or the name color.
 */
export type LaunchpadNamePickerScreen = PickerBase & { type: "name-picker" } & (
    | { step: "name"; inputLabel: string; placeholderText?: string; maxLength: number }
    | { step: "font"; options: readonly LaunchpadPickerOption<NameFontId>[] }
    | { step: "nameColor"; options: readonly LaunchpadPickerOption<NameColorId>[] }
  );

/**
 * Context/guidance screen (payload v2): the "why it matters" line and the
 * how-to line, shown on their own page before the interaction (Notes tab:
 * context/guidance vs interaction split).
 */
export type LaunchpadContextScreen = TaskScreenBase & {
  type: "context";
  context: string;
  guidance?: string;
};

/** Capture screens save one answer (lib/launchpad/content/answers.ts) under `answerKey`. */
type CaptureBase = TaskScreenBase & {
  answerKey: string;
  /**
   * Optional "why it matters" line shown at the top of the screen, above the
   * guidance and the question, so a bronze opens on one screen (load D21).
   * When set, `guidance` shows under it on the accent panel, not under the prompt.
   */
  context?: string;
  /** The question line above the interaction. */
  prompt: string;
  /** Optional how-to line under the prompt. */
  guidance?: string;
};

/**
 * Multiple-choice capture: no wrong answers, selected state only (no ticks).
 * Saves a "selection" answer: `selected` option ids.
 */
export type LaunchpadChoiceCaptureScreen = CaptureBase & {
  type: "choice-capture";
  mode: "single" | "multi";
  options: readonly LaunchpadPickerOption[];
  /** Lead-in when the pick shows as a sentence in a summary, e.g. "My top reason to be my own boss". */
  summaryLabel?: string;
};

/**
 * Rank-order capture with a per-item "not applicable" toggle. Saves a
 * "ranking" answer: `order` (all ids, most important first) plus
 * `notApplicable` ids, which are struck out and left off summaries.
 */
export type LaunchpadRankOrderScreen = CaptureBase & {
  type: "rank-order";
  items: readonly LaunchpadPickerOption[];
  notApplicableLabel: string;
};

/** Input kinds for a short-text field. */
export const LAUNCHPAD_FIELD_INPUTS = ["text", "integer", "currency", "choice"] as const;
export type LaunchpadFieldInput = (typeof LAUNCHPAD_FIELD_INPUTS)[number];

/** One blank in a short-text sentence, or an extra field under it. */
export type LaunchpadTextField = {
  /** Field name inside the answer's `values`, camelCase. */
  name: string;
  input: LaunchpadFieldInput;
  /** Accessible label, e.g. "Amount". */
  label: string;
  /** Square-bracket hint shown in the blank, e.g. "a time, day or type of service". */
  hint?: string;
  /** text: most characters. */
  maxLength?: number;
  /** integer: inclusive bounds. */
  min?: number;
  max?: number;
  /** choice: the options (a dropdown). */
  options?: readonly LaunchpadPickerOption[];
  optional?: boolean;
};

/** A short-text sentence: fixed text, blanks, and carried-in values. */
export type LaunchpadSentencePart =
  | { kind: "text"; text: string }
  | { kind: "field"; field: string }
  /** A value carried from an earlier answer (a selection's chosen option label). */
  | { kind: "carried"; answerKey: string; label: string };

/**
 * Short text box. `goal` mode: one inline sentence (number, currency,
 * timeframe). `paragraph` mode: fill-in-the-blank paragraph, text blanks as
 * boxes. Saves a "fields" answer: `values` by field name.
 */
export type LaunchpadShortTextScreen = Omit<CaptureBase, "prompt"> & {
  type: "short-text";
  /** Line above the sentence, e.g. "Your paragraph". Goal sentences need none. */
  prompt?: string;
  mode: "goal" | "paragraph";
  parts: readonly LaunchpadSentencePart[];
  fields: readonly LaunchpadTextField[];
  /** Field names shown as labelled inputs under the sentence (not in it). */
  extraFields?: readonly string[];
  /** The learner may mark the whole screen "not applicable". */
  notApplicableLabel?: string;
  /** Every field may be left blank (e.g. "Add another goal"). */
  optional?: boolean;
};

/** One goal in a goal loop: its page, and the ranked reason that drives it. */
export type LaunchpadGoalLoopGoal = {
  /** The ranking item that orders this goal; absent for the optional extra goal. */
  rankItemId?: string;
  /** "ranked": in ranking order; "after-ranked": after all ranked goals; "last": the optional final goal. */
  position: "ranked" | "after-ranked" | "last";
  title: string;
  screen: LaunchpadShortTextScreen | LaunchpadChoiceCaptureScreen;
};

/**
 * Goal loop: one goal page per ranked reason, in the learner's ranking order
 * (`orderFrom` ranking answer). Reasons marked not applicable are skipped,
 * as are `skipRankItemIds`.
 */
export type LaunchpadGoalLoopScreen = TaskScreenBase & {
  type: "goal-loop";
  orderFrom: string;
  skipRankItemIds: readonly string[];
  goals: readonly LaunchpadGoalLoopGoal[];
};

export type LaunchpadTaskScreen =
  | LaunchpadPlaceholderScreen
  | LaunchpadTextScreen
  | LaunchpadChecklistScreen
  | LaunchpadLogoPickerScreen
  | LaunchpadNamePickerScreen
  | LaunchpadContextScreen
  | LaunchpadChoiceCaptureScreen
  | LaunchpadRankOrderScreen
  | LaunchpadShortTextScreen
  | LaunchpadGoalLoopScreen;

/** Silver wrap-up screen templates, shown once the silver's last bronze is done. */
export const LAUNCHPAD_WRAP_UP_TYPES = ["identity-wrap-up", "workbook-summary"] as const;
export type LaunchpadWrapUpType = (typeof LAUNCHPAD_WRAP_UP_TYPES)[number];

/**
 * "Build your identity" wrap-up: the unified logo from the saved answer, with
 * inline editing (choices come from the silver's picker screens).
 */
export type LaunchpadIdentityWrapUp = {
  type: "identity-wrap-up";
  answerKey: string;
  heading: string;
  body?: string;
  finalizeLabel: string;
  /** PLACEHOLDER frame pending Jasper's wrap-up art. */
  placeholder: boolean;
  /** Sections under the logo on the handbook page ("Our vision", "What we sell"). */
  handbookSections?: readonly LaunchpadSummarySection[];
};

/** How a summary section shows its answer(s). */
export const LAUNCHPAD_SUMMARY_DISPLAYS = ["list", "ranked", "choice", "text", "sentences"] as const;
export type LaunchpadSummaryDisplay = (typeof LAUNCHPAD_SUMMARY_DISPLAYS)[number];

/**
 * Where a section reads from: an answer key, and for "text" one field of it.
 * Inline edit on the wrap-up (Cath, 4 Nov): a value is editable in place only
 * when editing it does not rewire logic owned by another screen (rank order
 * driving the goal loop, the cause carried into the donate goal, the Parent
 * Hub currency). `editSelection` lets the learner re-pick a selection's
 * options; `editFields` names the fields of a fields answer they may retype.
 */
export type LaunchpadSummarySource = {
  answerKey: string;
  field?: string;
  editSelection?: boolean;
  editFields?: readonly string[];
};

export type LaunchpadSummarySection = {
  id: string;
  label: string;
  display: LaunchpadSummaryDisplay;
  sources: readonly LaunchpadSummarySource[];
};

/**
 * Workbook summary wrap-up: one section per heading, fed by answer keys.
 * Sections with editable sources show a pencil that edits in place on the
 * card (no navigating back); everything else is read-only.
 */
export type LaunchpadSummaryWrapUp = {
  type: "workbook-summary";
  heading: string;
  body?: string;
  finalizeLabel: string;
  sections: readonly LaunchpadSummarySection[];
  /** PLACEHOLDER frame pending wrap-up art. */
  placeholder: boolean;
};

export type LaunchpadWrapUp = LaunchpadIdentityWrapUp | LaunchpadSummaryWrapUp;

export type LaunchpadTask = {
  id: string;
  title: string;
  /** TBC copy. Must not ship as real content. */
  placeholder: boolean;
  screens: readonly LaunchpadTaskScreen[];
  /** Label for the workbook's forward button on this task, e.g. "Save to my workbook". Defaults to Next / Finish. */
  ctaLabel?: string;
  /** One screen per page (context first, then the interaction) instead of all stacked. */
  paged?: boolean;
  /** "real-world": the learner does it away from the app (may take days). Defaults to in-app. */
  kind?: "in-app" | "real-world";
};

export type LaunchpadBronze = {
  id: string;
  title: string;
  /** Optional short line under the door title. */
  subtitle?: string;
  placeholder: boolean;
  tasks: readonly LaunchpadTask[];
};

export type LaunchpadSilver = {
  id: string;
  title: string;
  placeholder: boolean;
  bronzes: readonly LaunchpadBronze[];
  /** Optional wrap-up screen once every bronze is done. */
  wrapUp?: LaunchpadWrapUp;
};

/** The gold milestone: the level goal shown on the floor wall. */
export type LaunchpadGold = {
  id: string;
  title: string;
  /** Gold completion screen after the floor's last silver. */
  completion?: LaunchpadGoldCompletion;
};

export type LaunchpadGoldCompletion = {
  heading: string;
  body: string;
  guidance?: string;
  recap?: string;
  buttonLabel: string;
};

export type LaunchpadFloor = {
  level: number;
  /** Short floor name used on the building and in the lift, e.g. "Planning". */
  name: string;
  floorType: LaunchpadFloorType;
  gold: LaunchpadGold;
  silvers: readonly LaunchpadSilver[];
};

/** What one launchpad_venture_versions row stores in `payload`. */
export type LaunchpadVenturePayload = {
  schemaVersion: LaunchpadReadableSchemaVersion;
  ventureId: string;
  floors: readonly LaunchpadFloor[];
};
