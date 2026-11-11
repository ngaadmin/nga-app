/**
 * Resolves the dog walking tracker rows (L1 and L2) into the load file.
 *
 * Each tracker row is matched by level, silver label and bronze label (row
 * numbers may move). Copy (context, guidance, question, options, items,
 * titles, button labels) is read from the cells; this file supplies only what
 * the cells leave implicit: ids, answer keys, field names, types, limits and
 * cross-task references. Every default that is not in the sheet is listed in
 * DECISIONS and flagged on the rows it touches.
 */
import type {
  LaunchpadVisionSpec,
  LaunchpadChoiceCaptureScreen,
  LaunchpadGoalLoopGoal,
  LaunchpadGoalLoopScreen,
  LaunchpadRankOrderScreen,
  LaunchpadSentencePart,
  LaunchpadShortTextScreen,
  LaunchpadSummarySection,
  LaunchpadSummaryWrapUp,
  LaunchpadTaskScreen,
  LaunchpadTextField,
} from "@/lib/launchpad/content/types";
import { IDENTITY_ANSWER_KEY } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { kebab, optionsAfter, parseSentence, sentenceCase } from "@/lib/launchpad/load/sentence";
import { trackerLabel, type TrackerInputType, type TrackerIssue, type TrackerRead, type TrackerRow } from "@/lib/launchpad/load/read-tracker";
import {
  LAUNCHPAD_LOAD_VERSION,
  type LaunchpadLoadFile,
  type LoadAnswerField,
  type LoadAnswerSpec,
  type LoadBronze,
  type LoadDecision,
  type LoadFeed,
  type LoadLevel,
  type LoadSilver,
  type LoadRowMeta,
  type LoadScreen,
} from "@/lib/launchpad/load/types";

export const DOG_WALKING_VENTURE_ID = "dog-walking";
/** {product} in sentences (decision D5). */
export const DOG_WALKING_NOUN = "dog walking service";
/** {business-type} in the vision sentence (I19 example: "a dog walking business"). */
export const DOG_WALKING_BUSINESS_TYPE = "dog walking";

/** Limits that the sheet does not give (decisions D2, D14, D16). */
export const LIMITS = {
  moneyMax: 9_999_999,
  timeframeMax: 99,
  goalTextMax: 120,
  /** V6: what the money goal is saving for. */
  savingForMax: 60,
  /** V7: Help others customer count. */
  customerCountMax: 99,
  otherGoalTextMax: 120,
  paragraphTextMax: 200,
  shortParagraphTextMax: 120,
  peopleAskedMax: 99,
} as const;

/** Answer keys (one per capture screen). */
export const KEYS = {
  offer: "l1-offer",
  why: "l1-why",
  cause: "l1-cause",
  goal: (item: string) => `l1-goal-${item}`,
  otherGoal: "l1-goal-other",
  sell: "l2-sell",
  demand: "l2-demand",
} as const;

/** Why items Cath retired (4 Nov, D3); the reader drops them from the tracker's list. */
export const RETIRED_WHY_ITEM_IDS: readonly string[] = ["prove-i-can-do-it"];

