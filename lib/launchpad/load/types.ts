import type {
  LaunchpadGoldCompletion,
  LaunchpadSummarySection,
  LaunchpadTaskScreen,
  LaunchpadWrapUp,
} from "@/lib/launchpad/content/types";

/**
 * The Launchpad load file (content/launchpad/<venture>.load.json): the
 * tracker's L1 and L2 rows resolved into explicit screens, answer keys,
 * fields, limits and cross-task references. tools/launchpad-load-from-xlsx.ts
 * regenerates it from the tracker workbook; lib/launchpad/load/to-payload.ts
 * overlays it onto the bundled seed (L3 to L6 keep their placeholders).
 */
export const LAUNCHPAD_LOAD_VERSION = 1;

/** Screen templates a load row may name (task screens, wrap-ups, the gold screen). */
export const LAUNCHPAD_LOAD_TEMPLATES = [
  "context",
  "choice-capture:single",
  "choice-capture:multi",
  "rank-order",
  "short-text:goal",
  "short-text:paragraph",
  "goal-loop",
  "logo-picker",
  "name-picker",
  "workbook-summary",
  "identity-wrap-up",
  "gold-completion",
] as const;
export type LaunchpadLoadTemplate = (typeof LAUNCHPAD_LOAD_TEMPLATES)[number];

/** One field of the saved answer, as the export lists it. */
export type LoadAnswerField = {
  name: string;
  type: string;
  required: boolean;
  limits?: string;
};

export type LoadAnswerSpec = {
  answerKey: string;
  kind: "selection" | "ranking" | "fields" | "business-identity";
  version: 1;
  fields: LoadAnswerField[];
};

/** An earlier answer this screen reads, and what for. */
export type LoadFeed = { answerKey: string; use: string };

/** Meta every load row carries (one row per screen in the export). */
export type LoadRowMeta = {
  /** Payload id of the screen, wrap-up (`<silver>-wrap`) or gold screen (`<gold>-completion`). */
  screenId: string;
  /** Page within the task: "1", "2", goal pages "2.1", "2.2"... */
  index: string;
  sourceRow: number;
  template: LaunchpadLoadTemplate;
  context?: string;
  guidance?: string;
  question?: string;
  options?: { id: string; label: string }[];
  answer?: LoadAnswerSpec;
  /** Limits and caps in words, e.g. "amount: whole number 1 to 9,999,999". */
  validation: string[];
  /** Earlier answers this screen reads. */
  feeds: LoadFeed[];
  /** Screen or section ids that read this screen's answer. */
  feedsInto: string[];
  /** Decision ids (D1...) and notes. */
  flags: string[];
};

export type LoadScreen = LoadRowMeta & {
  /** The payload screen. Goal pages have none: they live inside their goal-loop's payload. */
  payload?: LaunchpadTaskScreen;
  /** Goal pages: the goal-loop screen id they belong to. */
  inGoalLoop?: string;
};

export type LoadTask = {
  id: string;
  title: string;
  kind: "in-app" | "real-world";
  paged: boolean;
  /** "Come back to this later" allowed (tracker column "Come back later"; false when absent). */
  canComeBackLater: boolean;
  ctaLabel?: string;
  screens: LoadScreen[];
};

export type LoadBronze = {
  id: string;
  title: string;
  /** Column C label in the tracker. */
  sheetLabel: string;
  sourceRow: number;
  tasks: LoadTask[];
};

export type LoadWrapUp = LoadRowMeta & {
  /** Summary wrap-ups are written in full; the locked identity wrap-up only adds handbookSections. */
  payload?: LaunchpadWrapUp;
  handbookSections?: LaunchpadSummarySection[];
};

export type LoadSilver = {
  id: string;
  title: string;
  /** Column B label in the tracker. */
  sheetLabel: string;
  /** "locked": the build stays exactly as the seed has it (identity); the rows are recorded only. */
  build: "load" | "locked";
  bronzes: LoadBronze[];
  /** Locked silvers: their rows, recorded for the export. */
  lockedRows?: LoadRowMeta[];
  wrapUp?: LoadWrapUp;
};

export type LoadGold = {
  id: string;
  completion?: LaunchpadGoldCompletion;
  row?: LoadRowMeta;
};

export type LoadLevel = {
  level: number;
  name: string;
  gold: LoadGold;
  silvers: LoadSilver[];
};

export type LoadDecision = {
  id: string;
  topic: string;
  /** What the load does now. */
  applied: string;
  status: "decided-cath" | "default-pending-cath" | "pending-cath" | "build-assumption" | "sample-pending-tracker-column";
  rows: number[];
};

export type LaunchpadLoadFile = {
  loadVersion: typeof LAUNCHPAD_LOAD_VERSION;
  ventureId: string;
  /** Fills the {product} token in sentences. */
  ventureNoun: string;
  source: {
    file: string;
    sheet: string;
    md5: string;
    rows: string;
    notes: { date: string; note: string }[];
  };
  levels: LoadLevel[];
  decisions: LoadDecision[];
};
