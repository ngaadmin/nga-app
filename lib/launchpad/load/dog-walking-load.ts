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
  LaunchpadChoiceCaptureScreen,
  LaunchpadContextScreen,
  LaunchpadGoalLoopGoal,
  LaunchpadGoalLoopScreen,
  LaunchpadRankOrderScreen,
  LaunchpadSentencePart,
  LaunchpadShortTextScreen,
  LaunchpadSummarySection,
  LaunchpadSummaryWrapUp,
  LaunchpadTextField,
} from "@/lib/launchpad/content/types";
import { IDENTITY_ANSWER_KEY } from "@/lib/launchpad/content/seed/launchpad-test-venture-seed";
import { kebab, optionsAfter, parseSentence, sentenceCase } from "@/lib/launchpad/load/sentence";
import { trackerLabel, type TrackerIssue, type TrackerRead, type TrackerRow } from "@/lib/launchpad/load/read-tracker";
import {
  LAUNCHPAD_LOAD_VERSION,
  type LaunchpadLoadFile,
  type LoadAnswerField,
  type LoadAnswerSpec,
  type LoadBronze,
  type LoadDecision,
  type LoadFeed,
  type LoadLevel,
  type LoadRowMeta,
  type LoadScreen,
  type LoadWrapUp,
} from "@/lib/launchpad/load/types";

export const DOG_WALKING_VENTURE_ID = "dog-walking";
/** {product} in sentences (decision D5). */
export const DOG_WALKING_NOUN = "dog walking service";

