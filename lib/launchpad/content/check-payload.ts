import {
  LAUNCHPAD_FIELD_INPUTS,
  LAUNCHPAD_FLOOR_TYPES,
  LAUNCHPAD_PLACEHOLDER_BLOCK_KINDS,
  LAUNCHPAD_SUMMARY_DISPLAYS,
  LAUNCHPAD_WRAP_UP_TYPES,
  LOGO_PICKER_STEPS,
  NAME_PICKER_STEPS,
  type LaunchpadVenturePayload,
} from "@/lib/launchpad/content/types";
import {
  ANSWER_KEY_RE,
  BUSINESS_NAME_MAX,
  HEX_COLOR_RE,
  LOGO_ICON_IDS,
  LOGO_SHAPES,
  NAME_COLOR_IDS,
  NAME_FONTS,
} from "@/lib/launchpad/content/identity";
import { LAUNCHPAD_READABLE_SCHEMA_VERSIONS } from "@/lib/launchpad/content/schema-version";
import {
  GROW_IDEA_IDS,
  LEVEL_COHORTS,
  LEVEL_SECTION_IDS,
} from "@/lib/launchpad/content/level-up/model";

/** Most plaques a floor wall holds (the building art draws one window each). */
export const LAUNCHPAD_MAX_SILVERS_PER_FLOOR = 6;
/** Most doors (bronzes) under one plaque. */
export const LAUNCHPAD_MAX_BRONZES_PER_SILVER = 6;

export const LAUNCHPAD_VENTURE_ID_RE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const NODE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/;
/** Copy rules: no internal brand short form and no XP in learner-facing text. */
const BANNED_COPY: readonly { re: RegExp; label: string }[] = [
  { re: /\bNGA\b/, label: "NGA" },
  { re: /\bXP\b/i, label: "XP" },
];

export type LaunchpadPayloadCheck =
  | { ok: true; payload: LaunchpadVenturePayload }
  | { ok: false; reason: string };

type Obj = Record<string, unknown>;

function isObj(value: unknown): value is Obj {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

class Reject extends Error {}

function fail(reason: string): never {
  throw new Reject(reason);
}

function text(value: unknown, where: string, optional = false): void {
  if (value === undefined && optional) return;
  if (typeof value !== "string" || !value.trim()) fail(`${where} is missing.`);
  for (const rule of BANNED_COPY) {
    if (rule.re.test(value)) fail(`${where} uses "${rule.label}".`);
  }
}

function list(value: unknown, where: string, min = 1, max = Number.POSITIVE_INFINITY): unknown[] {
  if (!Array.isArray(value)) fail(`${where} must be a list.`);
  if (value.length < min) fail(`${where} needs at least ${min}.`);
  if (value.length > max) fail(`${where} allows at most ${max}.`);
  return value;
}

function bool(value: unknown, where: string): void {
  if (typeof value !== "boolean") fail(`${where} must be true or false.`);
}

/**
 * Shape check used at publish and again when the app reads a version
 * (same role as Academy's checkMasterPublishPayload). An unknown
 * schemaVersion, floor type, or screen type is rejected so an old app never
 * renders a newer shape. Ids must be unique across the venture because
 * progress is keyed by task id.
 */
export function checkLaunchpadVenturePayload(value: unknown, expectedVentureId?: string): LaunchpadPayloadCheck {
  try {
    checkOrThrow(value, expectedVentureId);
    return { ok: true, payload: value as LaunchpadVenturePayload };
  } catch (error) {
    if (error instanceof Reject) return { ok: false, reason: error.message };
    throw error;
  }
}

function checkSurfaceCopy(value: Obj, where: string): void {
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === "string") text(item, `${where} ${key}`);
    else if (Array.isArray(item) && where.endsWith("templates") && key === "pages") checkTemplatePages(item, `${where} ${key}`);
    else if (isObj(item)) checkSurfaceCopy(item, `${where} ${key}`);
    else fail(`${where} ${key} is missing.`);
  }
}

function checkTemplateLines(value: unknown, where: string): void {
  const seen = new Set<string>();
  list(value, where).forEach((row, i) => {
    const lw = `${where} ${i + 1}`;
    if (!isObj(row) || typeof row.id !== "string" || !FIELD_NAME_RE.test(row.id) || seen.has(row.id)) fail(`${lw} has no valid id.`);
    seen.add(row.id);
    text(row.label, `${lw} label`);
    if (row.wide !== undefined) bool(row.wide, `${lw} wide`);
  });
}

function checkTemplatePages(value: unknown[], where: string): void {
  const seen = new Set<string>();
  list(value, where).forEach((page, i) => {
    const pw = `${where} ${i + 1}`;
    if (!isObj(page) || typeof page.id !== "string" || !NODE_ID_RE.test(page.id) || seen.has(page.id)) fail(`${pw} has no valid id.`);
    seen.add(page.id);
    text(page.title, `${pw} title`);
    if (page.kind === "poster") return;
    text(page.scribble, `${pw} scribble`);
    for (const field of ["lead", "subhead", "intro", "tip", "jobTitle", "wrapTitle"] as const) {
      text(page[field], `${pw} ${field}`, true);
    }
    checkTemplateLines(page.fields, `${pw} fields`);
    if (page.wrapFields !== undefined) {
      text(page.wrapTitle, `${pw} wrap title`);
      checkTemplateLines(page.wrapFields, `${pw} wrap fields`);
    }
    if (page.ticks !== undefined) checkTemplateLines(page.ticks, `${pw} ticks`);
  });
}