export const DECISIONS: LoadDecision[] = [
  { id: "D1", topic: "Level 1 silvers", applied: "Superseded by D26: three L1 silvers from Final rows 2–14 (Define the business, Set your goals, The Brand). Kept for history.", status: "decided-cath", rows: [2, 3, 4, 5, 11, 12] },
  { id: "D2", topic: "Money cap", applied: "Amount is a whole number, 7 digits (1 to 9,999,999). K5 still says 1 billion cap.", status: "default-pending-cath", rows: [5, 6] },
  { id: "D3", topic: "Why items", applied: "Per Cath's 4 Nov calls, Find the why ranks four items: Make money, Help others, Learn new skills, Be my own boss (Support a cause removed 8:44pm). The reader drops the retired item if the sheet still lists it, so every ranked item has a goal row.", status: "decided-cath", rows: [3, 5] },
  { id: "D4", topic: "What I am selling display", applied: "The row 14 service description shows as plain text in the wrap-up and handbook. I14/I16 say bullet list.", status: "default-pending-cath", rows: [14, 16] },
  { id: "D24", topic: "Vision sentence", applied: `H19 template filled from saved answers (I19). {business-type} is "${DOG_WALKING_BUSINESS_TYPE}" (I19 example). {goal-list} leaves out the Support a cause goal, which the [[ ]] clause covers (I19 example). Label "Our vision" by default; mission vs vision and cover page vs lift preview are open with Cath.`, status: "default-pending-cath", rows: [19] },
  { id: "D5", topic: "{product}", applied: `Filled from the venture noun: "${DOG_WALKING_NOUN}".`, status: "default-pending-cath", rows: [15] },
  { id: "D6", topic: "[Yes/No]", applied: "A two-option choice (Yes, No) shown as an inline dropdown in the sentence.", status: "default-pending-cath", rows: [15] },
  { id: "D7", topic: "Wrap-up button", applied: "Cath 4 Nov 9:59pm: Continue (compact navy button; was Confirm and continue, tracker I12/I16)", status: "decided-cath", rows: [12, 16] },
  { id: "D8", topic: "Wrap-up editing", applied: "Per Cath's 4 Nov correction: a wrap-up value is edited in place (pencil on its section) only when that does not rewire logic owned by another screen; the rest stays read-only. No navigating back to earlier screens. See wrapup-edit-calls.md.", status: "decided-cath", rows: [12, 16] },
  { id: "D9", topic: "Level 2 gold", applied: "No L2 gold row in the sheet; the seed gold (Readiness to make) stays and there is no L2 gold screen.", status: "default-pending-cath", rows: [] },
  { id: "D10", topic: "K15 interest level", applied: "Ignored. Row 15 captures number asked, Yes/No and the specific interest only. K15 still says the payload lists interest level.", status: "pending-cath", rows: [15] },
  { id: "D11", topic: "Support a cause goal position", applied: "Support a cause is no longer a Find the why reason (Cath, 4 Nov 8:44pm). Its goal comes from the Know your impact pick: always shown after the ranked goals (K4, E10) and never skipped by the ranking. Like every shown goal it must be filled in (D23).", status: "build-assumption", rows: [3, 4, 10] },
  { id: "D12", topic: "Struck reasons", applied: "A reason marked not applicable in Find the why gets no goal page.", status: "build-assumption", rows: [3, 5] },
  { id: "D23", topic: "Goal not applicable", applied: "Per Cath (4 Nov 8:49pm), goal pages have no Not applicable chip: a goal is dropped only in the Find the why ranking, and every goal shown must be filled in, except Add another goal, which stays optional. The sheet's goal rows (I5, I10, X6 to X10) still mention not applicable.", status: "decided-cath", rows: [5, 6, 7, 8, 10] },
  { id: "D13", topic: "Text caps", applied: `Goal text up to ${LIMITS.goalTextMax} characters, the added goal ${LIMITS.otherGoalTextMax}, the service description ${LIMITS.paragraphTextMax}, availability and specific interest ${LIMITS.shortParagraphTextMax}.`, status: "build-assumption", rows: [7, 8, 11, 14, 15] },
  { id: "D14", topic: "Minimum picks", applied: "Pick what kind of business you'll run needs at least one pick before Next.", status: "build-assumption", rows: [2] },
  { id: "D15", topic: "Number caps", applied: `Timeframe number 1 to ${LIMITS.timeframeMax}, in weeks or months (Cath, 4 Nov; the sheet's goal cells now say weeks/months); Help others has the timeframe again (Cath, 5 Nov 5:20pm; I7/J7/V7 updated in the sheet); people asked 1 to ${LIMITS.peopleAskedMax} (optional on the added goal, which has no number); donate percent 1 to 100 (sheet).`, status: "build-assumption", rows: [6, 7, 8, 11, 15] },
  { id: "D16", topic: "Ranking control", applied: "AC3 (Cath, 5 Nov): drag and drop replaces the up and down arrows. Drag a reason by its grip (mouse or touch) to reorder it or move it below the line; with the keyboard, focus a reason and use the up and down arrow keys. G3 \u201cDrag the reasons into order\u201d is shown as written.", status: "decided-cath", rows: [3] },
  { id: "D17", topic: "Be my own boss check-in", applied: "The six-month check-in in I9 is not built.", status: "build-assumption", rows: [9] },
  { id: "D18", topic: "Wrap-up copy and art", applied: "Wrap-up heading and body are build copy (H is N/A); the picture is a placeholder frame.", status: "build-assumption", rows: [12, 16] },
  { id: "D19", topic: "Identity handbook sections", applied: "Our vision lists the offer picks (row 2); What we sell (row 14) is left off the identity page since identity moved to Level 1 (D25) and shows on the Level 2 page. A section with no answer is hidden.", status: "build-assumption", rows: [19] },
  { id: "D20", topic: "Identity titles", applied: "Superseded by D27: The Brand (l1-s3) uses Name the business then Design the logo (Revised order). Seed titles stay Design your logo / Name your business for the locked picker copy.", status: "build-assumption", rows: [12, 13, 14] },
  { id: "D21", topic: "One screen per bronze", applied: "Per Cath's 4 Nov call, each L1 and L2 capture bronze opens on one screen: context, then guidance, then the question with its options or inputs, then the button. No context-only page; Set your goals shows its context and guidance above the first goal on step 1 (Cath, 4 Nov 8:45pm), then one goal per step.", status: "decided-cath", rows: [2, 3, 4, 5, 14, 15] },
  { id: "D25", topic: "Identity in Level 1", applied: "Superseded by D26/D27: The Brand is l1-s3 after Set your goals (l1-s2). Answer key stays l2-s2-identity; seedSilverId stays l2-s2.", status: "decided-cath", rows: [12, 13, 14] },
  { id: "D22", topic: "Come back later", applied: `Sample, pending tracker column: the tracker has no "Come back later" column yet, so a TEST override turns it on for Set your goals (row 5 → task l1-s2-b1-t1) and Find out if people want it (row 15). Every other task defaults to No. Once the column exists, the tracker wins and the override stops applying.`, status: "sample-pending-tracker-column", rows: [5, 15] },
  { id: "D26", topic: "Module 1 three silvers + floors 1–6", applied: "Cath 5 Nov: Module 1 = Final rows 2–14 as three silvers (Define the business; Set your goals; The Brand). Handbook column (AB) is TEST validation only — never built. Building wires levels 1–6 (Vision and Goals, Planning, Getting Ready, Sales, Delivery, Growing). Level 7 Budgeting is the rooftop (future, not a floor). L2 keeps current Decide what to sell + demand screens working; Pricing and L3–6 are structure/placeholder doors with Final titles (Revised order where Final D/E say so).", status: "decided-cath", rows: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] },
  { id: "D27", topic: "The Brand logo-then-name", applied: "AC13 (Cath, 5 Nov): Design the logo comes first and Name the business second, so the name color can use the logo color. The sheet's D12/D13/E12/E13 still say name first; AC13 wins. Bronze ids keep their seed numbers (logo l1-s3-b2, name l1-s3-b1) so saved answers stay put; only the order changes. Answer key l2-s2-identity unchanged.", status: "decided-cath", rows: [12, 13] },
  { id: "D28", topic: "Level outcome statements", applied: "Storybird DRAFT outcomes (5 Nov) live in service-level-outcomes.ts as swappable data (SERVICE_LEVEL_OUTCOMES_DRAFT) feeding floor.gold.title. Not yet approved by Cath. Module 4 name is Sales. Delivery has a real draft (not a placeholder string).", status: "default-pending-cath", rows: [] },
  { id: "D29", topic: "Offer option Dog sitting", applied: "Final Option 3 is Dog sitting (was Bookings in an older tracker layout). Loader reads Option N columns from the Final sheet.", status: "decided-cath", rows: [2] },
  { id: "D30", topic: "No silver wrap-ups", applied: "AC14 / J11 (Cath, 5 Nov): no silver wrap-up screens. After a silver's last step (except a level's last silver) the flow goes straight back to the corridor (no end screen; Cath, 5 Nov 5:19pm) and a small workbook icon button pops in (Open your workbook); after a level's last silver the lift shows Congratulations. The wrap-up data stays only to fill the handbook pages (cover, Define the business, Set your goals, The Brand, Level 2).", status: "decided-cath", rows: [11, 14] },
  { id: "D31", topic: "Goal dropdowns", applied: "AC5 / J7 / J8: Help others picks one customer benefit from N7 to Q7 (four sheet options, none invented); Learn new skills picks one skill from N8 to R8 (text before the bar) and prefills the success line (text after the bar), which swaps on a new pick until the learner types their own. Options keep the sheet's lower case because they sit mid-sentence.", status: "decided-cath", rows: [7, 8] },
];

/**
 * TEST OVERRIDE (D22, sample, pending tracker column): tasks that allow
 * "Come back to this later" while the tracker has no "Come back later"
 * column. Remove once Cath adds the column.
 */
export const TEST_COME_BACK_LATER_TASK_IDS: readonly string[] = ["l1-s2-b1-t1", "l2-s1-b2-t1"];

/**
 * Sets canComeBackLater on each task from its source row's "Come back later"
 * cell (No when blank). With no such column anywhere, the D22 test override
 * applies instead and its tasks carry the D22 flag.
 */
