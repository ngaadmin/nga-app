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
          });
        });
      });
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
type AnswerKind = "selection-single" | "selection-multi" | "ranking" | "fields" | "business-identity" | "costs" | "price" | "jobs" | "offer" | "customer" | "competitor";
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
  for (const field of ["serviceIntro", "whenTitle", "whenIntro", "whenNote", "addPackage", "addExtra", "addService", "addTime"] as const) {
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