function checkOrThrow(value: unknown, expectedVentureId?: string): void {
  if (!isObj(value)) fail("Payload is not an object.");
  if (!(LAUNCHPAD_READABLE_SCHEMA_VERSIONS as readonly unknown[]).includes(value.schemaVersion)) {
    fail(`Unsupported schemaVersion ${String(value.schemaVersion)}.`);
  }
  const ventureId = value.ventureId;
  if (typeof ventureId !== "string" || !LAUNCHPAD_VENTURE_ID_RE.test(ventureId)) fail("ventureId is missing.");
  if (expectedVentureId !== undefined && ventureId !== expectedVentureId) {
    fail(`Payload is venture ${ventureId}, expected ${expectedVentureId}.`);
  }
  if (value.schemaVersion === 4) {
    if (!isObj(value.surface)) fail("surface copy is missing.");
    checkSurfaceCopy(value.surface, "surface");
  }
  const ids = new Set<string>();
  const id = (raw: unknown, where: string) => {
    if (typeof raw !== "string" || !NODE_ID_RE.test(raw)) fail(`${where} has no valid id.`);
    if (ids.has(raw)) fail(`Id ${raw} is used twice.`);
    ids.add(raw);
  };
  const answers: Answers = new Map();
  const floors = list(value.floors, "floors");
  floors.forEach((floor, fi) => {
    const fw = `Floor ${fi + 1}`;
    if (!isObj(floor)) fail(`${fw} is malformed.`);
    if (floor.level !== fi + 1) fail(`${fw} must be level ${fi + 1}.`);
    text(floor.name, `${fw} name`);
    if (!(LAUNCHPAD_FLOOR_TYPES as readonly unknown[]).includes(floor.floorType)) {
      fail(`${fw} has unknown floorType ${String(floor.floorType)}.`);
    }
    if (!isObj(floor.gold)) fail(`${fw} gold is missing.`);
    id(floor.gold.id, `${fw} gold`);
    text(floor.gold.title, `${fw} gold title`);
    if (floor.gold.completion !== undefined) {
      const c = floor.gold.completion;
      if (!isObj(c)) fail(`${fw} gold completion is malformed.`);
      text(c.heading, `${fw} gold completion heading`);
      text(c.body, `${fw} gold completion body`);
      text(c.guidance, `${fw} gold completion guidance`, true);
      text(c.recap, `${fw} gold completion recap`, true);
      text(c.buttonLabel, `${fw} gold completion buttonLabel`);
    }
    list(floor.silvers, `${fw} silvers`, 1, LAUNCHPAD_MAX_SILVERS_PER_FLOOR).forEach((silver, si) => {
      const sw = `${fw} silver ${si + 1}`;
      if (!isObj(silver)) fail(`${sw} is malformed.`);
      id(silver.id, sw);
      text(silver.title, `${sw} title`);
      bool(silver.placeholder, `${sw} placeholder`);
      const pickerSteps = new Map<string, Set<string>>();
      const levelUpStatements: string[] = [];
      const notePicker = (screen: unknown) => {
        if (!isObj(screen) || (screen.type !== "logo-picker" && screen.type !== "name-picker")) return;
        const key = String(screen.answerKey);
        if (!pickerSteps.has(key)) pickerSteps.set(key, new Set());
        pickerSteps.get(key)!.add(String(screen.step));
      };
      list(silver.bronzes, `${sw} bronzes`, 1, LAUNCHPAD_MAX_BRONZES_PER_SILVER).forEach((bronze, bi) => {
        const bw = `${sw} bronze ${bi + 1}`;
        if (!isObj(bronze)) fail(`${bw} is malformed.`);
        id(bronze.id, bw);
        text(bronze.title, `${bw} title`);
        text(bronze.subtitle, `${bw} subtitle`, true);
        bool(bronze.placeholder, `${bw} placeholder`);
        list(bronze.tasks, `${bw} tasks`).forEach((task, ti) => {
          const tw = `${bw} task ${ti + 1}`;
          if (!isObj(task)) fail(`${tw} is malformed.`);
          id(task.id, tw);
          text(task.title, `${tw} title`);
          bool(task.placeholder, `${tw} placeholder`);
          text(task.ctaLabel, `${tw} ctaLabel`, true);
          if (task.paged !== undefined) bool(task.paged, `${tw} paged`);
          if (task.canComeBackLater !== undefined) bool(task.canComeBackLater, `${tw} canComeBackLater`);
          if (task.kind !== undefined && task.kind !== "in-app" && task.kind !== "real-world") fail(`${tw} has unknown kind ${String(task.kind)}.`);
          list(task.screens, `${tw} screens`).forEach((screen, ki) => {
            checkScreen(screen, `${tw} screen ${ki + 1}`, id, answers);
            notePicker(screen);
            if (isObj(screen) && screen.type === "level-up" && isObj(screen.content)) {
              levelUpStatements.push(statementPrint(screen.content.statements));
            }
          });
        });
      });
      if (levelUpStatements.length > 1 && levelUpStatements.some((print) => print !== levelUpStatements[0])) {
        fail(`${sw} Level Up statements differ between doors.`);
      }
      if (silver.wrapUp !== undefined) checkWrapUp(silver.wrapUp, `${sw} wrap-up`, pickerSteps, answers);
    });
  });
}

/**
 * Answer keys saved so far, in course order, with the kind of answer each
 * saves. A screen may only read (carry, order from, summarize) a key saved
 * on an earlier screen; picker steps share one key, so a repeat is fine for
 * those and rejected for capture screens.
 */
type AnswerKind =
  | "selection-single"
  | "selection-multi"
  | "ranking"
  | "fields"
  | "business-identity"
  | "costs"
  | "price"
  | "jobs"
  | "offer"
  | "customer"
  | "competitor"
  | "funding"
  | "find-customers"
  | "agree-job"
  | "deliver-job"
  | "wrap-job"
  | "practice-run"
  | "polish-service"
  | "sales-channels"
  | "marketing-materials"
  | "tell-people"
  | "order-system"
  | "get-ready"
  | "wrap-up-job"
  | "record-job"
  | "level-up";
type Answers = Map<string, { kind: AnswerKind; screen: Obj }>;

function answerKey(screen: Obj, where: string): string {
  if (typeof screen.answerKey !== "string" || !ANSWER_KEY_RE.test(screen.answerKey)) fail(`${where} has no valid answerKey.`);
  return screen.answerKey;
}

function saves(answers: Answers, screen: Obj, kind: AnswerKind, where: string): void {
  const key = answerKey(screen, where);
  const prior = answers.get(key);
  if (prior && !(prior.kind === "business-identity" && kind === "business-identity")) fail(`${where} answerKey ${key} is used twice.`);
  if (!prior) answers.set(key, { kind, screen });
}

function reads(answers: Answers, key: unknown, kinds: readonly AnswerKind[], where: string): Obj {
  if (typeof key !== "string") fail(`${where} names no answer.`);
  const found = answers.get(key);
  if (!found) fail(`${where} reads ${key}, which no earlier screen saves.`);
  if (!kinds.includes(found.kind)) fail(`${where} reads ${key}, which is a ${found.kind} answer.`);
  return found.screen;
}

function statementPrint(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return JSON.stringify(
    value.map((item) =>
      isObj(item) ? { id: item.id, section: item.section, label: item.label, pace: item.pace } : item,
    ),
  );
}

function sameIds(value: unknown, where: string, expected: readonly string[]): void {
  const rows = list(value, where, expected.length, expected.length);
  const seen = new Set<string>();
  rows.forEach((raw, i) => {
    if (!isObj(raw) || typeof raw.id !== "string" || !expected.includes(raw.id)) fail(`${where} ${i + 1} has an unknown id.`);
    if (seen.has(raw.id)) fail(`${where} repeats ${raw.id}.`);
    seen.add(raw.id);
    text(raw.label, `${where} ${i + 1} label`);
  });
}