function applyComeBackLater(levels: LoadLevel[], rows: readonly TrackerRow[]) {
  const byRow = new Map(rows.map((r) => [r.row, r]));
  const hasColumn = rows.some((r) => r.comeBackLater !== undefined);
  for (const l of levels)
    for (const s of l.silvers)
      for (const b of s.bronzes)
        for (const t of b.tasks) {
          const first = t.screens[0];
          const fromSheet = first ? byRow.get(first.sourceRow)?.comeBackLater : undefined;
          const override = !hasColumn && TEST_COME_BACK_LATER_TASK_IDS.includes(t.id);
          t.canComeBackLater = override || (fromSheet ?? false);
          if (override && first && !first.flags.includes("D22")) first.flags.push("D22");
        }
}

/* ------------------------------------------------------------ helpers */

type Ctx = { issues: TrackerIssue[] };

function issue(ctx: Ctx, row: number, reason: string) {
  ctx.issues.push({ sheet: "Bronze Task Tracker", row, reason });
}

function find(rows: readonly TrackerRow[], level: number, silver: string, bronze: string | RegExp): TrackerRow | undefined {
  return rows.find(
    (r) =>
      r.level === level &&
      trackerLabel(r.silver) === silver &&
      (typeof bronze === "string" ? trackerLabel(r.bronze) === bronze : bronze.test(trackerLabel(r.bronze))),
  );
}

function need(ctx: Ctx, rows: readonly TrackerRow[], level: number, silver: string, bronze: string | RegExp): TrackerRow {
  const r = find(rows, level, silver, bronze);
  if (!r) {
    issue(ctx, 0, `No row for level ${level} / ${silver} / ${String(bronze)}.`);
    return { row: 0, level, levelName: "", silver, bronze: String(bronze), payloadVersion: "", task: "", context: "", guidance: "", question: "", dataInput: "", template: "", notes: "" };
  }
  return r;
}

const opts = (labels: readonly string[]) => labels.map((l) => ({ id: kebab(l), label: sentenceCase(l) }));

/** Option labels: the structured Options column when filled, else parsed from the Data Input sentence. */
const rowOptions = (row: TrackerRow, parse: () => string[]) => opts(row.options?.length ? row.options : parse());

/**
 * The structured Input type column, when filled, must be one the reader can
 * build for this row (each row's screen shape is fixed); anything else is an issue.
 */
function expectInput(ctx: Ctx, row: TrackerRow, allowed: readonly TrackerInputType[]): void {
  if (row.inputType && !allowed.includes(row.inputType)) {
    issue(ctx, row.row, `Input type "${row.inputType}" is not supported for this row; use ${allowed.join(" or ")}.`);
  }
}

function meta(row: TrackerRow, m: Partial<LoadRowMeta> & Pick<LoadRowMeta, "screenId" | "index" | "template">): LoadRowMeta {
  return { sourceRow: row.row, validation: [], feeds: [], feedsInto: [], flags: [], ...m };
}


/** Section labels in a wrap-up Data Input cell ("Sections: A (from X); B, in rank order (...)."). */
export function sectionLabels(cell: string): string[] {
  const m = /Sections:\s*([\s\S]*?)\.\s+Each section/.exec(cell);
  if (!m) return [];
  return m[1]!
    .split(/;\s*/)
    .map((s) => s.split(" (")[0]!.split(",")[0]!.trim())
    .filter(Boolean);
}

/** Short placeholder that fits the inline timeframe box (Cath, 4 Nov 8:48pm: "[num" was clipped). */
const TIMEFRAME_HINT = `1–${LIMITS.timeframeMax}`;

/** Timeframe fields used by every timed goal: a number plus weeks or months (Cath, 4 Nov 7:58pm and 8:47pm). */
function timeframeFields(optional = false): LaunchpadTextField[] {
  return [
    { name: "timeframeNumber", input: "integer", label: "Number", hint: TIMEFRAME_HINT, min: 1, max: LIMITS.timeframeMax, ...(optional ? { optional } : {}) },
    {
      name: "timeframeUnit",
      input: "choice",
      label: "Weeks or months",
      options: [
        { id: "weeks", label: "weeks" },
        { id: "months", label: "months" },
      ],
      // AC5 / J5: pre-set to weeks, never a blank "choose"; the learner can switch to months.
      defaultValue: "weeks",
      ...(optional ? { optional } : {}),
    },
  ];
}

/**
 * Builds sentence parts from a Question cell. `slots` maps each slot in
 * order to a field name, a carried answer, or a skin token.
 */
type SlotUse = { field: string } | { carried: string; label: string } | { token: "product" };

function sentenceParts(ctx: Ctx, row: TrackerRow, cell: string, slots: readonly SlotUse[]): { prompt?: string; parts: LaunchpadSentencePart[] } {
  const parsed = parseSentence(cell);
  if (parsed.slots.length !== slots.length) issue(ctx, row.row, `Question has ${parsed.slots.length} blanks; expected ${slots.length}.`);
  const parts: LaunchpadSentencePart[] = [];
  const pushText = (t: string) => {
    const last = parts[parts.length - 1];
    if (last?.kind === "text") parts[parts.length - 1] = { kind: "text", text: last.text + t };
    else if (t) parts.push({ kind: "text", text: t });
  };
  for (const tok of parsed.tokens) {
    if (tok.kind === "text") {
      pushText(tok.text);
      continue;
    }
    const use = slots[tok.index];
    if (!use) continue;
    if ("field" in use) parts.push({ kind: "field", field: use.field });
    else if ("carried" in use) parts.push({ kind: "carried", answerKey: use.carried, label: use.label });
    else pushText(DOG_WALKING_NOUN);
  }
  return { ...(parsed.prompt ? { prompt: parsed.prompt } : {}), parts };
}

/** Slot hints from the sheet ("___ [number]" -> "number"). */
function slotHints(cell: string): (string | undefined)[] {
  return parseSentence(cell).slots.map((s) => (s.kind === "blank" ? s.hint : s.kind === "bracket" ? s.label : undefined));
}

function fieldSpecs(fields: readonly LaunchpadTextField[]): { fields: LoadAnswerField[]; validation: string[] } {
  const out: LoadAnswerField[] = [];
  const validation: string[] = [];
  for (const f of fields) {
    let limits: string | undefined;
    if (f.input === "text") limits = `up to ${f.maxLength} characters`;
    if (f.input === "integer") limits = `whole number ${f.min!.toLocaleString("en-US")} to ${f.max!.toLocaleString("en-US")}`;
    if (f.input === "currency") limits = "Parent Hub currency (10 codes, USD default), read-only";
    if (f.input === "choice") limits = `one of ${f.options!.map((o) => o.id).join(" | ")}`;
    out.push({ name: f.name, type: f.input, required: !f.optional, ...(limits ? { limits } : {}) });
    if (limits) validation.push(`${f.name}: ${limits}${f.optional ? " (optional)" : ""}`);
  }
  return { fields: out, validation };
}

function fieldsAnswer(key: string, fields: readonly LaunchpadTextField[], extra: LoadAnswerField[] = []): LoadAnswerSpec {
  return { answerKey: key, kind: "fields", version: 1, fields: [...fieldSpecs(fields).fields, ...extra] };
}

