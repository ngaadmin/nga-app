import type { LAUNCHPAD_PAYLOAD_SCHEMA_VERSION } from "@/lib/launchpad/content/schema-version";
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
export const LAUNCHPAD_TASK_SCREEN_TYPES = ["placeholder", "text", "checklist", "logo-picker", "name-picker"] as const;
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

export type LaunchpadTaskScreen =
  | LaunchpadPlaceholderScreen
  | LaunchpadTextScreen
  | LaunchpadChecklistScreen
  | LaunchpadLogoPickerScreen
  | LaunchpadNamePickerScreen;

/** Silver wrap-up screen templates, shown once the silver's last bronze is done. */
export const LAUNCHPAD_WRAP_UP_TYPES = ["identity-wrap-up"] as const;
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
};

export type LaunchpadWrapUp = LaunchpadIdentityWrapUp;

export type LaunchpadTask = {
  id: string;
  title: string;
  /** TBC copy. Must not ship as real content. */
  placeholder: boolean;
  screens: readonly LaunchpadTaskScreen[];
  /** Label for the workbook's forward button on this task, e.g. "Save to my workbook". Defaults to Next / Finish. */
  ctaLabel?: string;
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
  schemaVersion: typeof LAUNCHPAD_PAYLOAD_SCHEMA_VERSION;
  ventureId: string;
  floors: readonly LaunchpadFloor[];
};
