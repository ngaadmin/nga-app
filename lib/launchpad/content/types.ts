import type { LAUNCHPAD_PAYLOAD_SCHEMA_VERSION } from "@/lib/launchpad/content/schema-version";

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
export const LAUNCHPAD_TASK_SCREEN_TYPES = ["placeholder", "text", "checklist"] as const;
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

export type LaunchpadTaskScreen = LaunchpadPlaceholderScreen | LaunchpadTextScreen | LaunchpadChecklistScreen;

export type LaunchpadTask = {
  id: string;
  title: string;
  /** TBC copy. Must not ship as real content. */
  placeholder: boolean;
  screens: readonly LaunchpadTaskScreen[];
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