const NOT_APPLICABLE = "Not applicable";

/**
 * D21: puts a row's context and guidance on its capture screen (shown above
 * the question), so the bronze opens on one screen with no context-only page.
 */
function withIntro(row: TrackerRow, s: LoadScreen): LoadScreen {
  const p = s.payload;
  if (!p || (p.type !== "choice-capture" && p.type !== "rank-order" && p.type !== "short-text")) return s;
  const intro = { ...(row.context ? { context: row.context } : {}), ...(row.guidance ? { guidance: row.guidance } : {}) };
  const payload: LaunchpadTaskScreen = { ...p, ...intro };
  return { ...s, ...intro, index: "1", payload };
}

/* ------------------------------------------------------------ level 1 */

function level1(ctx: Ctx, rows: readonly TrackerRow[]): LoadLevel {
  const S_DEFINE = "Define the business";
  const S_GOALS = "Set your goals";
  const rOffer = need(ctx, rows, 1, S_DEFINE, /Pick what kind of business you.ll run|Pick what your business will offer/);
  const rWhy = need(ctx, rows, 1, S_DEFINE, "Find the why");
  const rCause = need(ctx, rows, 1, S_DEFINE, "Know your impact");
  const rSeq = need(ctx, rows, 1, S_GOALS, /^Set your goals \(sequence\)$/);
  const rOther = need(ctx, rows, 1, S_GOALS, /^Add another goal/);

  // Bronze 1: offer (multi-select capture).
  expectInput(ctx, rOffer, ["multi-choice"]);
  const offerOptions = rowOptions(rOffer, () => optionsAfter(rOffer.dataInput, /not the payload:\s*/));
  if (offerOptions.length < 2) issue(ctx, rOffer.row, "Could not read the offer options.");
  const b1 = "l1-s1-b1";
  const offerScreen: LaunchpadChoiceCaptureScreen = {
    id: `${b1}-t1-s2`,
    type: "choice-capture",
    mode: "multi",
    answerKey: KEYS.offer,
    prompt: rOffer.question,
    options: offerOptions,
    ...(rOffer.workbookSection ? { handbookLabel: rOffer.workbookSection } : {}),
  };

  // Bronze 2: why (rank-order with not applicable).
  // D3: the retired why item is dropped even if the sheet still lists it.
  expectInput(ctx, rWhy, ["rank"]);
  const whyItems = rowOptions(rWhy, () => optionsAfter(rWhy.dataInput, /Items \([^)]*\):\s*/)).filter((i) => !RETIRED_WHY_ITEM_IDS.includes(i.id));
  if (whyItems.length !== 4) issue(ctx, rWhy.row, `Expected four why items, read ${whyItems.length}.`);
  // The quoted toggle name, e.g. 'not applicable' (an apostrophe in "doesn't" is not a quote).
  const naLabel = sentenceCase(/(?:^|\s)'([^']+)'/.exec(rWhy.guidance)?.[1] ?? NOT_APPLICABLE);
  // D16: drag and drop (AC3), so G3's "Drag the reasons into order" shows as written.
  const whyRow: TrackerRow = rWhy;
  const b2 = "l1-s1-b2";
  const whyScreen: LaunchpadRankOrderScreen = {
    id: `${b2}-t1-s2`,
    type: "rank-order",
    answerKey: KEYS.why,
    prompt: rWhy.question,
    items: whyItems,
    notApplicableLabel: naLabel,
    belowTitle: "Doesn't apply to me",
    belowHint: "Drag any reason that doesn't apply to you here. This is optional.",
    ...(rWhy.workbookSection ? { handbookLabel: rWhy.workbookSection } : {}),
  };

  // Bronze 3: cause (single select).
  expectInput(ctx, rCause, ["single-choice"]);
  const causeOptions = rowOptions(rCause, () => optionsAfter(rCause.dataInput, /Options:\s*/));
  const b3 = "l1-s1-b3";
  const causeScreen: LaunchpadChoiceCaptureScreen = {
    id: `${b3}-t1-s2`,
    type: "choice-capture",
    mode: "single",
    answerKey: KEYS.cause,
    prompt: rCause.question,
    options: causeOptions,
    ...(rCause.workbookSection ? { handbookLabel: rCause.workbookSection } : {}),
  };

  // Bronze 4: the goal loop.
  const b4 = "l1-s2-b1";
  const loopId = `${b4}-t1-s2`;
  const goalRows = rows.filter((r) => r.level === 1 && /^\d+[a-z] Set your goals: /.test(r.bronze.trim()));
  const goals: LaunchpadGoalLoopGoal[] = [];
  const goalMetas: LoadScreen[] = [];
  const itemFor = (title: string) => whyItems.find((i) => i.label.toLowerCase() === title.toLowerCase())?.id;
  goalRows.forEach((row) => {
    const title = trackerLabel(row.bronze).replace(/^Set your goals:\s*/, "").replace(/\s*\(.*\)$/, "");
    // D11: the Support a cause goal is driven by the Know your impact pick, not by a why item.
    const causeGoal = /Know your impact/i.test(row.bronze);
    const whyItem = itemFor(title);
    const item = whyItem ?? (causeGoal ? kebab(title) : undefined);
    if (!item) {
      issue(ctx, row.row, `Goal "${title}" matches no Find the why item.`);
      return;
    }
    const key = KEYS.goal(item);
    const sid = `${b4}-t1-goal-${item}`;
    const flags: string[] = whyItem ? ["D12", "D23"] : ["D23"];
    const feeds: LoadFeed[] = whyItem ? [{ answerKey: KEYS.why, use: "goal order and not-applicable skip" }] : [];
    let screen: LaunchpadShortTextScreen | LaunchpadChoiceCaptureScreen;
    let answer: LoadAnswerSpec;
    let validation: string[] = [];
    let options: { id: string; label: string }[] | undefined;
    // Row 8 ends with a worked example for the writer ("\n\nExample: ..."); only the sentence is built.
    const question = row.question.replace(/\s*Example:[\s\S]*$/, "").trim();
    const hints = slotHints(question);
    expectInput(ctx, row, ["single-choice", "fill-in"]);
    // The Input type column wins; without it a "Single select:" Data Input makes a choice goal.
    if (row.inputType ? row.inputType === "single-choice" : /^Single select:/.test(row.dataInput)) {
      options = rowOptions(row, () => optionsAfter(row.dataInput, /Single select:\s*/));
      screen = {
        id: sid,
        type: "choice-capture",
        mode: "single",
        answerKey: key,
        heading: title,
        prompt: row.question,
        options,
        summaryLabel: "My top reason to be my own boss",
      };
      answer = { answerKey: key, kind: "selection", version: 1, fields: [{ name: "selected", type: "option id", required: true, limits: "exactly one" }] };
      validation = ["exactly one pick"];
      flags.push("D17");
    } else {
      let fields: LaunchpadTextField[];
      let slots: SlotUse[];
      let position: "ranked" | "after-ranked" = "ranked";
      if (item === "make-money") {
        // I6/V6: amount, currency, timeframe, then what they're saving for (free text, max 60, required).
        fields = [
          { name: "amount", input: "integer", label: "Amount", hint: hints[0], min: 1, max: LIMITS.moneyMax },
          { name: "currency", input: "currency", label: "Currency" },
          ...timeframeFields(),
          { name: "savingFor", input: "text", label: "Saving for", hint: hints[4], maxLength: LIMITS.savingForMax },
        ];
        slots = [{ field: "amount" }, { field: "currency" }, { field: "timeframeNumber" }, { field: "timeframeUnit" }, { field: "savingFor" }];
        flags.push("D2", "D15");
      } else if (causeGoal) {
        fields = [{ name: "donatePercent", input: "integer", label: "Percent", hint: hints[0], min: 1, max: 100 }];
        slots = [{ field: "donatePercent" }, { carried: KEYS.cause, label: "cause area" }];
        feeds.push({ answerKey: KEYS.cause, use: "cause area carried into the sentence" });
        flags.push("D11");
        position = "after-ranked";
      } else if (item === "help-others") {
        // I7/V7: customer count 1–99 + one benefit from N7–Q7 (lower case, it sits mid-sentence), then the
        // timeframe (number 1–99 + weeks|months, weeks preset; Cath, 5 Nov 5:20pm: timeframe back in).
        const benefits = (row.options ?? []).map((o) => ({ id: kebab(o), label: o.trim() }));
        if (benefits.length < 2) issue(ctx, row.row, "Help others has no benefit options (N7 to Q7).");
        fields = [
          { name: "customerCount", input: "integer", label: "Number of customers", hint: hints[0], min: 1, max: LIMITS.customerCountMax },
          { name: "benefit", input: "choice", label: "What your customers get", hint: "pick one", options: benefits },
          ...timeframeFields(),
        ];
        slots = [{ field: "customerCount" }, { field: "benefit" }, { field: "timeframeNumber" }, { field: "timeframeUnit" }];
        flags.push("D15", "D31");
      } else if (item === "learn-new-skills") {
        // I8/J8/V8: skill pick (text before the bar in N8–R8), success line prefilled from the text after the bar, then the timeframe.
        const skills = (row.options ?? []).map((o) => {
          const [label, line] = o.split("|").map((p) => p.trim());
          if (!label || !line) issue(ctx, row.row, `Skill option "${o}" is not "skill | success line".`);
          return { id: kebab(label ?? o), label: label ?? o, ...(line ? { prefill: line } : {}) };
        });
        if (skills.length < 2) issue(ctx, row.row, "Learn new skills has no skill options (N8 to R8).");
        fields = [
          { name: "skill", input: "choice", label: "Skill", hint: "pick one", options: skills, prefills: "achievement" },
          { name: "achievement", input: "text", label: "I'll know I've done it when I can", hint: "pick a skill first", maxLength: LIMITS.goalTextMax, multiline: true },
          ...timeframeFields(),
        ];
        slots = [{ field: "skill" }, { field: "achievement" }, { field: "timeframeNumber" }, { field: "timeframeUnit" }];
        flags.push("D13", "D15", "D31");
      } else {
        const name = kebab(title).replace(/-./g, (m) => m[1]!.toUpperCase());
        const timed = hints.length > 1;
        fields = [{ name, input: "text", label: sentenceCase(hints[0] ?? name), hint: hints[0], maxLength: LIMITS.goalTextMax }, ...(timed ? timeframeFields() : [])];
        slots = timed ? [{ field: name }, { field: "timeframeNumber" }, { field: "timeframeUnit" }] : [{ field: name }];
        flags.push("D13", ...(timed ? ["D15"] : []));
      }
      const { prompt, parts } = sentenceParts(ctx, row, question, slots);
      screen = {
        id: sid,
        type: "short-text",
        mode: "goal",
        answerKey: key,
        heading: title,
        ...(prompt ? { prompt } : {}),
        parts,
        fields,
        // Support a cause is optional (Cath 4 Nov 10:07pm): an empty percent skips it; a bad value still blocks.
        ...(causeGoal ? { optional: true } : {}),
      };
      // D23: no goal-level not-applicable; a goal is dropped only in Find the why.
      const spec = fieldSpecs(fields);
      answer = fieldsAnswer(key, fields);
      validation = [...spec.validation];
      goals.push({ ...(whyItem ? { rankItemId: item } : {}), position, title, screen });
      goalMetas.push({
        ...meta(row, { screenId: sid, index: "", template: "short-text:goal", question: row.question, answer, validation, feeds, flags }),
        inGoalLoop: loopId,
      });
      return;
    }
    goals.push({ rankItemId: item, position: "ranked", title, screen });
    goalMetas.push({
      ...meta(row, { screenId: sid, index: "", template: "choice-capture:single", question: row.question, options, answer, validation, feeds, flags }),
      inGoalLoop: loopId,
    });
  });
  // Rank items with no goal row are skipped (none since D3).
  const skip = whyItems.filter((i) => !goals.some((g) => g.rankItemId === i.id)).map((i) => i.id);

  // Add another goal (optional, last). The Optional tag sits by the heading, so the guidance drops its leading "Optional." (Cath 4 Nov 10:07pm).
  const OTHER_GUIDANCE = rOther.guidance.replace(/^Optional\.\s*/, "");
  expectInput(ctx, rOther, ["fill-in"]);
  const otherTitle = trackerLabel(rOther.bronze).replace(/\s*\(.*\)$/, "");
  const otherFields: LaunchpadTextField[] = [
    { name: "goalText", input: "text", label: "My goal", hint: "free text", maxLength: LIMITS.otherGoalTextMax, optional: true },
    ...timeframeFields(true),
  ];
  // Final AB row may only show [free text]; dataInput still calls for optional duration — expand so all three fields appear in the sentence.
  const otherQuestion = /\[number\].*\[weeks\/months\]/.test(rOther.question)
    ? rOther.question
    : rOther.question.replace(/\[free text\]\.?/, "[free text] in [number] [weeks/months].");
  // One inline sentence: "My goal is to [text] in [1–99] [weeks/months]." Text and duration optional, no number (Cath, 4 Nov 8:54pm; tracker I11/U11).
  const otherSentence = sentenceParts(ctx, rOther, otherQuestion, [{ field: "goalText" }, { field: "timeframeNumber" }, { field: "timeframeUnit" }]);
  // The Optional tag sits by the heading, so I11's "(optional)" is not repeated in the prompt.
  if (otherSentence.prompt) otherSentence.prompt = otherSentence.prompt.replace(/\s*\(optional\)/i, "").trim();
  const otherScreen: LaunchpadShortTextScreen = {
    id: `${b4}-t1-goal-other`,
    type: "short-text",
    mode: "goal",
    answerKey: KEYS.otherGoal,
    heading: otherTitle,
    ...(otherSentence.prompt ? { prompt: otherSentence.prompt } : {}),
    guidance: OTHER_GUIDANCE,
    parts: otherSentence.parts,
    fields: otherFields,
    optional: true,
  };
  goals.push({ position: "last", title: otherTitle, screen: otherScreen });
  const otherSpec = fieldSpecs(otherFields);
  goalMetas.push({
    ...meta(rOther, {
      screenId: otherScreen.id,
      index: "",
      template: "short-text:goal",
      guidance: OTHER_GUIDANCE,
      question: otherQuestion,
      answer: fieldsAnswer(KEYS.otherGoal, otherFields),
      validation: [...otherSpec.validation, "the whole page is optional"],
      flags: ["D13", "D15"],
    }),
    inGoalLoop: loopId,
  });

  // Number goal pages in authored order (the learner's order varies).
  goalMetas.forEach((g, i) => (g.index = `2.${i + 1}`));

  // D21: the Set your goals context and guidance sit above the first goal (step 1), no intro-only page.
  // D23: sheet still says mark goals not applicable; Cath dropped the chip — goals drop only via Find the why.
  const GOALS_GUIDANCE =
    "Finish the sentence for each reason you ranked above the line. Use a number and a timeframe so you can check your progress later. Reasons you moved below the line don't need a goal.";
  const loop: LaunchpadGoalLoopScreen = {
    id: loopId,
    type: "goal-loop",
    ...(rSeq.context ? { context: rSeq.context } : {}),
    guidance: GOALS_GUIDANCE,
    ...(goalRows.find((r) => r.workbookSection)?.workbookSection ? { handbookLabel: goalRows.find((r) => r.workbookSection)!.workbookSection } : {}),
    orderFrom: KEYS.why,
    skipRankItemIds: skip,
    goals,
  };

  const bronzes: LoadBronze[] = [];
  // D21: one screen per bronze; the context and guidance sit above the question and its options.
  const simpleBronze = (
    id: string,
    row: TrackerRow,
    interaction: LoadScreen,
  ): LoadBronze => ({
    id,
    title: trackerLabel(row.bronze),
    sheetLabel: row.bronze,
    sourceRow: row.row,
    tasks: [{ id: `${id}-t1`, title: trackerLabel(row.bronze), kind: "in-app", paged: true, canComeBackLater: false, screens: [withIntro(row, interaction)] }],
  });

  bronzes.push(
    simpleBronze(b1, rOffer, {
      ...meta(rOffer, {
        screenId: offerScreen.id,
        index: "2",
        template: "choice-capture:multi",
        question: rOffer.question,
        options: offerOptions,
        answer: { answerKey: KEYS.offer, kind: "selection", version: 1, fields: [{ name: "selected", type: "option ids", required: true, limits: "one or more" }] },
        validation: ["at least one pick"],
        flags: ["D14"],
      }),
      payload: offerScreen,
    }),
  );
  bronzes.push(
    simpleBronze(b2, { ...whyRow, guidance: "Drag the reasons into order, most important at the top. If a reason doesn't apply to you, drag it below the line. You don't have to." }, {
      ...meta(rWhy, {
        screenId: whyScreen.id,
        index: "2",
        template: "rank-order",
        question: rWhy.question,
        options: whyItems,
        answer: {
          answerKey: KEYS.why,
          kind: "ranking",
          version: 1,
          fields: [
            { name: "order", type: "option ids (all four, most important first)", required: true },
            { name: "notApplicable", type: "option ids", required: false },
          ],
        },
        validation: ["all four items always shown; the shown order is a valid answer"],
        flags: ["D3", "D16"],
      }),
      payload: whyScreen,
    }),
  );
  bronzes.push(
    simpleBronze(b3, rCause, {
      ...meta(rCause, {
        screenId: causeScreen.id,
        index: "2",
        template: "choice-capture:single",
        question: rCause.question,
        options: causeOptions,
        answer: { answerKey: KEYS.cause, kind: "selection", version: 1, fields: [{ name: "selected", type: "option id", required: true, limits: "exactly one" }] },
        validation: ["exactly one pick"],
      }),
      payload: causeScreen,
    }),
  );
  const seqTitle = trackerLabel(rSeq.bronze).replace(/\s*\(.*\)$/, "");
  bronzes.push({
    id: b4,
    title: seqTitle,
    sheetLabel: rSeq.bronze,
    sourceRow: rSeq.row,
    tasks: [
      {
        id: `${b4}-t1`,
        title: seqTitle,
        kind: "in-app",
        paged: true,
        canComeBackLater: false,
        screens: [
          {
            ...meta(rSeq, {
              screenId: loopId,
              index: "1",
              template: "goal-loop",
              context: loop.context,
              guidance: loop.guidance,
              question: rSeq.question,
              feeds: [{ answerKey: KEYS.why, use: "goal order; not-applicable reasons skipped" }],
              validation: [`skips ${skip.join(", ") || "none"}`, "context and guidance above the first goal", "Support a cause after the ranked goals (from Know your impact, not the ranking)", "Add another goal last"],
              flags: ["D1", "D3", "D11", "D12"],
            }),
            payload: loop,
          },
          ...goalMetas,
        ],
      },
    ],
  });

  // D26/D30: no Define wrap-up and no gold-completion screen. The Brand
  // identity wrap-up (row 14 handbook) is the Level 1 workbook; the lift
  // shows Congratulations after it.
  const defineBronzes = bronzes.filter((b) => b.id !== b4);
  const goalsBronzes = bronzes.filter((b) => b.id === b4);

  return {
    level: 1,
    name: rOffer.levelName,
    gold: { id: "l1-gold" },
    silvers: [
      {
        id: "l1-s1",
        title: S_DEFINE,
        sheetLabel: rOffer.silver,
        build: "load",
        bronzes: defineBronzes,
      },
      {
        id: "l1-s2",
        title: S_GOALS,
        sheetLabel: rSeq.silver,
        build: "load",
        bronzes: goalsBronzes,
      },
    ],
  };
}