/** Limits that the sheet does not give (decisions D2, D14, D16). */
export const LIMITS = {
  moneyMax: 9_999_999,
  timeframeMax: 99,
  goalTextMax: 80,
  otherGoalTextMax: 120,
  paragraphTextMax: 200,
  shortParagraphTextMax: 120,
  peopleAskedMax: 99,
  otherGoalNumberMax: 9_999_999,
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

export const DECISIONS: LoadDecision[] = [
  { id: "D1", topic: "Level 1 silvers", applied: "One silver, Define the business, as in the sheet: bronzes Pick what your business will offer, Find the why, Know your impact, Set your goals (goal loop with Add another goal inside it), and one wrap-up (row 12). The framework's separate Set your goals silver is gone, so L1 shows one plaque.", status: "decided-cath", rows: [2, 3, 4, 5, 11, 12] },
  { id: "D2", topic: "Money cap", applied: "Amount is a whole number, 7 digits (1 to 9,999,999). K5 still says 1 billion cap.", status: "default-pending-cath", rows: [5, 6] },
  { id: "D3", topic: "Prove I can do it", applied: "Has no goal row, so the goal loop skips it even when ranked.", status: "default-pending-cath", rows: [3, 5] },
  { id: "D4", topic: "What I am selling display", applied: "The row 14 service description shows as plain text in the wrap-up and handbook. I14/I16 say bullet list.", status: "default-pending-cath", rows: [14, 16] },
  { id: "D5", topic: "{product}", applied: `Filled from the venture noun: "${DOG_WALKING_NOUN}".`, status: "default-pending-cath", rows: [15] },
  { id: "D6", topic: "[Yes/No]", applied: "A two-option choice (Yes, No) shown as an inline dropdown in the sentence.", status: "default-pending-cath", rows: [15] },
  { id: "D7", topic: "Wrap-up button", applied: 'Kept "Finalize". I12 and I16 say "Confirm and continue".', status: "default-pending-cath", rows: [12, 16] },
  { id: "D8", topic: "Wrap-up editing", applied: "Per Cath's 4 Nov correction: a wrap-up value is edited in place (pencil on its section) only when that does not rewire logic owned by another screen; the rest stays read-only. No navigating back to earlier screens. See wrapup-edit-calls.md.", status: "decided-cath", rows: [12, 16] },
  { id: "D9", topic: "Level 2 gold", applied: "No L2 gold row in the sheet; the seed gold (Readiness to make) stays and there is no L2 gold screen.", status: "default-pending-cath", rows: [] },
  { id: "D10", topic: "K15 interest level", applied: "Ignored. Row 15 captures number asked, Yes/No and the specific interest only. K15 still says the payload lists interest level.", status: "pending-cath", rows: [15] },
  { id: "D11", topic: "Support a cause goal position", applied: "Shown after the ranked goals (K4, E10), keyed to the Support a cause reason, so striking that reason as not applicable skips it.", status: "build-assumption", rows: [4, 10] },
  { id: "D12", topic: "Struck reasons", applied: "A reason marked not applicable in Find the why gets no goal page.", status: "build-assumption", rows: [3, 5] },
  { id: "D13", topic: "Text caps", applied: `Goal text up to ${LIMITS.goalTextMax} characters, the added goal ${LIMITS.otherGoalTextMax}, the service description ${LIMITS.paragraphTextMax}, availability and specific interest ${LIMITS.shortParagraphTextMax}.`, status: "build-assumption", rows: [7, 8, 11, 14, 15] },
  { id: "D14", topic: "Minimum picks", applied: "Pick what your business will offer needs at least one pick before Next.", status: "build-assumption", rows: [2] },
  { id: "D15", topic: "Number caps", applied: `Timeframe number 1 to ${LIMITS.timeframeMax}; people asked 1 to ${LIMITS.peopleAskedMax}; added-goal number 1 to 9,999,999; donate percent 1 to 100 (sheet).`, status: "build-assumption", rows: [6, 7, 8, 11, 15] },
  { id: "D16", topic: "Ranking control", applied: "Up and down buttons move a reason; no drag yet. G3 says “Drag the reasons into order”; shown as “Use the arrows to put the reasons in order”.", status: "build-assumption", rows: [3] },
  { id: "D17", topic: "Be my own boss check-in", applied: "The six-month check-in in I9 is not built.", status: "build-assumption", rows: [9] },
  { id: "D18", topic: "Wrap-up copy and art", applied: "Wrap-up heading and body are build copy (H is N/A); the picture is a placeholder frame.", status: "build-assumption", rows: [12, 16] },
  { id: "D19", topic: "Identity handbook sections", applied: "Our vision lists the offer picks (row 2); What we sell shows the service description (row 14). A section with no answer is hidden.", status: "build-assumption", rows: [19] },
  { id: "D20", topic: "Identity titles", applied: "The locked build keeps Design your logo and Name your business (sheet: Design the logo, Name the business), and its own wrap-up behavior.", status: "build-assumption", rows: [17, 18, 19] },
];

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

function meta(row: TrackerRow, m: Partial<LoadRowMeta> & Pick<LoadRowMeta, "screenId" | "index" | "template">): LoadRowMeta {
  return { sourceRow: row.row, validation: [], feeds: [], feedsInto: [], flags: [], ...m };
}

/** The quoted button label in a Data Input cell ("Button: Continue to Planning."). */
function buttonLabel(cell: string): string | undefined {
  return /Button:\s*([^.,]+?)(?:,|\.|$)/.exec(cell)?.[1]?.trim();
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

/** Timeframe fields used by every timed goal (K5: number plus months/years, no weeks). */
function timeframeFields(optional = false): LaunchpadTextField[] {
  return [
    { name: "timeframeNumber", input: "integer", label: "Number", hint: "number", min: 1, max: LIMITS.timeframeMax, ...(optional ? { optional } : {}) },
    {
      name: "timeframeUnit",
      input: "choice",
      label: "Months or years",
      options: [
        { id: "months", label: "months" },
        { id: "years", label: "years" },
      ],
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

/* ------------------------------------------------------------ level 1 */

function level1(ctx: Ctx, rows: readonly TrackerRow[]): LoadLevel {
  const S = "Define the business";
  const rOffer = need(ctx, rows, 1, S, "Pick what your business will offer");
  const rWhy = need(ctx, rows, 1, S, "Find the why");
  const rCause = need(ctx, rows, 1, S, "Know your impact");
  const rSeq = need(ctx, rows, 1, S, /^Set your goals \(sequence\)$/);
  const rOther = need(ctx, rows, 1, S, /^Add another goal/);
  const rWrap = need(ctx, rows, 1, S, /^Wrap-up/);
  const rGold = need(ctx, rows, 1, "Gold", /^Gold milestone/);

  // Bronze 1: offer (multi-select capture).
  const offerOptions = opts(optionsAfter(rOffer.dataInput, /not the payload:\s*/));
  if (offerOptions.length < 2) issue(ctx, rOffer.row, "Could not read the offer options.");
  const b1 = "l1-s1-b1";
  const offerScreen: LaunchpadChoiceCaptureScreen = {
    id: `${b1}-t1-s2`,
    type: "choice-capture",
    mode: "multi",
    answerKey: KEYS.offer,
    prompt: rOffer.question,
    options: offerOptions,
  };

  // Bronze 2: why (rank-order with not applicable).
  const whyItems = opts(optionsAfter(rWhy.dataInput, /Items \([^)]*\):\s*/));
  if (whyItems.length !== 6) issue(ctx, rWhy.row, `Expected six why items, read ${whyItems.length}.`);
  // The quoted toggle name, e.g. 'not applicable' (an apostrophe in "doesn't" is not a quote).
  const naLabel = sentenceCase(/(?:^|\s)'([^']+)'/.exec(rWhy.guidance)?.[1] ?? NOT_APPLICABLE);
  // D16: no drag yet, so the shown how-to line names the arrows.
  const whyRow: TrackerRow = { ...rWhy, guidance: rWhy.guidance.replace(/^Drag the reasons into order/, "Use the arrows to put the reasons in order") };
  const b2 = "l1-s1-b2";
  const whyScreen: LaunchpadRankOrderScreen = {
    id: `${b2}-t1-s2`,
    type: "rank-order",
    answerKey: KEYS.why,
    prompt: rWhy.question,
    items: whyItems,
    notApplicableLabel: naLabel,
  };

  // Bronze 3: cause (single select).
  const causeOptions = opts(optionsAfter(rCause.dataInput, /Options:\s*/));
  const b3 = "l1-s1-b3";
  const causeScreen: LaunchpadChoiceCaptureScreen = {
    id: `${b3}-t1-s2`,
    type: "choice-capture",
    mode: "single",
    answerKey: KEYS.cause,
    prompt: rCause.question,
    options: causeOptions,
  };

  // Bronze 4: the goal loop.
  const b4 = "l1-s1-b4";
  const loopId = `${b4}-t1-s2`;
  const goalRows = rows.filter((r) => r.level === 1 && /^4[a-z] Set your goals: /.test(r.bronze.trim()));
  const goals: LaunchpadGoalLoopGoal[] = [];
  const goalMetas: LoadScreen[] = [];
  const itemFor = (title: string) => whyItems.find((i) => i.label.toLowerCase() === title.toLowerCase())?.id;
  goalRows.forEach((row) => {
    const title = trackerLabel(row.bronze).replace(/^Set your goals:\s*/, "").replace(/\s*\(.*\)$/, "");
    const item = itemFor(title);
    if (!item) {
      issue(ctx, row.row, `Goal "${title}" matches no Find the why item.`);
      return;
    }
    const key = KEYS.goal(item);
    const sid = `${b4}-t1-goal-${item}`;
    const flags: string[] = ["D12"];
    const feeds: LoadFeed[] = [{ answerKey: KEYS.why, use: "goal order and not-applicable skip" }];
    let screen: LaunchpadShortTextScreen | LaunchpadChoiceCaptureScreen;
    let answer: LoadAnswerSpec;
    let validation: string[] = [];
    let options: { id: string; label: string }[] | undefined;
    const hints = slotHints(row.question);
    if (/^Single select:/.test(row.dataInput)) {
      options = opts(optionsAfter(row.dataInput, /Single select:\s*/));
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
        fields = [
          { name: "amount", input: "integer", label: "Amount", hint: hints[0], min: 1, max: LIMITS.moneyMax },
          { name: "currency", input: "currency", label: "Currency" },
          ...timeframeFields(),
        ];
        slots = [{ field: "amount" }, { field: "currency" }, { field: "timeframeNumber" }, { field: "timeframeUnit" }];
        flags.push("D2", "D15");
      } else if (item === "support-a-cause") {
        fields = [{ name: "donatePercent", input: "integer", label: "Percent", hint: hints[0], min: 1, max: 100 }];
        slots = [{ field: "donatePercent" }, { carried: KEYS.cause, label: "cause area" }];
        feeds.push({ answerKey: KEYS.cause, use: "cause area carried into the sentence" });
        flags.push("D11");
        position = "after-ranked";
      } else {
        const name = item === "help-others" ? "benefit" : item === "learn-new-skills" ? "skill" : kebab(title).replace(/-./g, (m) => m[1]!.toUpperCase());
        fields = [{ name, input: "text", label: sentenceCase(hints[0] ?? name), hint: hints[0], maxLength: LIMITS.goalTextMax }, ...timeframeFields()];
        slots = [{ field: name }, { field: "timeframeNumber" }, { field: "timeframeUnit" }];
        flags.push("D13", "D15");
      }
      const { prompt, parts } = sentenceParts(ctx, row, row.question, slots);
      screen = {
        id: sid,
        type: "short-text",
        mode: "goal",
        answerKey: key,
        heading: title,
        ...(prompt ? { prompt } : {}),
        parts,
        fields,
        notApplicableLabel: NOT_APPLICABLE,
      };
      const spec = fieldSpecs(fields);
      answer = fieldsAnswer(key, fields, [{ name: "notApplicable", type: "boolean", required: false }]);
      validation = [...spec.validation, "or marked not applicable"];
      goals.push({ rankItemId: item, position, title, screen });
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
  // Rank items with no goal row are skipped (D3).
  const skip = whyItems.filter((i) => !goals.some((g) => g.rankItemId === i.id)).map((i) => i.id);

  // Add another goal (optional, last).
  const otherTitle = trackerLabel(rOther.bronze).replace(/\s*\(.*\)$/, "");
  const otherFields: LaunchpadTextField[] = [
    { name: "goalText", input: "text", label: "My goal", hint: "free text", maxLength: LIMITS.otherGoalTextMax, optional: true },
    { name: "targetNumber", input: "integer", label: "Number", min: 1, max: LIMITS.otherGoalNumberMax, optional: true },
    ...timeframeFields(true).map((f) => (f.name === "timeframeNumber" ? { ...f, label: "Timeframe" } : f)),
  ];
  const otherSentence = sentenceParts(ctx, rOther, rOther.question, [{ field: "goalText" }]);
  const otherScreen: LaunchpadShortTextScreen = {
    id: `${b4}-t1-goal-other`,
    type: "short-text",
    mode: "goal",
    answerKey: KEYS.otherGoal,
    heading: otherTitle,
    ...(otherSentence.prompt ? { prompt: otherSentence.prompt } : {}),
    guidance: rOther.guidance,
    parts: otherSentence.parts,
    fields: otherFields,
    extraFields: ["targetNumber", "timeframeNumber", "timeframeUnit"],
    optional: true,
  };
  goals.push({ position: "last", title: otherTitle, screen: otherScreen });
  const otherSpec = fieldSpecs(otherFields);
  goalMetas.push({
    ...meta(rOther, {
      screenId: otherScreen.id,
      index: "",
      template: "short-text:goal",
      guidance: rOther.guidance,
      question: rOther.question,
      answer: fieldsAnswer(KEYS.otherGoal, otherFields),
      validation: [...otherSpec.validation, "the whole page is optional"],
      flags: ["D13", "D15"],
    }),
    inGoalLoop: loopId,
  });

  // Number goal pages in authored order (the learner's order varies).
  goalMetas.forEach((g, i) => (g.index = `2.${i + 1}`));

  const loop: LaunchpadGoalLoopScreen = { id: loopId, type: "goal-loop", orderFrom: KEYS.why, skipRankItemIds: skip, goals };

  const contextScreen = (bronzeId: string, row: TrackerRow): LaunchpadContextScreen => ({
    id: `${bronzeId}-t1-s1`,
    type: "context",
    context: row.context,
    ...(row.guidance ? { guidance: row.guidance } : {}),
  });

  const ctxMeta = (row: TrackerRow, screen: LaunchpadContextScreen): LoadScreen => ({
    ...meta(row, { screenId: screen.id, index: "1", template: "context", context: screen.context, guidance: screen.guidance }),
    payload: screen,
  });

  const bronzes: LoadBronze[] = [];
  const simpleBronze = (
    id: string,
    row: TrackerRow,
    interaction: LoadScreen,
  ): LoadBronze => {
    const c = contextScreen(id, row);
    return {
      id,
      title: trackerLabel(row.bronze),
      sheetLabel: row.bronze,
      sourceRow: row.row,
      tasks: [{ id: `${id}-t1`, title: trackerLabel(row.bronze), kind: "in-app", paged: true, screens: [ctxMeta(row, c), interaction] }],
    };
  };

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
    simpleBronze(b2, whyRow, {
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
            { name: "order", type: "option ids (all six, most important first)", required: true },
            { name: "notApplicable", type: "option ids", required: false },
          ],
        },
        validation: ["all six items always shown; the shown order is a valid answer"],
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
  const seqContext = contextScreen(b4, rSeq);
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
        screens: [
          ctxMeta(rSeq, seqContext),
          {
            ...meta(rSeq, {
              screenId: loopId,
              index: "2",
              template: "goal-loop",
              question: rSeq.question,
              feeds: [{ answerKey: KEYS.why, use: "goal order; not-applicable reasons skipped" }],
              validation: [`skips ${skip.join(", ") || "none"}`, "Support a cause after the ranked goals", "Add another goal last"],
              flags: ["D1", "D3", "D11", "D12"],
            }),
            payload: loop,
          },
          ...goalMetas,
        ],
      },
    ],
  });

  // Wrap-up (row 12): one summary for the silver (D1), with the edit calls (D8).
  const labels = sectionLabels(rWrap.dataInput);
  const goalKeys = goals.map((g) => g.screen.answerKey);
  const goalSource = (g: LaunchpadGoalLoopGoal) => {
    if (g.screen.type === "choice-capture") return { answerKey: g.screen.answerKey, editSelection: true };
    const editable = g.screen.fields.filter((f) => f.input !== "currency").map((f) => f.name);
    return { answerKey: g.screen.answerKey, editFields: editable };
  };
  const sectionFor = (label: string): LaunchpadSummarySection | null => {
    const id = kebab(label);
    if (/offer/i.test(label)) return { id, label, display: "list", sources: [{ answerKey: KEYS.offer, editSelection: true }] };
    if (/why/i.test(label)) return { id, label, display: "ranked", sources: [{ answerKey: KEYS.why }] };
    if (/cause/i.test(label)) return { id, label, display: "choice", sources: [{ answerKey: KEYS.cause }] };
    if (/goals/i.test(label)) return { id, label, display: "sentences", sources: goals.map(goalSource) };
    return null;
  };
  const sections = labels.map((l) => {
    const s = sectionFor(l);
    if (!s) issue(ctx, rWrap.row, `Wrap-up section "${l}" has no resolution.`);
    return s;
  }).filter((s): s is LaunchpadSummarySection => !!s);
  if (sections.length !== 4) issue(ctx, rWrap.row, `Expected four wrap-up sections, read ${sections.length}.`);
  const wrapId = "l1-s1-wrap";
  const wrap: LaunchpadSummaryWrapUp = {
    type: "workbook-summary",
    heading: "Your workbook page",
    body: "Check your answers. Tap the pencil to change one, then tap Finalize.",
    finalizeLabel: "Finalize",
    sections,
    placeholder: true,
  };
  const silverWrap: LoadWrapUp = {
    ...meta(rWrap, {
      screenId: wrapId,
      index: "wrap-up",
      template: "workbook-summary",
      feeds: [
        { answerKey: KEYS.offer, use: "What my business will offer (editable)" },
        { answerKey: KEYS.why, use: "My why, rank order, not-applicable left off (read-only)" },
        { answerKey: KEYS.cause, use: "My cause (read-only)" },
        ...goalKeys.map((k) => ({ answerKey: k, use: "My goals" })),
      ],
      validation: ["read-only except the values listed in wrapup-edit-calls.md"],
      flags: ["D1", "D7", "D8", "D18"],
    }),
    payload: wrap,
  };

  // Gold (row 13).
  const recap = /One-line recap:\s*"([^"]+)"/.exec(rGold.dataInput)?.[1];
  const goldButton = buttonLabel(rGold.dataInput.replace(/^[\s\S]*?(Button:)/, "$1")) ?? "Continue";
  const gold = {
    id: "l1-gold",
    completion: {
      heading: rGold.question,
      body: rGold.context,
      ...(rGold.guidance ? { guidance: rGold.guidance } : {}),
      ...(recap ? { recap } : {}),
      buttonLabel: goldButton,
    },
    row: meta(rGold, {
      screenId: "l1-gold-completion",
      index: "gold",
      template: "gold-completion",
      context: rGold.context,
      guidance: rGold.guidance,
      question: rGold.question,
      validation: ["nothing is captured"],
    }),
  };

  return {
    level: 1,
    name: rOffer.levelName,
    gold,
    silvers: [
      {
        id: "l1-s1",
        title: S,
        sheetLabel: rOffer.silver,
        build: "load",
        bronzes,
        wrapUp: silverWrap,
      },
    ],
  };
}

