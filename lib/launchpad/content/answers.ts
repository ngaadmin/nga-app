import {
  ANSWER_KEY_RE,
  parseBusinessIdentityAnswer,
  type BusinessIdentityAnswer,
} from "@/lib/launchpad/content/identity";
import { keptPerJob, weeklyKeep, weeksFromJobs, weeksFromWeeklyKeep, jobsNeeded } from "@/lib/launchpad/content/pricing/calc";

/**
 * The learner's saved answers, one per answerKey, each tagged with a `kind`
 * and a `version`. Every answer is parsed on read: unknown kinds, unknown
 * versions and bad fields are dropped (never thrown), so an old or
 * hand-edited store still renders. Kept in localStorage on the test route
 * (no learner answer tables yet).
 */

/** Choice capture (single or multi): the picked option ids, in pick order. */
export type SelectionAnswer = { kind: "selection"; version: 1; selected: readonly string[] };

/** Rank order: every item id, most important first, plus the ids struck out as not applicable. */
export type RankingAnswer = { kind: "ranking"; version: 1; order: readonly string[]; notApplicable: readonly string[] };

/** Short text (goal or paragraph): values by field name; `notApplicable` when the learner marked it so. */
export type FieldsAnswer = {
  kind: "fields";
  version: 1;
  values: Readonly<Record<string, string | number>>;
  notApplicable?: boolean;
};

/** One cost row the learner can edit, delete, or add. Amount 0 is allowed. */
export type CostLine = {
  id: string;
  label: string;
  /** Start-up lines are whole dollars. Ongoing lines may include cents. */
  amount: number;
  custom?: boolean;
};

/** Restock lines for one service, plus whether the learner has calculated it. */
export type CostServiceLines = {
  serviceId: string;
  label: string;
  lines: readonly CostLine[];
  done: boolean;
};

/**
 * Know your cost. `chosenServiceIds` is the offer picks this answer was built
 * for, so a later change of services can refresh starter gear without wiping
 * a finished list.
 */
export type CostsAnswer = {
  kind: "costs";
  version: 1;
  chosenServiceIds: readonly string[];
  startup: {
    marketing: readonly CostLine[];
    starterGear: readonly CostLine[];
    done: boolean;
  };
  ongoing: readonly CostServiceLines[];
  /** Set when the learner has no chosen services and confirms the empty ongoing hub. */
  ongoingAcknowledged?: boolean;
};

/** One priced service. `keptPerJob` is always price minus cost. Charity is not stored. */
export type ServicePrice = {
  serviceId: string;
  /** Whole dollars. */
  price: number;
  costPerJob: number;
  keptPerJob: number;
};

/**
 * Set the price. One entry per offered service. The payload has no
 * charity percent, charity share, or cause.
 */
export type PriceAnswer = {
  kind: "price";
  version: 1;
  prices: readonly ServicePrice[];
};

export type TypicalWeekRow = {
  serviceId: string;
  jobsPerWeek: number;
  keptPerJob: number;
  /** jobs per week × keep. */
  subtotal: number;
};

/**
 * Jobs to cover start-up. Single: jobs needed and a week pick.
 * Multi: a typical week, weekly keep, and weeks.
 */
export type JobsAnswer = {
  kind: "jobs";
  version: 1;
  mode: "single" | "multi";
  startupTotal: number;
  weeksNeeded: number;
  /** Single path. */
  jobsNeeded?: number;
  jobsPerWeek?: number;
  /** Option id N25–T25 when the learner picked a single-service week. */
  jobsPerWeekOptionId?: string;
  keptPerJob?: number;
  /** Multi path. */
  typicalWeek?: readonly TypicalWeekRow[];
  weeklyKeep?: number;
};

export type LaunchpadAnswer = BusinessIdentityAnswer | SelectionAnswer | RankingAnswer | FieldsAnswer | CostsAnswer | PriceAnswer | JobsAnswer;

/** Saved answers by answerKey (stored with progress on the test route). */
export type LaunchpadAnswers = Readonly<Record<string, LaunchpadAnswer>>;

/** Longest id or field value we keep from storage (content limits are stricter; this only bounds junk). */
const STORED_TEXT_MAX = 2000;
const STORED_LIST_MAX = 50;
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/;
const FIELD_NAME_RE = /^[a-z][A-Za-z0-9]{0,47}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function idList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const v of value.slice(0, STORED_LIST_MAX)) if (typeof v === "string" && ID_RE.test(v) && !out.includes(v)) out.push(v);
  return out;
}

export function parseSelectionAnswer(value: unknown): SelectionAnswer | null {
  if (!isRecord(value) || value.kind !== "selection" || value.version !== 1) return null;
  return { kind: "selection", version: 1, selected: idList(value.selected) };
}