/* ------------------------------------------------------------ level 2 */

function level2(ctx: Ctx, rows: readonly TrackerRow[]): LoadLevel {
  // Tracker still uses these labels for row lookup; Final titles are emitted below.
  const S_TRACKER = "Know the product and its buyers";
  const S = "The product and its buyers"; // Final / Revised silver title
  const rSell = need(ctx, rows, 2, S_TRACKER, "Decide what to sell");
  const rDemand = need(ctx, rows, 2, S_TRACKER, "Find out if people want it");
  const rWrap = need(ctx, rows, 2, S_TRACKER, /^Wrap-up/);
  expectInput(ctx, rSell, ["fill-in"]);
  expectInput(ctx, rDemand, ["fill-in"]);

  // Bronze 1: Decide what to sell (paragraph).
  const b1 = "l2-s1-b1";
  const sellFields: LaunchpadTextField[] = [
    { name: "serviceDescription", input: "text", label: "Service description", maxLength: LIMITS.paragraphTextMax },
    { name: "availability", input: "text", label: "Availability", hint: "days and times", maxLength: LIMITS.shortParagraphTextMax },
  ];
  const sellSentence = sentenceParts(ctx, rSell, rSell.question, [{ field: "serviceDescription" }, { field: "availability" }]);
  const sellScreen: LaunchpadShortTextScreen = {
    id: `${b1}-t1-s2`,
    type: "short-text",
    mode: "paragraph",
    answerKey: KEYS.sell,
    ...(sellSentence.prompt ? { prompt: sellSentence.prompt } : {}),
    parts: sellSentence.parts,
    fields: sellFields,
  };

  // Bronze 2: Find out if people want it (real-world, paragraph).
  const b2 = "l2-s1-b2";
  const dHints = slotHints(rDemand.question);
  const yesNo = parseSentence(rDemand.question).slots.find((s) => s.kind === "bracket" && s.choices);
  const demandFields: LaunchpadTextField[] = [
    { name: "numberAsked", input: "integer", label: "Number of people asked", hint: dHints[0], min: 1, max: LIMITS.peopleAskedMax },
    {
      name: "yesNo",
      input: "choice",
      label: "Yes or No",
      options: (yesNo && yesNo.kind === "bracket" ? yesNo.choices! : ["Yes", "No"]).map((c) => ({ id: kebab(c), label: c })),
    },
    { name: "specificInterest", input: "text", label: "What they were specifically interested in", hint: dHints[3], maxLength: LIMITS.shortParagraphTextMax },
  ];
  const demandSentence = sentenceParts(ctx, rDemand, rDemand.question, [
    { field: "numberAsked" },
    { token: "product" },
    { field: "yesNo" },
    { field: "specificInterest" },
  ]);
  const demandScreen: LaunchpadShortTextScreen = {
    id: `${b2}-t1-s2`,
    type: "short-text",
    mode: "paragraph",
    answerKey: KEYS.demand,
    ...(demandSentence.prompt ? { prompt: demandSentence.prompt } : {}),
    parts: demandSentence.parts,
    fields: demandFields,
  };

  const paged = (id: string, row: TrackerRow, kind: "in-app" | "real-world", screen: LaunchpadShortTextScreen, fields: LaunchpadTextField[], flags: string[]): LoadBronze => {
    const spec = fieldSpecs(fields);
    return {
      id,
      title: trackerLabel(row.bronze),
      sheetLabel: row.bronze,
      sourceRow: row.row,
      tasks: [
        {
          id: `${id}-t1`,
          title: trackerLabel(row.bronze),
          kind,
          paged: true,
          canComeBackLater: false,
          // D21: one screen, context and guidance above the sentence.
          screens: [
            withIntro(row, {
              ...meta(row, {
                screenId: screen.id,
                index: "1",
                template: "short-text:paragraph",
                question: row.question,
                options: fields.flatMap((f) => f.options ?? []),
                answer: fieldsAnswer(screen.answerKey, fields),
                validation: spec.validation,
                flags,
              }),
              payload: screen,
            }),
          ],
        },
      ],
    };
  };

  const bronzes = [
    paged(b1, rSell, "in-app", sellScreen, sellFields, ["D4", "D13"]),
    // Final bronze title (tracker still says "Find out if people want it"); keep demand screens.
    (() => {
      const bronze = paged(b2, rDemand, "real-world", demandScreen, demandFields, ["D5", "D6", "D10", "D13", "D15"]);
      const FINAL_TITLE = "Know who your customers are";
      return {
        ...bronze,
        title: FINAL_TITLE,
        tasks: bronze.tasks.map((task) => ({ ...task, title: FINAL_TITLE })),
      };
    })(),
  ];

  const sectionFor = (label: string): LaunchpadSummarySection | null => {
    const id = kebab(label);
    if (/selling/i.test(label)) return { id, label, display: "text", sources: [{ answerKey: KEYS.sell, field: "serviceDescription", editFields: ["serviceDescription"] }] };
    if (/^when$/i.test(label)) return { id, label, display: "text", sources: [{ answerKey: KEYS.sell, field: "availability", editFields: ["availability"] }] };
    if (/who might want it/i.test(label)) return { id, label, display: "sentences", sources: [{ answerKey: KEYS.demand, editFields: ["numberAsked", "yesNo", "specificInterest"] }] };
    return null;
  };
  const labels = sectionLabels(rWrap.dataInput);
  const sections = labels.map((l) => {
    const s = sectionFor(l);
    if (!s) issue(ctx, rWrap.row, `Wrap-up section "${l}" has no resolution.`);
    return s;
  }).filter((s): s is LaunchpadSummarySection => !!s);
  if (sections.length !== 3) issue(ctx, rWrap.row, `Expected three wrap-up sections, read ${sections.length}.`);
  const wrap: LaunchpadSummaryWrapUp = {
    type: "workbook-summary",
    heading: "Your workbook page",
    body: "Check your answers. Tap the pencil to change one, then tap Continue.",
    finalizeLabel: "Continue",
    sections,
    placeholder: true,
  };

  return {
    level: 2,
    name: rSell.levelName,
    gold: { id: "l2-gold" },
    silvers: [
      {
        id: "l2-s1",
        title: S,
        sheetLabel: rSell.silver,
        build: "load",
        bronzes,
        wrapUp: {
          ...meta(rWrap, {
            screenId: "l2-s1-wrap",
            index: "wrap-up",
            template: "workbook-summary",
            feeds: [
              { answerKey: KEYS.sell, use: "What I am selling (serviceDescription) and When (availability), editable" },
              { answerKey: KEYS.demand, use: "Who might want it, editable" },
            ],
            validation: ["read-only except the values listed in wrapup-edit-calls.md"],
            flags: ["D4", "D7", "D8", "D18"],
          }),
          payload: wrap,
        },
      },
    ],
  };
}

