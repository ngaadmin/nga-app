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
  "know-your-cost",
  "set-price",
  "jobs-to-cover",
  "offer-loop",
  "customer-check",
  "competitor-check",
  "funding-start",
  "getting-ready",
] as const;
export type LaunchpadTaskScreenType = (typeof LAUNCHPAD_TASK_SCREEN_TYPES)[number];

export const LAUNCHPAD_PLACEHOLDER_BLOCK_KINDS = ["text", "illustration", "interactive"] as const;
export type LaunchpadPlaceholderBlockKind = (typeof LAUNCHPAD_PLACEHOLDER_BLOCK_KINDS)[number];

type TaskScreenBase = {
  id: string;
  /** Screen heading. Blank uses the task title. */
  heading?: string;
  context?: string;
  guidance?: string;
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
export type LaunchpadPickerOption<Id extends string = string> = {
  id: Id;
  label: string;
  /** choice fields with `prefills`: the text this option drops into that field (row 8 "skill | success line"). */
  prefill?: string;
};

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
  /** Workbook (handbook) section this answer shows under, e.g. "My why" (Final column Z). */
  handbookLabel?: string;
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
  /** choice: the option id picked before the learner touches it (weeks); no empty "Choose" row. */
  defaultValue?: string;
  /**
   * choice: the text field this pick fills with the option's `prefill`. A new
   * pick swaps the text only while the learner has not typed their own.
   */
  prefills?: string;
  /** text: a two-line box in the sentence (long success lines). */
  multiline?: boolean;
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
  /** Why the goals matter; shown above the first goal (step 1), not on a page of its own. */
  context?: string;
  /** How-to line, shown with the context above the first goal. */
  guidance?: string;
  /** Workbook (handbook) section the goal sentences show under ("My goals", Final column Z). */
  handbookLabel?: string;
  orderFrom: string;
  skipRankItemIds: readonly string[];
  goals: readonly LaunchpadGoalLoopGoal[];
};

/** One preset cost row. `serviceIds` ties starter gear or restock to offer picks. */
export type LaunchpadCostItem = {
  id: string;
  label: string;
  /** Start-up: whole dollars. Ongoing restock: dollars, cents allowed. */
  amount: number;
  /** Offer option ids this row belongs to. Marketing rows omit this. */
  serviceIds?: readonly string[];
};

/** Restock presets for one service the learner can offer. */
export type LaunchpadCostServicePreset = {
  serviceId: string;
  items: readonly LaunchpadCostItem[];
};

/**
 * Know your cost (Pricing). One task screen that runs the costs hub, the
 * start-up list, the per-service restock sheets, an optional totals check,
 * and the workbook page. The learner's lines live in a "costs" answer.
 */
export type LaunchpadKnowYourCostScreen = TaskScreenBase & {
  type: "know-your-cost";
  answerKey: string;
  /** Selection answer of the services chosen earlier (the offer picks). */
  servicesFrom: string;
  /** Slim totals screen. Set false to skip it; the hub Continue goes to the workbook. */
  showTotals: boolean;
  /** Why this catalog is provisional. Not shown on screen. */
  sourceNote: string;
  copy: {
    hubIntro: string;
    startupCard: string;
    ongoingCard: string;
    startupIntro: string;
    marketingLabel: string;
    starterLabel: string;
    starterNote: string;
    ongoingIntro: string;
    /** The service name is the screen title, so this line does not say "one {service} job". */
    serviceIntro: string;
    totalsIntro: string;
    grandNote: string;
    workbookHint: string;
    hubWait: string;
  };
  marketing: readonly LaunchpadCostItem[];
  starterGear: readonly LaunchpadCostItem[];
  ongoing: readonly LaunchpadCostServicePreset[];
};

/**
 * Set the price (Pricing). One card per offered service. Keep is price minus
 * cost per job. No charity share is stored or shown on the breakdown.
 */
export type LaunchpadSetPriceScreen = TaskScreenBase & {
  type: "set-price";
  answerKey: string;
  /** Costs answer (per-service job total). */
  costsFrom: string;
  /** Offer picks. One card per chosen service. */
  servicesFrom: string;
  copy: {
    context: string;
    guidance: string;
    othersMissing: string;
    keepLabel: string;
    costLabel: string;
    lowKeep: string;
    emptyServices: string;
  };
};

/** One jobs-per-week choice on the single-service path (1 through 7). */
export type LaunchpadJobsWeekOption = {
  id: string;
  jobs: number;
  label: string;
};

/**
 * Work out how many jobs cover start-up. One priced service: jobs, then a
 * week pick. Two or more: a typical week and weekly keep.
 */
export type LaunchpadJobsCoverScreen = TaskScreenBase & {
  type: "jobs-to-cover";
  answerKey: string;
  costsFrom: string;
  /** Price answer (kept per job, per service). */
  priceFrom: string;
  weekOptions: readonly LaunchpadJobsWeekOption[];
  copy: {
    context: string;
    guidance: string;
    singlePrompt: string;
    multiPrompt: string;
    covered: string;
    needPrice: string;
    weeklyLabel: string;
    startupLabel: string;
    weeksLabel: string;
  };
};

export type LaunchpadChip = { id: string; label: string };

export type LaunchpadServiceCatalog = {
  serviceId: string;
  packages: readonly LaunchpadChip[];
  extras: readonly LaunchpadChip[];
};