export function parseRankingAnswer(value: unknown): RankingAnswer | null {
  if (!isRecord(value) || value.kind !== "ranking" || value.version !== 1) return null;
  const order = idList(value.order);
  return { kind: "ranking", version: 1, order, notApplicable: idList(value.notApplicable).filter((id) => order.includes(id)) };
}

function moneyAmount(value: unknown, whole: boolean): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1_000_000) return null;
  const cents = Math.round(value * 100) / 100;
  return whole ? Math.round(cents) : cents;
}

function costLines(value: unknown, whole: boolean): CostLine[] {
  if (!Array.isArray(value)) return [];
  const out: CostLine[] = [];
  const seen = new Set<string>();
  for (const raw of value.slice(0, 40)) {
    if (!isRecord(raw) || typeof raw.id !== "string" || !ID_RE.test(raw.id) || seen.has(raw.id)) continue;
    if (typeof raw.label !== "string") continue;
    const amount = moneyAmount(raw.amount, whole);
    if (amount === null) continue;
    seen.add(raw.id);
    const line: CostLine = { id: raw.id, label: raw.label.replace(/\s+/g, " ").trim().slice(0, 80), amount };
    if (raw.custom === true) line.custom = true;
    out.push(line);
  }
  return out;
}

export function parseCostsAnswer(value: unknown): CostsAnswer | null {
  if (!isRecord(value) || value.kind !== "costs" || value.version !== 1 || !isRecord(value.startup)) return null;
  const startup = value.startup;
  const ongoingRaw = Array.isArray(value.ongoing) ? value.ongoing.slice(0, 20) : [];
  const ongoing: CostServiceLines[] = [];
  const seen = new Set<string>();
  for (const raw of ongoingRaw) {
    if (!isRecord(raw) || typeof raw.serviceId !== "string" || !ID_RE.test(raw.serviceId) || seen.has(raw.serviceId)) continue;
    if (typeof raw.label !== "string" || !raw.label.trim()) continue;
    seen.add(raw.serviceId);
    ongoing.push({
      serviceId: raw.serviceId,
      label: raw.label.replace(/\s+/g, " ").trim().slice(0, 80),
      lines: costLines(raw.lines, false),
      done: raw.done === true,
    });
  }
  const parsed: CostsAnswer = {
    kind: "costs",
    version: 1,
    chosenServiceIds: idList(value.chosenServiceIds),
    startup: {
      marketing: costLines(startup.marketing, true),
      starterGear: costLines(startup.starterGear, true),
      done: startup.done === true,
    },
    ongoing,
  };
  if (value.ongoingAcknowledged === true) parsed.ongoingAcknowledged = true;
  return parsed;
}

function wholePrice(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 9999) return null;
  return value;
}

export function parsePriceAnswer(value: unknown): PriceAnswer | null {
  if (!isRecord(value) || value.kind !== "price" || value.version !== 1 || !Array.isArray(value.prices)) return null;
  const prices: ServicePrice[] = [];
  const seen = new Set<string>();
  for (const raw of value.prices.slice(0, 20)) {
    if (!isRecord(raw) || typeof raw.serviceId !== "string" || !ID_RE.test(raw.serviceId) || seen.has(raw.serviceId)) continue;
    const price = wholePrice(raw.price);
    const cost = moneyAmount(raw.costPerJob, false);
    if (price === null || cost === null) continue;
    seen.add(raw.serviceId);
    prices.push({ serviceId: raw.serviceId, price, costPerJob: cost, keptPerJob: keptPerJob(price, cost) });
  }
  return { kind: "price", version: 1, prices };
}

function weekCount(value: unknown, max: number): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > max) return null;
  return value;
}