function checkLevelUp(screen: Obj, where: string): void {
  if (!isObj(screen.content)) fail(`${where} content is missing.`);
  const content = screen.content;
  sameIds(content.sections, `${where} sections`, LEVEL_SECTION_IDS);
  (content.sections as Obj[]).forEach((section, i) => {
    if (section.id !== LEVEL_SECTION_IDS[i]) fail(`${where} sections are out of order.`);
  });
  const seen = new Set<string>();
  const bySection = new Map<string, number>();
  list(content.statements, `${where} statements`).forEach((raw, i) => {
    const sw = `${where} statement ${i + 1}`;
    if (!isObj(raw)) fail(`${sw} is malformed.`);
    if (typeof raw.id !== "string" || !NODE_ID_RE.test(raw.id)) fail(`${sw} has no valid id.`);
    if (seen.has(raw.id)) fail(`${sw} repeats ${raw.id}.`);
    seen.add(raw.id);
    if (typeof raw.section !== "string" || !(LEVEL_SECTION_IDS as readonly string[]).includes(raw.section)) {
      fail(`${sw} has an unknown section.`);
    }
    if (raw.pace !== "quick" && raw.pace !== "longer") fail(`${sw} pace is missing.`);
    text(raw.label, `${sw} label`);
    bySection.set(String(raw.section), (bySection.get(String(raw.section)) ?? 0) + 1);
  });
  for (const section of LEVEL_SECTION_IDS) {
    if (!bySection.get(section)) fail(`${where} has no statements in ${section}.`);
  }
  const reflect = content.reflect;
  const improve = content.improve;
  const grow = content.grow;
  if (!isObj(reflect) || !isObj(improve) || !isObj(grow)) fail(`${where} is missing Reflect, Improve, or Grow copy.`);
  for (const field of ["context", "guidance", "question"] as const) text(reflect[field], `${where} reflect ${field}`);
  for (const field of ["context", "guidance", "question", "nailedTitle", "nailedLine", "planContext"] as const) {
    text(improve[field], `${where} improve ${field}`);
  }
  if (!String(improve.nailedLine).includes("{section}")) fail(`${where} improve nailedLine must include {section}.`);
  text(improve.planHeader, `${where} improve planHeader`, true);
  if (improve.weekLabels !== undefined) {
    list(improve.weekLabels, `${where} week labels`, 1).forEach((label, i) => text(label, `${where} week label ${i + 1}`));
  }
  for (const field of ["guidance", "question", "closerHeadline", "closerContext", "calendarNote", "checkIn", "copyLabel", "copyHint"] as const) {
    text(grow[field], `${where} grow ${field}`);
  }
  if (!String(grow.checkIn).includes("{date}")) fail(`${where} grow checkIn must include {date}.`);
  text(grow.context, `${where} grow context`, true);
  text(grow.optionPrompt, `${where} grow option prompt`, true);
  text(grow.startLabel, `${where} grow start label`, true);
  text(grow.checkInLabel, `${where} grow check-in label`, true);
  text(grow.successFieldLabel, `${where} grow success field`, true);
  text(grow.copiedLabel, `${where} grow copied label`, true);
  text(grow.copyFailedHint, `${where} grow copy failed hint`, true);
  text(grow.joinWord, `${where} grow join word`, true);
  text(grow.dateLine, `${where} grow date line`, true);
  if (typeof grow.dateLine === "string" && !grow.dateLine.includes("{date}")) fail(`${where} grow date line must include {date}.`);
  const choiceIds = (raw: unknown, label: string, withMonths: boolean) => {
    if (raw === undefined) return;
    const seen = new Set<string>();
    list(raw, label).forEach((item, i) => {
      const cw = `${label} ${i + 1}`;
      if (!isObj(item) || typeof item.id !== "string" || !NODE_ID_RE.test(item.id) || seen.has(item.id)) fail(`${cw} has no valid id.`);
      seen.add(item.id);
      text(item.label, `${cw} label`);
      text(item.period, `${cw} period`, true);
      if (item.days !== undefined && (typeof item.days !== "number" || !Number.isInteger(item.days) || item.days < 1 || item.days > 3660)) {
        fail(`${cw} days are missing.`);
      }
      if (item.months !== undefined && (typeof item.months !== "number" || !Number.isInteger(item.months) || item.months < 1 || item.months > 36)) {
        fail(`${cw} months are missing.`);
      }
      if (withMonths && (typeof item.months !== "number" || !Number.isInteger(item.months) || item.months < 1 || item.months > 36)) {
        fail(`${cw} months are missing.`);
      }
    });
  };
  choiceIds(grow.startOptions, `${where} grow starts`, false);
  choiceIds(grow.checkInOptions, `${where} grow check-ins`, true);
  if (content.workbookPages !== undefined) {
    const seen = new Set<string>();
    list(content.workbookPages, `${where} workbook pages`).forEach((page, i) => {
      const pw = `${where} workbook page ${i + 1}`;
      if (!isObj(page) || typeof page.id !== "string" || !NODE_ID_RE.test(page.id) || seen.has(page.id)) fail(`${pw} has no valid id.`);
      seen.add(page.id);
      text(page.title, `${pw} title`);
    });
  }
  const ideas = list(grow.ideas, `${where} ideas`, GROW_IDEA_IDS.length, GROW_IDEA_IDS.length);
  const ideaIds = new Set<string>();
  const optionIds = new Set<string>();
  ideas.forEach((raw, i) => {
    const iw = `${where} idea ${i + 1}`;
    if (!isObj(raw) || typeof raw.id !== "string" || !(GROW_IDEA_IDS as readonly string[]).includes(raw.id)) fail(`${iw} has an unknown id.`);
    if (ideaIds.has(raw.id)) fail(`${iw} repeats ${raw.id}.`);
    ideaIds.add(raw.id);
    text(raw.label, `${iw} label`);
    text(raw.context, `${iw} context`, true);
    text(raw.statement, `${iw} statement`, true);
    if (typeof raw.statement === "string") {
      for (const token of ["{offer}", "{start}", "{count}", "{checkIn}"]) {
        if (!raw.statement.includes(token)) fail(`${iw} statement must include ${token}.`);
      }
    }
    text(raw.successLine, `${iw} success line`, true);
    if (typeof raw.successLine === "string" && !raw.successLine.includes("{count}")) fail(`${iw} success line must include {count}.`);
    if (raw.layout !== undefined && raw.layout !== "stacked") fail(`${iw} has an unknown layout.`);
    if (raw.layout === "stacked") {
      if (!isObj(raw.stacked)) fail(`${iw} stacked copy is missing.`);
      else {
        for (const field of ["offerLead", "startLead", "countLead", "countAfter", "checkInLead", "emptyLabel"] as const) {
          text(raw.stacked[field], `${iw} stacked ${field}`);
        }
        text(raw.stacked.offerNote, `${iw} stacked offer note`, true);
        text(raw.stacked.startNote, `${iw} stacked start note`, true);
      }
    }
    list(raw.options, `${iw} options`).forEach((option, oi) => {
      const ow = `${iw} option ${oi + 1}`;
      if (!isObj(option) || typeof option.id !== "string" || !NODE_ID_RE.test(option.id)) fail(`${ow} has no valid id.`);
      if (optionIds.has(option.id)) fail(`${ow} repeats ${option.id}.`);
      optionIds.add(option.id);
      text(option.label, `${ow} label`);
      text(option.sentence, `${ow} sentence`, true);
      if (option.cohorts !== undefined) {
        const cohorts = list(option.cohorts, `${ow} cohorts`);
        const cohortSeen = new Set<string>();
        cohorts.forEach((cohort) => {
          if (typeof cohort !== "string" || !(LEVEL_COHORTS as readonly string[]).includes(cohort) || cohortSeen.has(cohort)) {
            fail(`${ow} has an unknown cohort.`);
          }
          cohortSeen.add(cohort);
        });
      }
    });
  });
}