/** Row 15: one page per offered service, then one When page. */
export type LaunchpadOfferLoopScreen = TaskScreenBase & {
  type: "offer-loop";
  answerKey: string;
  servicesFrom: string;
  times: readonly LaunchpadChip[];
  catalogs: readonly LaunchpadServiceCatalog[];
  copy: {
    serviceIntro: string;
    whenTitle: string;
    whenIntro: string;
    whenNote: string;
    /** "I am available {when}." */
    whenSummary: string;
    packagesHeading: string;
    extrasHeading: string;
    packagesHint: string;
    extrasHint: string;
    addPackage: string;
    addExtra: string;
    addTime: string;
  };
};

/** Row 16: number, yes/no, and interest chips, then the times table. */
export type LaunchpadCustomerScreen = TaskScreenBase & {
  type: "customer-check";
  answerKey: string;
  offerFrom: string;
  servicesFrom: string;
  times: readonly LaunchpadChip[];
  /** Shown in the sentence. {product} has no defined lookup. */
  productPhrase: string;
  title: string;
  /** "From what you offer". */
  sectionHeading: string;
  /** Tokens: {number}, {product}, {yesNo}. */
  sentence: string;
  yesLabel: string;
  noLabel: string;
  timesTitle: string;
  timesHint: string;
  addTime: string;
  copy: { intro: string; addInterest: string };
};

/** Row 17: one competitor check, then add-ons and one different idea. */
export type LaunchpadCompetitorScreen = TaskScreenBase & {
  type: "competitor-check";
  answerKey: string;
  offerFrom: string;
  servicesFrom: string;
  addons: readonly LaunchpadChip[];
  ideas: readonly LaunchpadChip[];
  copy: {
    pricesIntro: string;
    extrasIntro: string;
    addJob: string;
    addExtra: string;
    ideaTitle: string;
    ideaHint: string;
    elseHint: string;
  };
};

/** Rows 28-33. One step per door. Copy lives on the screen, not in the component. */
export type GettingReadyStep = "find" | "agree" | "deliver" | "wrap-job" | "practice" | "polish";

export type ReadyOption = { id: string; label: string; sentence?: string };

export type ReadyAgreeSection = {
  id: "collect_info" | "confirm_dog" | "when_where" | "cost_payment" | "plans_change";
  title: string;
  lead: string;
  bullets: readonly string[];
  moreLead?: string;
  moreBullets?: readonly string[];
};

export type ReadyAgreePage = {
  sectionIds: readonly ReadyAgreeSection["id"][];
  question?: string;
  showNote?: boolean;
};

export type LaunchpadGettingReadyScreen = TaskScreenBase & {
  type: "getting-ready";
  step: GettingReadyStep;
  answerKey: string;
  title: string;
  question?: string;
  hint?: string;
  readLabel?: string;
  note?: string;
  noteStrong?: string;
  alsoLabel?: string;
  channels?: readonly ReadyOption[];
  agreeSections?: readonly ReadyAgreeSection[];
  agreePages?: readonly ReadyAgreePage[];
  deliverBlocks?: readonly { heading: string; lead: string; slot: "before" | "after" }[];
  beforeOptions?: readonly ReadyOption[];
  afterOptions?: readonly ReadyOption[];
  payment?: { heading: string; lead: string; options: readonly ReadyOption[] };
  feedback?: { heading: string; lead: string; options: readonly ReadyOption[] };
  /** Tokens {payment} and {feedback}. */
  summaryBoth?: string;
  summaryPayment?: string;
  summaryFeedback?: string;
  practiceWho?: readonly ReadyOption[];
  practiceWhen?: readonly ReadyOption[];
  practiceWhoLead?: string;
  practiceServiceLead?: string;
  practiceWhenLead?: string;
  practicePlayback?: string;
  polishQuestions?: readonly { id: string; prompt: string }[];
  polishResults?: readonly ReadyOption[];
  polishSuggestion?: string;
  eyebrow?: string;
};

/** Row 26. Own cash confirms. Borrow sets a payback plan. No lender. */
export type LaunchpadFundingScreen = TaskScreenBase & {
  type: "funding-start";
  answerKey: string;
  costsFrom: string;
  copy: {
    context: string;
    guidance: string;
    prompt: string;
    ownCash: string;
    borrow: string;
    ownCashConfirm: string;
    paybackTitle: string;
    fixedMode: string;
    fixedHelp: string;
    weeklyMode: string;
    weeklyHelp: string;
    fixedShow: string;
    weeklyShow: string;
    disclaimer: string;
    missing: string;
    missingAction: string;
  };
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
  | LaunchpadGoalLoopScreen
  | LaunchpadKnowYourCostScreen
  | LaunchpadSetPriceScreen
  | LaunchpadJobsCoverScreen
  | LaunchpadOfferLoopScreen
  | LaunchpadCustomerScreen
  | LaunchpadCompetitorScreen
  | LaunchpadFundingScreen
  | LaunchpadGettingReadyScreen;

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
  /** The compiled vision sentence (tracker H19), shown on the wrap-up and the workbook cover. */
  vision?: LaunchpadVisionSpec;
};

/**
 * Tracker H19: a template with {tokens} and [[optional clauses]], filled from
 * saved Level 1 answers. The label wording is open with Cath ("Our vision").
 */
export type LaunchpadVisionSpec = {
  label: string;
  template: string;
  /** {business-type}: the venture noun, lower case. */
  businessType: string;
  offerKey: string;
  whyKey: string;
  causeKey: string;
  /** The Support a cause goal and its percent field ({cause-percent}). */
  causeGoalKey: string;
  causePercentField: string;
  /** The Set your goals loop ({goal-list}). */
  goalLoopId: string;
  /** Grey text until the sentence can be filled. */
  placeholder: string;
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
  /**
   * The learner may leave this task open ("Come back to this later") and move
   * on: the next task unlocks, but the silver's wrap-up stays blocked until it
   * is finished. Defaults to false.
   */
  canComeBackLater?: boolean;
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