/* ------------------------------------------------------------ level 2 */

function level2(ctx: Ctx, rows: readonly TrackerRow[]): LoadLevel {
  const S = "Know the product and its buyers";
  const rSell = need(ctx, rows, 2, S, "Decide what to sell");
  const rDemand = need(ctx, rows, 2, S, "Find out if people want it");
  const rWrap = need(ctx, rows, 2, S, /^Wrap-up/);
  const I = "Build your identity";
  const rLogo = need(ctx, rows, 2, I, "Design the logo");
  const rName = need(ctx, rows, 2, I, "Name the business");
  const rIdWrap = need(ctx, rows, 2, I, /^Wrap-up/);

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
    const c: LaunchpadContextScreen = { id: `${id}-t1-s1`, type: "context", context: row.context, ...(row.guidance ? { guidance: row.guidance } : {}) };
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
          screens: [
            { ...meta(row, { screenId: c.id, index: "1", template: "context", context: c.context, guidance: c.guidance }), payload: c },
            {
              ...meta(row, {
                screenId: screen.id,
                index: "2",
                template: "short-text:paragraph",
                question: row.question,
                options: fields.flatMap((f) => f.options ?? []),
                answer: fieldsAnswer(screen.answerKey, fields),
                validation: spec.validation,
                flags,
              }),
              payload: screen,
            },
          ],
        },
      ],
    };
  };

  const bronzes = [
    paged(b1, rSell, "in-app", sellScreen, sellFields, ["D4", "D13"]),
    paged(b2, rDemand, "real-world", demandScreen, demandFields, ["D5", "D6", "D10", "D13", "D15"]),
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
    body: "Check your answers. Tap the pencil to change one, then tap Finalize.",
    finalizeLabel: "Finalize",
    sections,
    placeholder: true,
  };

  // Identity (locked): record the rows; add the handbook sections from I19.
  if (!/Our vision/.test(rIdWrap.dataInput) || !/What we sell/.test(rIdWrap.dataInput)) {
    issue(ctx, rIdWrap.row, "I19 no longer names Our vision and What we sell.");
  }
  const handbookSections: LaunchpadSummarySection[] = [
    { id: "our-vision", label: "Our vision", display: "list", sources: [{ answerKey: KEYS.offer }] },
    { id: "what-we-sell", label: "What we sell", display: "text", sources: [{ answerKey: KEYS.sell, field: "serviceDescription" }] },
  ];
  const locked = (row: TrackerRow, screenId: string, template: "logo-picker" | "name-picker" | "identity-wrap-up"): LoadRowMeta =>
    meta(row, {
      screenId,
      index: template === "identity-wrap-up" ? "wrap-up" : "1",
      template,
      context: row.context,
      guidance: row.guidance,
      answer: template === "identity-wrap-up" ? undefined : { answerKey: IDENTITY_ANSWER_KEY, kind: "business-identity", version: 1, fields: template === "logo-picker" ? [{ name: "shape", type: "option id", required: true }, { name: "color", type: "option id", required: true }, { name: "icon", type: "option id", required: true }] : [{ name: "name", type: "text", required: true, limits: "up to 24 characters" }, { name: "font", type: "option id", required: true }, { name: "nameColor", type: "option id", required: true }] },
      validation: ["locked build: unchanged"],
      flags: ["D20"],
    });

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
      {
        id: "l2-s2",
        title: I,
        sheetLabel: rLogo.silver,
        build: "locked",
        bronzes: [],
        lockedRows: [locked(rLogo, "l2-s2-b1-t1", "logo-picker"), locked(rName, "l2-s2-b2-t1", "name-picker")],
        wrapUp: {
          ...locked(rIdWrap, "l2-s2-wrap", "identity-wrap-up"),
          feeds: [
            { answerKey: IDENTITY_ANSWER_KEY, use: "logo and name" },
            { answerKey: KEYS.offer, use: "handbook Our vision" },
            { answerKey: KEYS.sell, use: "handbook What we sell" },
          ],
          flags: ["D19", "D20"],
          handbookSections,
        },
      },
    ],
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