function checkScreen(screen: unknown, where: string, id: (raw: unknown, where: string) => void, answers: Answers): void {
  if (!isObj(screen)) fail(`${where} is malformed.`);
  id(screen.id, where);
  text(screen.heading, `${where} heading`, true);
  switch (screen.type) {
    case "placeholder":
      list(screen.blocks, `${where} blocks`).forEach((block, i) => {
        if (!isObj(block) || !(LAUNCHPAD_PLACEHOLDER_BLOCK_KINDS as readonly unknown[]).includes(block.kind)) {
          fail(`${where} block ${i + 1} has an unknown kind.`);
        }
        text(block.label, `${where} block ${i + 1} label`);
      });
      return;
    case "text":
      text(screen.body, `${where} body`);
      text(screen.note, `${where} note`, true);
      return;
    case "checklist":
      text(screen.intro, `${where} intro`, true);
      list(screen.items, `${where} items`).forEach((item, i) => text(item, `${where} item ${i + 1}`));
      return;
    case "logo-picker":
      checkPickerBase(screen, where);
      checkLogoStep(screen, where);
      saves(answers, screen, "business-identity", where);
      return;
    case "name-picker":
      checkPickerBase(screen, where);
      checkNameStep(screen, where);
      saves(answers, screen, "business-identity", where);
      return;
    case "context":
      text(screen.context, `${where} context`);
      text(screen.guidance, `${where} guidance`, true);
      return;
    case "choice-capture":
      checkCaptureBase(screen, where);
      if (screen.mode !== "single" && screen.mode !== "multi") fail(`${where} mode must be single or multi.`);
      options(screen.options, where);
      text(screen.summaryLabel, `${where} summaryLabel`, true);
      saves(answers, screen, screen.mode === "single" ? "selection-single" : "selection-multi", where);
      return;
    case "rank-order":
      checkCaptureBase(screen, where);
      options(screen.items, where);
      if ((screen.items as unknown[]).length < 2) fail(`${where} needs at least 2 items.`);
      text(screen.notApplicableLabel, `${where} notApplicableLabel`);
      saves(answers, screen, "ranking", where);
      return;
    case "short-text":
      checkShortText(screen, where, answers);
      saves(answers, screen, "fields", where);
      return;
    case "goal-loop": {
      text(screen.context, `${where} context`, true);
      text(screen.guidance, `${where} guidance`, true);
      const ranking = reads(answers, screen.orderFrom, ["ranking"], `${where} orderFrom`);
      const itemIds = (ranking.items as Obj[]).map((o) => String(o.id));
      list(screen.skipRankItemIds, `${where} skipRankItemIds`, 0).forEach((raw) => {
        if (!itemIds.includes(String(raw))) fail(`${where} skips unknown item ${String(raw)}.`);
      });
      const seen = new Set<string>();
      list(screen.goals, `${where} goals`).forEach((goal, gi) => {
        const gw = `${where} goal ${gi + 1}`;
        if (!isObj(goal)) fail(`${gw} is malformed.`);
        text(goal.title, `${gw} title`);
        if (goal.position !== "ranked" && goal.position !== "after-ranked" && goal.position !== "last") fail(`${gw} has unknown position.`);
        if (goal.position === "ranked") {
          if (typeof goal.rankItemId !== "string" || !itemIds.includes(goal.rankItemId)) fail(`${gw} rankItemId is not an item of ${String(screen.orderFrom)}.`);
          if (seen.has(goal.rankItemId)) fail(`${gw} repeats item ${goal.rankItemId}.`);
          seen.add(goal.rankItemId);
        }
        if (!isObj(goal.screen) || (goal.screen.type !== "short-text" && goal.screen.type !== "choice-capture")) {
          fail(`${gw} screen must be short-text or choice-capture.`);
        }
        checkScreen(goal.screen, `${gw} screen`, id, answers);
      });
      return;
    }
    case "know-your-cost":
      checkKnowYourCost(screen, where, answers);
      return;
    case "set-price":
      checkSetPrice(screen, where, answers);
      return;
    case "jobs-to-cover":
      checkJobsCover(screen, where, answers);
      return;
    case "offer-loop":
      checkOfferLoop(screen, where, answers);
      return;
    case "customer-check":
      checkCustomer(screen, where, answers);
      return;
    case "competitor-check":
      checkCompetitor(screen, where, answers);
      return;
    case "funding-start":
      checkFunding(screen, where, answers);
      return;
    case "getting-ready":
      checkGettingReady(screen, where, answers);
      return;
    case "sales":
      checkSales(screen, where, answers);
      return;
    case "delivery":
      checkDelivery(screen, where, answers);
      return;
    case "level-up":
      text(screen.title, `${where} title`);
      if (screen.step !== "reflect" && screen.step !== "improve" && screen.step !== "grow") fail(`${where} step is missing.`);
      checkLevelUp(screen, where);
      saves(answers, screen, "level-up", where);
      return;
    case "picture":
      text(screen.title, `${where} title`);
      if (screen.voice !== undefined && typeof screen.voice !== "boolean") fail(`${where} voice must be true or false.`);
      list(screen.pages, `${where} pages`, 1).forEach((page, i) => {
        if (!isObj(page)) fail(`${where} page ${i + 1} is malformed.`);
        text(page.id, `${where} page ${i + 1} id`);
        if (page.split === true) return;
        text(page.image, `${where} page ${i + 1} image`);
        text(page.alt, `${where} page ${i + 1} alt`);
        text(page.body, `${where} page ${i + 1} body`);
        text(page.credit, `${where} page ${i + 1} credit`, true);
        if (page.audio !== undefined) {
          if (!isObj(page.audio)) fail(`${where} page ${i + 1} audio is malformed.`);
          text(page.audio.src, `${where} page ${i + 1} audio src`);
          if (typeof page.audio.durationMs !== "number" || page.audio.durationMs <= 0) fail(`${where} page ${i + 1} audio duration is missing.`);
        }
      });
      return;
    default:
      fail(`${where} has unknown type ${String(screen.type)}.`);
  }
}

const COST_COPY_FIELDS = [
  "hubIntro",
  "startupCard",
  "ongoingCard",
  "startupIntro",
  "marketingLabel",
  "starterLabel",
  "starterNote",
  "ongoingIntro",
  "serviceIntro",
  "totalsIntro",
  "grandNote",
  "workbookHint",
  "hubWait",
] as const;

function checkCostAmount(value: unknown, where: string, whole: boolean): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) fail(`${where} amount must be 0 or more.`);
  if (whole && !Number.isInteger(value)) fail(`${where} amount must be a whole number.`);
}

/** `tiedTo` null: a marketing or restock row, with no service list of its own. */
function checkCostItems(value: unknown, where: string, seen: Set<string>, tiedTo: readonly string[] | null, whole: boolean): void {
  list(value, where, 0).forEach((raw, i) => {
    const iw = `${where} item ${i + 1}`;
    if (!isObj(raw) || typeof raw.id !== "string" || !NODE_ID_RE.test(raw.id)) fail(`${iw} has no valid id.`);
    if (seen.has(raw.id)) fail(`${iw} repeats id ${raw.id}.`);
    seen.add(raw.id);
    text(raw.label, `${iw} label`);
    checkCostAmount(raw.amount, iw, whole);
    if (tiedTo) {
      list(raw.serviceIds, `${iw} services`).forEach((id) => {
        if (typeof id !== "string" || !tiedTo.includes(id)) fail(`${iw} is tied to an unknown service ${String(id)}.`);
      });
    } else if (raw.serviceIds !== undefined) fail(`${iw} cannot be tied to a service.`);
  });
}

function checkKnowYourCost(screen: Obj, where: string, answers: Answers): void {
  saves(answers, screen, "costs", where);
  const offer = reads(answers, screen.servicesFrom, ["selection-multi", "selection-single"], `${where} servicesFrom`);
  const serviceIds = list(offer.options, `${where} servicesFrom options`, 0).map((raw) => (isObj(raw) ? String(raw.id) : ""));
  text(screen.sourceNote, `${where} sourceNote`);
  if (typeof screen.showTotals !== "boolean") fail(`${where} showTotals must be true or false.`);
  if (!isObj(screen.copy)) fail(`${where} copy is missing.`);
  for (const field of COST_COPY_FIELDS) text(screen.copy[field], `${where} ${field}`);
  const seen = new Set<string>();
  checkCostItems(screen.marketing, `${where} marketing`, seen, null, true);
  checkCostItems(screen.starterGear, `${where} starter gear`, seen, serviceIds, true);
  const services = new Set<string>();
  list(screen.ongoing, `${where} ongoing`, 0).forEach((raw, i) => {
    const ow = `${where} ongoing ${i + 1}`;
    if (!isObj(raw) || typeof raw.serviceId !== "string" || !serviceIds.includes(raw.serviceId)) fail(`${ow} has an unknown service.`);
    if (services.has(raw.serviceId)) fail(`${ow} repeats ${raw.serviceId}.`);
    services.add(raw.serviceId);
    checkCostItems(raw.items, `${ow} items`, new Set(), null, false);
  });
}