export function parseJobsAnswer(value: unknown): JobsAnswer | null {
  if (!isRecord(value) || value.kind !== "jobs" || value.version !== 1) return null;
  if (value.mode !== "single" && value.mode !== "multi") return null;
  const startup = moneyAmount(value.startupTotal, true);
  if (startup === null) return null;
  if (value.mode === "single") {
    const kept = moneyAmount(value.keptPerJob, false);
    const perWeek = weekCount(value.jobsPerWeek, 7);
    if (kept === null || perWeek === null || perWeek < 1) return null;
    const needed = jobsNeeded(startup, kept);
    if (needed === null) return null;
    const weeks = weeksFromJobs(needed, perWeek);
    if (weeks === null) return null;
    const optionId = typeof value.jobsPerWeekOptionId === "string" && ID_RE.test(value.jobsPerWeekOptionId) ? value.jobsPerWeekOptionId : undefined;
    return {
      kind: "jobs",
      version: 1,
      mode: "single",
      startupTotal: startup,
      keptPerJob: kept,
      jobsNeeded: needed,
      jobsPerWeek: perWeek,
      weeksNeeded: weeks,
      ...(optionId ? { jobsPerWeekOptionId: optionId } : {}),
    };
  }
  if (!Array.isArray(value.typicalWeek)) return null;
  const typicalWeek: TypicalWeekRow[] = [];
  const seen = new Set<string>();
  for (const raw of value.typicalWeek.slice(0, 20)) {
    if (!isRecord(raw) || typeof raw.serviceId !== "string" || !ID_RE.test(raw.serviceId) || seen.has(raw.serviceId)) continue;
    const jobs = weekCount(raw.jobsPerWeek, 7);
    const kept = moneyAmount(raw.keptPerJob, false);
    if (jobs === null || kept === null) continue;
    seen.add(raw.serviceId);
    typicalWeek.push({
      serviceId: raw.serviceId,
      jobsPerWeek: jobs,
      keptPerJob: kept,
      subtotal: (jobs * Math.round(kept * 100)) / 100,
    });
  }
  const weekly = weeklyKeep(typicalWeek);
  const weeks = weeksFromWeeklyKeep(startup, weekly);
  if (weeks === null) return null;
  return { kind: "jobs", version: 1, mode: "multi", startupTotal: startup, typicalWeek, weeklyKeep: weekly, weeksNeeded: weeks };
}

export function parseFieldsAnswer(value: unknown): FieldsAnswer | null {
  if (!isRecord(value) || value.kind !== "fields" || value.version !== 1) return null;
  const values: Record<string, string | number> = {};
  if (isRecord(value.values)) {
    for (const [name, raw] of Object.entries(value.values)) {
      if (!FIELD_NAME_RE.test(name)) continue;
      if (typeof raw === "number" && Number.isFinite(raw)) values[name] = raw;
      else if (typeof raw === "string" && raw.trim()) values[name] = raw.slice(0, STORED_TEXT_MAX);
    }
  }
  const out: FieldsAnswer = { kind: "fields", version: 1, values };
  if (value.notApplicable === true) out.notApplicable = true;
  return out;
}

/** One stored answer of any known kind, or null. */
export function parseLaunchpadAnswer(value: unknown): LaunchpadAnswer | null {
  if (!isRecord(value)) return null;
  switch (value.kind) {
    case "business-identity":
      return parseBusinessIdentityAnswer(value);
    case "selection":
      return parseSelectionAnswer(value);
    case "ranking":
      return parseRankingAnswer(value);
    case "fields":
      return parseFieldsAnswer(value);
    case "costs":
      return parseCostsAnswer(value);
    case "price":
      return parsePriceAnswer(value);
    case "jobs":
      return parseJobsAnswer(value);
    default:
      return null;
  }
}

/** Reads the whole answers map; drops keys or values that do not parse. */
export function parseLaunchpadAnswers(value: unknown): LaunchpadAnswers {
  if (!isRecord(value)) return {};
  const out: Record<string, LaunchpadAnswer> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!ANSWER_KEY_RE.test(key)) continue;
    const parsed = parseLaunchpadAnswer(raw);
    if (parsed) out[key] = parsed;
  }
  return out;
}

/* Typed reads: the answer under `key` when it is of that kind, else undefined. */

export function identityAnswerOf(answers: LaunchpadAnswers | undefined, key: string): BusinessIdentityAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "business-identity" ? a : undefined;
}

export function selectionOf(answers: LaunchpadAnswers | undefined, key: string): SelectionAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "selection" ? a : undefined;
}

export function rankingOf(answers: LaunchpadAnswers | undefined, key: string): RankingAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "ranking" ? a : undefined;
}

export function fieldsOf(answers: LaunchpadAnswers | undefined, key: string): FieldsAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "fields" ? a : undefined;
}

export function costsOf(answers: LaunchpadAnswers | undefined, key: string): CostsAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "costs" ? a : undefined;
}

export function priceOf(answers: LaunchpadAnswers | undefined, key: string): PriceAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "price" ? a : undefined;
}

export function jobsOf(answers: LaunchpadAnswers | undefined, key: string): JobsAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "jobs" ? a : undefined;
}

export const selectionAnswer = (selected: readonly string[]): SelectionAnswer => ({ kind: "selection", version: 1, selected });
export const rankingAnswer = (order: readonly string[], notApplicable: readonly string[] = []): RankingAnswer => ({
  kind: "ranking",
  version: 1,
  order,
  notApplicable,
});
export const fieldsAnswer = (values: Record<string, string | number>, notApplicable = false): FieldsAnswer =>
  notApplicable ? { kind: "fields", version: 1, values, notApplicable: true } : { kind: "fields", version: 1, values };