/* ------------------------------------------------------------ identity */

/**
 * D26/D27: The Brand (l1-s3) after Set your goals. Locked seed pickers from
 * l2-s2, renumbered; name before logo. Answer key stays IDENTITY_ANSWER_KEY.
 * Vision template comes from Final AB14 handbook (validation source), not built
 * as handbook UI from that column.
 */
const ID_SILVER = "l1-s3";

const DEFAULT_VISION_TEMPLATE =
  "I am starting a {business-type} business. I will offer {offer-list}. I'm doing it to {why-list}. [[As I grow, I'll give {cause-percent}% of every sale to support {cause}.]] My goals: {goal-list}";

function identity(ctx: Ctx, rows: readonly TrackerRow[], visionTemplateFromHandbook?: string | null): LoadSilver {
  const I = "The Brand";
  const rName = need(ctx, rows, 1, I, "Name the business");
  const rLogo = need(ctx, rows, 1, I, "Design the logo");
  // Row 14 gold wrap — handbook validation source; used for vision template only.
  const rIdWrap = need(ctx, rows, 1, "Gold", /^Wrap-up/);
  const handbookSections: LaunchpadSummarySection[] = [
    { id: "our-vision", label: "Our vision", display: "list", sources: [{ answerKey: KEYS.offer }] },
  ];
  const fromWrap = rIdWrap.question.trim().replace(/^["\u201c]|["\u201d]$/g, "").trim();
  const visionTemplate = (visionTemplateFromHandbook && visionTemplateFromHandbook.trim()) || fromWrap || DEFAULT_VISION_TEMPLATE;
  if (!/\{business-type\}/.test(visionTemplate)) issue(ctx, rIdWrap.row, "Vision template has no {business-type}.");
  const vision: LaunchpadVisionSpec = {
    label: "Our vision",
    template: visionTemplate,
    businessType: DOG_WALKING_BUSINESS_TYPE,
    offerKey: KEYS.offer,
    whyKey: KEYS.why,
    causeKey: KEYS.cause,
    causeGoalKey: KEYS.goal("support-a-cause"),
    causePercentField: "donatePercent",
    goalLoopId: "l1-s2-b1-t1-s2",
    placeholder: "Your vision appears here when you finish Level 1.",
  };
  const locked = (row: TrackerRow, screenId: string, template: "logo-picker" | "name-picker" | "identity-wrap-up"): LoadRowMeta =>
    meta(row, {
      screenId,
      index: template === "identity-wrap-up" ? "wrap-up" : "1",
      template,
      context: row.context,
      guidance: row.guidance,
      ...(template === "identity-wrap-up"
        ? {}
        : {
            answer: {
              answerKey: IDENTITY_ANSWER_KEY,
              kind: "business-identity" as const,
              version: 1 as const,
              fields:
                template === "logo-picker"
                  ? [
                      { name: "shape", type: "option id" as const, required: true },
                      { name: "color", type: "option id" as const, required: true },
                      { name: "icon", type: "option id" as const, required: true },
                    ]
                  : [
                      { name: "name", type: "text" as const, required: true, limits: "up to 24 characters" },
                      { name: "font", type: "option id" as const, required: true },
                      { name: "nameColor", type: "option id" as const, required: true },
                    ],
            },
          }),
      validation: ["locked build: unchanged"],
      flags: ["D20", "D27"],
    });

  return {
    id: ID_SILVER,
    seedSilverId: "l2-s2",
    title: I,
    sheetLabel: rName.silver,
    build: "locked",
    bronzes: [],
    // D27 / AC13: logo first (seed id b2), then name (seed id b1), matching the seed bronze order.
    lockedRows: [locked(rLogo, `${ID_SILVER}-b2-t1`, "logo-picker"), locked(rName, `${ID_SILVER}-b1-t1`, "name-picker")],
    wrapUp: {
      ...locked(rIdWrap, `${ID_SILVER}-wrap`, "identity-wrap-up"),
      feeds: [
        { answerKey: IDENTITY_ANSWER_KEY, use: "logo and name" },
        { answerKey: KEYS.offer, use: "handbook Our vision" },
      ],
      flags: ["D19", "D20", "D24", "D25", "D26", "D27", "D30"],
      handbookSections,
      vision,
    },
  };
}