const SET_PRICE_COPY = ["context", "guidance", "othersMissing", "keepLabel", "costLabel", "lowKeep", "emptyServices"] as const;
const JOBS_COPY = ["context", "guidance", "singlePrompt", "multiPrompt", "covered", "needPrice", "weeklyLabel", "startupLabel", "weeksLabel"] as const;

function checkSetPrice(screen: Obj, where: string, answers: Answers): void {
  saves(answers, screen, "price", where);
  reads(answers, screen.costsFrom, ["costs"], `${where} costsFrom`);
  reads(answers, screen.servicesFrom, ["selection-multi", "selection-single"], `${where} servicesFrom`);
  if (!isObj(screen.copy)) fail(`${where} copy is missing.`);
  for (const field of SET_PRICE_COPY) text(screen.copy[field], `${where} ${field}`);
}

function checkJobsCover(screen: Obj, where: string, answers: Answers): void {
  saves(answers, screen, "jobs", where);
  reads(answers, screen.costsFrom, ["costs"], `${where} costsFrom`);
  reads(answers, screen.priceFrom, ["price"], `${where} priceFrom`);
  if (!isObj(screen.copy)) fail(`${where} copy is missing.`);
  for (const field of JOBS_COPY) text(screen.copy[field], `${where} ${field}`);
  const seen = new Set<string>();
  list(screen.weekOptions, `${where} weekOptions`, 7, 7).forEach((raw, i) => {
    const ow = `${where} week option ${i + 1}`;
    if (!isObj(raw) || typeof raw.id !== "string" || !NODE_ID_RE.test(raw.id)) fail(`${ow} has no valid id.`);
    if (seen.has(raw.id)) fail(`${ow} repeats ${raw.id}.`);
    seen.add(raw.id);
    text(raw.label, `${ow} label`);
    if (raw.jobs !== i + 1) fail(`${ow} must be ${i + 1} jobs a week.`);
  });
}

function checkChips(value: unknown, where: string): void {
  const seen = new Set<string>();
  list(value, where, 1).forEach((raw, i) => {
    if (!isObj(raw) || typeof raw.id !== "string" || !NODE_ID_RE.test(raw.id)) fail(`${where} chip ${i + 1} has no valid id.`);
    if (seen.has(raw.id)) fail(`${where} repeats ${String(raw.id)}.`);
    seen.add(raw.id);
    text(raw.label, `${where} chip ${i + 1} label`);
  });
}

function checkOfferLoop(screen: Obj, where: string, answers: Answers): void {
  saves(answers, screen, "offer", where);
  reads(answers, screen.servicesFrom, ["selection-multi", "selection-single"], `${where} servicesFrom`);
  checkChips(screen.times, `${where} times`);
  if (!isObj(screen.copy)) fail(`${where} copy is missing.`);
  for (const field of ["serviceIntro", "whenTitle", "whenIntro", "whenNote", "whenSummary", "packagesHeading", "extrasHeading", "packagesHint", "extrasHint", "addPackage", "addExtra", "addTime"] as const) {
    text(screen.copy[field], `${where} ${field}`);
  }
  list(screen.catalogs, `${where} catalogs`, 1).forEach((raw, i) => {
    if (!isObj(raw) || typeof raw.serviceId !== "string" || !NODE_ID_RE.test(raw.serviceId)) fail(`${where} catalog ${i + 1} has no service.`);
    checkChips(raw.packages, `${where} catalog ${i + 1} packages`);
    checkChips(raw.extras, `${where} catalog ${i + 1} extras`);
  });
}

function checkCustomer(screen: Obj, where: string, answers: Answers): void {
  saves(answers, screen, "customer", where);
  reads(answers, screen.offerFrom, ["offer"], `${where} offerFrom`);
  reads(answers, screen.servicesFrom, ["selection-multi", "selection-single"], `${where} servicesFrom`);
  text(screen.productPhrase, `${where} productPhrase`);
  checkChips(screen.times, `${where} times`);
  if (!isObj(screen.copy)) fail(`${where} copy is missing.`);
  text(screen.copy.intro, `${where} intro`);
  text(screen.copy.addInterest, `${where} addInterest`);
  text(screen.title, `${where} title`);
  text(screen.sectionHeading, `${where} sectionHeading`);
  text(screen.sentence, `${where} sentence`);
  text(screen.yesLabel, `${where} yesLabel`);
  text(screen.noLabel, `${where} noLabel`);
  text(screen.timesTitle, `${where} timesTitle`);
  text(screen.timesHint, `${where} timesHint`);
  text(screen.addTime, `${where} addTime`);
}

function checkCompetitor(screen: Obj, where: string, answers: Answers): void {
  saves(answers, screen, "competitor", where);
  reads(answers, screen.offerFrom, ["offer"], `${where} offerFrom`);
  reads(answers, screen.servicesFrom, ["selection-multi", "selection-single"], `${where} servicesFrom`);
  checkChips(screen.addons, `${where} addons`);
  checkChips(screen.ideas, `${where} ideas`);
  if (!isObj(screen.copy)) fail(`${where} copy is missing.`);
  for (const field of ["pricesIntro", "extrasIntro", "addJob", "addExtra", "ideaTitle", "ideaHint", "elseHint"] as const) {
    text(screen.copy[field], `${where} ${field}`);
  }
}

const GETTING_READY_KIND = {
  find: "find-customers",
  agree: "agree-job",
  deliver: "deliver-job",
  "wrap-job": "wrap-job",
  practice: "practice-run",
  polish: "polish-service",
} as const;

const AGREE_SECTION_IDS = ["collect_info", "confirm_dog", "when_where", "cost_payment", "plans_change"] as const;

function checkReadyOptions(value: unknown, where: string): void {
  list(value, where, 1).forEach((raw, i) => {
    if (!isObj(raw)) fail(`${where} option ${i + 1} is malformed.`);
    text(raw.id, `${where} option ${i + 1} id`);
    text(raw.label, `${where} option ${i + 1} label`);
  });
}

function checkDeliveryOptions(value: unknown, where: string): void {
  const seen = new Set<string>();
  list(value, where, 1).forEach((raw, i) => {
    if (!isObj(raw) || typeof raw.id !== "string" || !NODE_ID_RE.test(raw.id) || seen.has(raw.id)) fail(`${where} option ${i + 1} has no valid id.`);
    if (isObj(raw) && typeof raw.id === "string") seen.add(raw.id);
    text(isObj(raw) ? raw.label : undefined, `${where} option ${i + 1} label`);
  });
}