export function buildDogWalkingLoad(
  read: TrackerRead,
  source: { file: string; md5: string },
): { load: LaunchpadLoadFile; issues: TrackerIssue[] } {
  const ctx: Ctx = { issues: [...read.issues] };
  const rows = read.rows.filter((r) => r.level <= 2);
  const levels = [level1(ctx, rows), level2(ctx, rows)];
  linkFeeds(levels);
  const used = new Set<number>();
  for (const l of levels) {
    for (const s of l.silvers) {
      for (const b of s.bronzes) for (const t of b.tasks) for (const sc of t.screens) used.add(sc.sourceRow);
      for (const r of s.lockedRows ?? []) used.add(r.sourceRow);
      if (s.wrapUp) used.add(s.wrapUp.sourceRow);
    }
    if (l.gold.row) used.add(l.gold.row.sourceRow);
  }
  for (const r of rows) if (!used.has(r.row)) issue(ctx, r.row, `Row "${r.bronze}" is not in the load.`);
  const first = rows[0]?.row ?? 0;
  const last = rows[rows.length - 1]?.row ?? 0;
  return {
    load: {
      loadVersion: LAUNCHPAD_LOAD_VERSION,
      ventureId: DOG_WALKING_VENTURE_ID,
      ventureNoun: DOG_WALKING_NOUN,
      source: { file: source.file, sheet: "Bronze Task Tracker", md5: source.md5, rows: `${first}-${last}`, notes: read.notes },
      levels,
      decisions: DECISIONS,
    },
    issues: ctx.issues,
  };
}