/* ------------------------------------------------------------ feeds into */

/** Fills feedsInto from every row's feeds, so the export reads both ways. */
function linkFeeds(levels: LoadLevel[]): void {
  const metas: LoadRowMeta[] = [];
  for (const l of levels) {
    for (const s of l.silvers) {
      for (const b of s.bronzes) for (const t of b.tasks) metas.push(...t.screens);
      metas.push(...(s.lockedRows ?? []));
      if (s.wrapUp) metas.push(s.wrapUp);
    }
    if (l.gold.row) metas.push(l.gold.row);
  }
  const byKey = new Map<string, LoadRowMeta>();
  for (const m of metas) if (m.answer && !byKey.has(m.answer.answerKey)) byKey.set(m.answer.answerKey, m);
  for (const m of metas) {
    for (const f of m.feeds) {
      const src = byKey.get(f.answerKey);
      if (src && !src.feedsInto.includes(m.screenId)) src.feedsInto.push(m.screenId);
    }
  }
}

export type DogWalkingLoadSource = {
  file: string;
  md5: string;
  sheet?: string;
  /** When building Module 1 from the Final framework sheet. */
  visionTemplateFromHandbook?: string | null;
};

/**
 * Builds the dog-walking load. Pass Module 1 rows from the Final framework
 * (read-framework) plus Level 2 rows from the bronze tracker (current L2
 * screens kept working). Unused Module 1 rows outside 2–14 are not required.
 */