function checkDelivery(screen: Obj, where: string, answers: Answers): void {
  const step = screen.step;
  const kind = step === "ready" ? "get-ready" : step === "wrap" ? "wrap-up-job" : step === "record" ? "record-job" : "";
  if (!kind) fail(`${where} has an unknown delivery step.`);
  saves(answers, screen, kind, where);
  text(screen.title, `${where} title`);
  text(screen.question, `${where} question`);
  text(screen.context, `${where} context`);
  text(screen.guidance, `${where} guidance`);
  text(screen.playbackTitle, `${where} playbackTitle`);
  text(screen.joinWord, `${where} joinWord`);
  reads(answers, screen.deliverFrom, ["deliver-job"], `${where} deliverFrom`);
  reads(answers, screen.wrapFrom, ["wrap-job"], `${where} wrapFrom`);
  reads(answers, screen.costsFrom, ["costs"], `${where} costsFrom`);
  reads(answers, screen.priceFrom, ["price"], `${where} priceFrom`);
  reads(answers, screen.servicesFrom, ["selection-multi", "selection-single"], `${where} servicesFrom`);
  list(screen.doodles, `${where} doodles`, 3, 3).forEach((name, i) => text(name, `${where} doodle ${i + 1}`));
  if (step === "ready") {
    const block = screen.ready;
    if (!isObj(block)) fail(`${where} ready is missing.`);
    else {
      for (const field of ["emptyLabel", "remindBefore", "remindAfter", "aboutBefore", "aboutAfter", "travelBefore", "travelAfter", "leaveBefore", "leaveAfter", "packBefore", "packAfter", "packTitle", "packSep", "packEmpty", "note"] as const) {
        text(block[field], `${where} ready ${field}`);
      }
      checkDeliveryOptions(block.aboutOptions, `${where} ready aboutOptions`);
      checkDeliveryOptions(block.travelOptions, `${where} ready travelOptions`);
      checkDeliveryOptions(block.leaveOptions, `${where} ready leaveOptions`);
      checkDeliveryOptions(block.packOptions, `${where} ready packOptions`);
    }
  }
  if (step === "wrap") {
    const block = screen.wrap;
    if (!isObj(block)) fail(`${where} wrap is missing.`);
    else {
      for (const field of ["emptyLabel", "proofBefore", "proofAfter", "paymentBefore", "paymentAfter", "askPayBefore", "askPayAfter", "feedbackBefore", "feedbackAfter", "askBefore", "trackerLine", "whenBefore", "whenAfter", "note"] as const) {
        text(block[field], `${where} wrap ${field}`);
      }
      if (block.askAfter !== undefined && typeof block.askAfter !== "string") fail(`${where} wrap askAfter must be text.`);
      checkDeliveryOptions(block.askPayOptions, `${where} wrap askPayOptions`);
      checkDeliveryOptions(block.askOptions, `${where} wrap askOptions`);
      checkDeliveryOptions(block.whenOptions, `${where} wrap whenOptions`);
    }
  }
  if (step === "record") {
    const block = screen.record;
    if (!isObj(block)) fail(`${where} record is missing.`);
    else {
      for (const field of ["emptyLabel", "serviceBefore", "serviceAfter", "priceBefore", "priceAfter", "paidBefore", "paidAfter", "paidHint", "costBefore", "costAfter", "keptBefore", "keptAfter", "lowKeep", "trackerLine", "addJob", "note", "serviceSuffix", "paidLead", "costLead", "keptLead", "lineAfter"] as const) {
        text(block[field], `${where} record ${field}`);
      }
      if (typeof block.paidMax !== "number" || !Number.isInteger(block.paidMax) || block.paidMax < 1 || block.paidMax > 9999) {
        fail(`${where} record paidMax must be a whole number from 1 to 9999.`);
      }
    }
  }
}

function checkSales(screen: Obj, where: string, answers: Answers): void {
  const step = screen.step;
  const kind = step === "channels" ? "sales-channels" : step === "materials" ? "marketing-materials" : step === "targets" ? "tell-people" : step === "order" ? "order-system" : "";
  if (!kind) fail(`${where} has an unknown sales step.`);
  saves(answers, screen, kind, where);
  text(screen.title, `${where} title`);
  if (step === "channels") {
    text(screen.question, `${where} question`);
    text(screen.context, `${where} context`);
    text(screen.hint, `${where} hint`);
    checkReadyOptions(screen.channels, `${where} channels`);
  }
  if (step === "materials") {
    text(screen.question, `${where} question`);
    checkReadyOptions(screen.hooks, `${where} hooks`);
    checkReadyOptions(screen.proofs, `${where} proofs`);
  }
  if (step === "targets") text(screen.hint, `${where} hint`);
  if (step === "order") checkOrderSystem(screen.order, `${where} order`);
}

function checkOrderOptions(value: unknown, where: string): void {
  const seen = new Set<string>();
  list(value, where, 1).forEach((raw, i) => {
    if (!isObj(raw)) fail(`${where} option ${i + 1} is malformed.`);
    text(raw.id, `${where} option ${i + 1} id`);
    if (typeof raw.id !== "string" || seen.has(raw.id)) fail(`${where} option ${i + 1} id is repeated.`);
    seen.add(String(raw.id));
    text(raw.label, `${where} option ${i + 1} label`);
    if (where.endsWith("trackerOptions")) text(raw.workbook, `${where} option ${i + 1} workbook`);
  });
}

function checkOrderSystem(value: unknown, where: string): void {
  if (!isObj(value)) fail(`${where} is missing.`);
  for (const field of ["question", "context", "guidance", "trackerLead", "emptyLabel", "playbackTitle", "templateBefore", "templateStrong", "templateAfter", "repeatLine", "reminderLead", "checkLine", "workbookTitle", "trackerBefore", "trackerAfter", "reminderBefore", "reminderAfter", "checkBefore", "checkPick", "checkAfter"] as const) {
    text(value[field], `${where} ${field}`);
  }
  checkOrderOptions(value.trackerOptions, `${where} trackerOptions`);
  checkOrderOptions(value.reminderOptions, `${where} reminderOptions`);
  const reminderIds = new Set((Array.isArray(value.reminderOptions) ? value.reminderOptions : []).flatMap((row) => (isObj(row) && typeof row.id === "string" ? [row.id] : [])));
  if (typeof value.reminderDefault !== "string" || !reminderIds.has(value.reminderDefault)) fail(`${where} reminderDefault is not an option.`);
}