export function buildDogWalkingLoad(
  read: TrackerRead,
  source: DogWalkingLoadSource,
): { load: LaunchpadLoadFile; issues: TrackerIssue[] } {
  const ctx: Ctx = { issues: [...read.issues] };
  const rows = read.rows.filter((r) => r.level <= 2);
  const l1 = level1(ctx, rows);
  // D26: The Brand after Set your goals.
  l1.silvers.push(identity(ctx, rows, source.visionTemplateFromHandbook));
  const levels = [l1, level2(ctx, rows)];
  linkFeeds(levels);
  applyComeBackLater(levels, rows);
  const used = new Set<number>();
  for (const l of levels) {
    for (const s of l.silvers) {
      for (const b of s.bronzes) for (const t of b.tasks) for (const sc of t.screens) used.add(sc.sourceRow);
      for (const r of s.lockedRows ?? []) used.add(r.sourceRow);
      if (s.wrapUp) used.add(s.wrapUp.sourceRow);
    }
    if (l.gold.row) used.add(l.gold.row.sourceRow);
  }
  // Module 1: only rows 2–14 must be used. L2: every level-2 row must be used.
  for (const r of rows) {
    if (r.level === 1 && (r.row < 2 || r.row > 14)) continue;
    if (!used.has(r.row)) issue(ctx, r.row, `Row "${r.bronze}" is not in the load.`);
  }
  const first = rows[0]?.row ?? 0;
  const last = rows[rows.length - 1]?.row ?? 0;
  return {
    load: {
      loadVersion: LAUNCHPAD_LOAD_VERSION,
      ventureId: DOG_WALKING_VENTURE_ID,
      ventureNoun: DOG_WALKING_NOUN,
      source: {
        file: source.file,
        sheet: source.sheet ?? "Final Service Business Framewor",
        md5: source.md5,
        rows: `${first}-${last}`,
        notes: read.notes,
      },
      levels,
      decisions: DECISIONS,
    },
    issues: ctx.issues,
  };
}