function checkGettingReady(screen: Obj, where: string, answers: Answers): void {
  const step = screen.step;
  if (typeof step !== "string" || !(step in GETTING_READY_KIND)) fail(`${where} has an unknown step.`);
  saves(answers, screen, GETTING_READY_KIND[step as keyof typeof GETTING_READY_KIND], where);
  text(screen.title, `${where} title`);
  if (step === "find") {
    text(screen.question, `${where} question`);
    text(screen.hint, `${where} hint`);
    text(screen.alsoLabel, `${where} alsoLabel`);
    checkReadyOptions(screen.channels, `${where} channels`);
  } else if (step === "agree") {
    text(screen.readLabel, `${where} readLabel`);
    text(screen.note, `${where} note`);
    text(screen.noteStrong, `${where} noteStrong`);
    const ids = new Set<string>();
    list(screen.agreeSections, `${where} agreeSections`, AGREE_SECTION_IDS.length).forEach((raw, i) => {
      if (!isObj(raw) || typeof raw.id !== "string" || !AGREE_SECTION_IDS.includes(raw.id as (typeof AGREE_SECTION_IDS)[number])) {
        fail(`${where} agree section ${i + 1} has an unknown id.`);
      }
      if (isObj(raw)) {
        if (ids.has(String(raw.id))) fail(`${where} repeats agree section ${String(raw.id)}.`);
        ids.add(String(raw.id));
        text(raw.title, `${where} agree section ${i + 1} title`);
        text(raw.lead, `${where} agree section ${i + 1} lead`);
        list(raw.bullets, `${where} agree section ${i + 1} bullets`, 1).forEach((line, bi) => text(line, `${where} agree bullet ${bi + 1}`));
      }
    });
    list(screen.agreePages, `${where} agreePages`, 1).forEach((raw, i) => {
      if (!isObj(raw)) fail(`${where} agree page ${i + 1} is malformed.`);
      const page = raw;
      list(page.sectionIds, `${where} agree page ${i + 1} sections`, 1).forEach((id) => {
        if (!ids.has(String(id))) fail(`${where} agree page ${i + 1} names unknown section ${String(id)}.`);
      });
    });
  } else if (step === "deliver") {
    text(screen.question, `${where} question`);
    text(screen.hint, `${where} hint`);
    checkReadyOptions(screen.beforeOptions, `${where} beforeOptions`);
    checkReadyOptions(screen.afterOptions, `${where} afterOptions`);
    list(screen.deliverBlocks, `${where} deliverBlocks`, 1).forEach((raw, i) => {
      if (!isObj(raw)) fail(`${where} deliver block ${i + 1} is malformed.`);
      text(raw.heading, `${where} deliver block ${i + 1} heading`);
      text(raw.lead, `${where} deliver block ${i + 1} lead`);
      if (raw.slot !== "before" && raw.slot !== "after") fail(`${where} deliver block ${i + 1} has an unknown slot.`);
    });
  } else if (step === "wrap-job") {
    text(screen.question, `${where} question`);
    text(screen.hint, `${where} hint`);
    text(screen.summaryBoth, `${where} summaryBoth`);
    text(screen.summaryPayment, `${where} summaryPayment`);
    text(screen.summaryFeedback, `${where} summaryFeedback`);
    for (const group of ["payment", "feedback"] as const) {
      const block = screen[group];
      if (!isObj(block)) fail(`${where} ${group} is missing.`);
      text(block.heading, `${where} ${group} heading`);
      if (group === "feedback" || typeof block.lead === "string") text(block.lead, `${where} ${group} lead`);
      checkReadyOptions(block.options, `${where} ${group} options`);
    }
  } else if (step === "practice") {
    text(screen.question, `${where} question`);
    text(screen.hint, `${where} hint`);
    text(screen.practiceWhoLead, `${where} practiceWhoLead`);
    text(screen.practiceServiceLead, `${where} practiceServiceLead`);
    text(screen.practiceWhenLead, `${where} practiceWhenLead`);
    checkReadyOptions(screen.practiceWho, `${where} practiceWho`);
    checkReadyOptions(screen.practiceWhen, `${where} practiceWhen`);
  } else if (step === "polish") {
    text(screen.question, `${where} question`);
    text(screen.hint, `${where} hint`);
    text(screen.polishSuggestion, `${where} polishSuggestion`);
    checkReadyOptions(screen.polishResults, `${where} polishResults`);
    list(screen.polishQuestions, `${where} polishQuestions`, 1).forEach((raw, i) => {
      if (!isObj(raw)) fail(`${where} polish question ${i + 1} is malformed.`);
      text(raw.id, `${where} polish question ${i + 1} id`);
      text(raw.prompt, `${where} polish question ${i + 1} prompt`);
    });
  }
}

function checkFunding(screen: Obj, where: string, answers: Answers): void {
  saves(answers, screen, "funding", where);
  reads(answers, screen.costsFrom, ["costs"], `${where} costsFrom`);
  if (!isObj(screen.copy)) fail(`${where} copy is missing.`);
  for (const field of [
    "context",
    "guidance",
    "prompt",
    "ownCash",
    "borrow",
    "ownCashConfirm",
    "paybackTitle",
    "fixedMode",
    "fixedHelp",
    "weeklyMode",
    "weeklyHelp",
    "fixedShow",
    "weeklyShow",
    "disclaimer",
    "missing",
    "missingAction",
  ] as const) {
    text(screen.copy[field], `${where} ${field}`);
  }
}

function checkCaptureBase(screen: Obj, where: string, promptOptional = false): void {
  answerKey(screen, where);
  text(screen.prompt, `${where} prompt`, promptOptional);
  text(screen.context, `${where} context`, true);
  text(screen.guidance, `${where} guidance`, true);
}

const FIELD_NAME_RE = /^[a-z][A-Za-z0-9]{0,47}$/;

function checkShortText(screen: Obj, where: string, answers: Answers): void {
  checkCaptureBase(screen, where, true);
  if (screen.mode !== "goal" && screen.mode !== "paragraph") fail(`${where} mode must be goal or paragraph.`);
  const names = new Set<string>();
  list(screen.fields, `${where} fields`).forEach((raw, i) => {
    const fw = `${where} field ${i + 1}`;
    if (!isObj(raw) || typeof raw.name !== "string" || !FIELD_NAME_RE.test(raw.name)) fail(`${fw} has no valid name.`);
    if (names.has(raw.name)) fail(`${where} field ${raw.name} is used twice.`);
    names.add(raw.name);
    if (!(LAUNCHPAD_FIELD_INPUTS as readonly unknown[]).includes(raw.input)) fail(`${fw} has unknown input ${String(raw.input)}.`);
    text(raw.label, `${fw} label`);
    text(raw.hint, `${fw} hint`, true);
    if (raw.input === "text" && !(Number.isInteger(raw.maxLength) && (raw.maxLength as number) > 0)) fail(`${fw} needs a maxLength.`);
    if (raw.input === "integer") {
      if (!Number.isInteger(raw.min) || !Number.isInteger(raw.max) || (raw.min as number) > (raw.max as number)) fail(`${fw} needs min and max.`);
    }
    if (raw.input === "choice") options(raw.options, fw);
  });
  const used = new Set<string>();
  list(screen.parts, `${where} parts`).forEach((part, i) => {
    const pw = `${where} part ${i + 1}`;
    if (!isObj(part)) fail(`${pw} is malformed.`);
    if (part.kind === "text") {
      if (typeof part.text !== "string" || !part.text) fail(`${pw} text is missing.`);
      text(part.text.trim() || ".", `${pw} text`);
    } else if (part.kind === "field") {
      if (typeof part.field !== "string" || !names.has(part.field)) fail(`${pw} names unknown field ${String(part.field)}.`);
      used.add(part.field);
    } else if (part.kind === "carried") {
      reads(answers, part.answerKey, ["selection-single"], `${pw} carried`);
      text(part.label, `${pw} label`);
    } else fail(`${pw} has unknown kind ${String(part.kind)}.`);
  });
  if (screen.extraFields !== undefined) {
    list(screen.extraFields, `${where} extraFields`).forEach((name) => {
      if (typeof name !== "string" || !names.has(name)) fail(`${where} extraFields names unknown field ${String(name)}.`);
      if (used.has(name)) fail(`${where} field ${name} is both in the sentence and extra.`);
      used.add(name);
    });
  }
  const unused = [...names].filter((n) => !used.has(n));
  if (unused.length) fail(`${where} fields ${unused.join(", ")} are never shown.`);
  text(screen.notApplicableLabel, `${where} notApplicableLabel`, true);
  if (screen.optional !== undefined) bool(screen.optional, `${where} optional`);
}

function checkPickerBase(screen: Obj, where: string): void {
  if (typeof screen.answerKey !== "string" || !ANSWER_KEY_RE.test(screen.answerKey)) fail(`${where} has no valid answerKey.`);
  text(screen.prompt, `${where} prompt`);
}

/** Labelled options whose ids are unique and (when `allowed` is given) from that vocabulary. */
function options(value: unknown, where: string, allowed?: readonly string[]): Obj[] {
  const seen = new Set<string>();
  return list(value, `${where} options`).map((raw, i) => {
    const ow = `${where} option ${i + 1}`;
    if (!isObj(raw) || typeof raw.id !== "string" || !NODE_ID_RE.test(raw.id)) fail(`${ow} has no valid id.`);
    if (allowed && !allowed.includes(raw.id)) fail(`${ow} has unknown id ${raw.id}.`);
    if (seen.has(raw.id)) fail(`${where} option ${raw.id} is used twice.`);
    seen.add(raw.id);
    text(raw.label, `${ow} label`);
    return raw;
  });
}

function checkLogoStep(screen: Obj, where: string): void {
  switch (screen.step) {
    case "shape":
      options(screen.options, where, LOGO_SHAPES);
      return;
    case "color":
      options(screen.options, where).forEach((o, i) => {
        if (typeof o.hex !== "string" || !HEX_COLOR_RE.test(o.hex)) fail(`${where} option ${i + 1} has no valid hex color.`);
      });
      return;
    case "icon": {
      if (!isObj(screen.iconSets) || Object.keys(screen.iconSets).length === 0) fail(`${where} iconSets is missing.`);
      for (const [venture, set] of Object.entries(screen.iconSets)) {
        if (!LAUNCHPAD_VENTURE_ID_RE.test(venture)) fail(`${where} icon set ${venture} is not a venture id.`);
        options(set, `${where} icon set ${venture}`, LOGO_ICON_IDS);
      }
      if (typeof screen.fallbackVentureId !== "string" || !(screen.fallbackVentureId in screen.iconSets)) {
        fail(`${where} fallbackVentureId must name one of its icon sets.`);
      }
      return;
    }
    default:
      fail(`${where} has unknown logo step ${String(screen.step)} (expected ${LOGO_PICKER_STEPS.join(", ")}).`);
  }
}

function checkNameStep(screen: Obj, where: string): void {
  switch (screen.step) {
    case "name":
      text(screen.inputLabel, `${where} inputLabel`);
      text(screen.placeholderText, `${where} placeholderText`, true);
      if (
        typeof screen.maxLength !== "number" ||
        !Number.isInteger(screen.maxLength) ||
        screen.maxLength < 1 ||
        screen.maxLength > BUSINESS_NAME_MAX
      ) {
        fail(`${where} maxLength must be 1 to ${BUSINESS_NAME_MAX}.`);
      }
      return;
    case "font":
      options(screen.options, where, NAME_FONTS);
      return;
    case "nameColor":
      options(screen.options, where, NAME_COLOR_IDS);
      return;
    default:
      fail(`${where} has unknown name step ${String(screen.step)} (expected ${NAME_PICKER_STEPS.join(", ")}).`);
  }
}

/**
 * Summary sections read earlier answers only: "list"/"choice" a selection,
 * "ranked" a ranking, "text" one field of a fields answer, "sentences" a
 * fields answer or a single selection.
 */
function checkSections(value: unknown, where: string, answers: Answers): void {
  const seen = new Set<string>();
  list(value, `${where} sections`).forEach((raw, i) => {
    const sw = `${where} section ${i + 1}`;
    if (!isObj(raw) || typeof raw.id !== "string" || !NODE_ID_RE.test(raw.id)) fail(`${sw} has no valid id.`);
    if (seen.has(raw.id)) fail(`${where} section ${raw.id} is used twice.`);
    seen.add(raw.id);
    text(raw.label, `${sw} label`);
    if (!(LAUNCHPAD_SUMMARY_DISPLAYS as readonly unknown[]).includes(raw.display)) fail(`${sw} has unknown display ${String(raw.display)}.`);
    list(raw.sources, `${sw} sources`).forEach((src, si) => {
      const rw = `${sw} source ${si + 1}`;
      if (!isObj(src)) fail(`${rw} is malformed.`);
      checkEdit(src, rw, answers);
      switch (raw.display) {
        case "list":
          reads(answers, src.answerKey, ["selection-multi", "selection-single"], rw);
          return;
        case "choice":
          reads(answers, src.answerKey, ["selection-single"], rw);
          return;
        case "ranked":
          reads(answers, src.answerKey, ["ranking"], rw);
          return;
        case "text": {
          const screen = reads(answers, src.answerKey, ["fields"], rw);
          if (!(screen.fields as Obj[]).some((f) => f.name === src.field)) fail(`${rw} reads unknown field ${String(src.field)} of ${String(src.answerKey)}.`);
          return;
        }
        case "sentences":
          reads(answers, src.answerKey, ["fields", "selection-single"], rw);
          return;
      }
    });
  });
}

/**
 * Inline edit stays off anything another screen's logic owns: a ranking
 * (it orders the goal loop), a single selection carried into a later
 * sentence, a currency (Parent Hub) field, or a choice whose options depend
 * on another answer. Selections and plain fields are fine.
 */
function checkEdit(src: Obj, where: string, answers: Answers): void {
  if (src.editSelection !== undefined) {
    bool(src.editSelection, `${where} editSelection`);
    if (src.editSelection) {
      const found = answers.get(String(src.answerKey));
      if (!found || (found.kind !== "selection-single" && found.kind !== "selection-multi")) fail(`${where} editSelection needs a selection answer.`);
      for (const other of answers.values()) {
        const parts = other.screen.type === "short-text" ? (other.screen.parts as Obj[]) : [];
        if (parts.some((p) => p.kind === "carried" && p.answerKey === src.answerKey)) fail(`${where} edits ${String(src.answerKey)}, which another screen carries in.`);
      }
    }
  }
  if (src.editFields !== undefined) {
    const found = answers.get(String(src.answerKey));
    if (!found || found.kind !== "fields") fail(`${where} editFields needs a fields answer.`);
    const fields = found.screen.fields as Obj[];
    list(src.editFields, `${where} editFields`).forEach((name) => {
      const f = fields.find((x) => x.name === name);
      if (!f) fail(`${where} edits unknown field ${String(name)}.`);
      if (f.input === "currency") fail(`${where} field ${String(name)} comes from Parent Hub and cannot be edited here.`);
    });
  }
}

/** The identity wrap-up edits every pick, so its silver must have all six picker steps for that answerKey. */
function checkWrapUp(wrapUp: unknown, where: string, pickerSteps: Map<string, Set<string>>, answers: Answers): void {
  if (!isObj(wrapUp)) fail(`${where} is malformed.`);
  if (!(LAUNCHPAD_WRAP_UP_TYPES as readonly unknown[]).includes(wrapUp.type)) fail(`${where} has unknown type ${String(wrapUp.type)}.`);
  text(wrapUp.heading, `${where} heading`);
  text(wrapUp.body, `${where} body`, true);
  text(wrapUp.finalizeLabel, `${where} finalizeLabel`);
  bool(wrapUp.placeholder, `${where} placeholder`);
  if (wrapUp.type === "workbook-summary") {
    checkSections(wrapUp.sections, where, answers);
    return;
  }
  if (typeof wrapUp.answerKey !== "string" || !ANSWER_KEY_RE.test(wrapUp.answerKey)) fail(`${where} has no valid answerKey.`);
  if (wrapUp.handbookSections !== undefined) checkSections(wrapUp.handbookSections, `${where} handbook`, answers);
  if (wrapUp.vision !== undefined) {
    const v = wrapUp.vision;
    if (!isObj(v)) fail(`${where} vision is malformed.`);
    for (const k of ["label", "template", "businessType", "offerKey", "whyKey", "causeKey", "causeGoalKey", "causePercentField", "goalLoopId", "placeholder"] as const)
      text(v[k], `${where} vision ${k}`);
  }
  const steps = pickerSteps.get(wrapUp.answerKey) ?? new Set<string>();
  const missing = [...LOGO_PICKER_STEPS, ...NAME_PICKER_STEPS].filter((st) => !steps.has(st));
  if (missing.length) fail(`${where} needs picker steps for ${wrapUp.answerKey}: missing ${missing.join(", ")}.`);
}

