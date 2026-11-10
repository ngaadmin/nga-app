import {
  ANSWER_KEY_RE,
  parseBusinessIdentityAnswer,
  type BusinessIdentityAnswer,
} from "@/lib/launchpad/content/identity";
import { keptPerJob, weeklyKeep, weeksFromJobs, weeksFromWeeklyKeep, jobsNeeded } from "@/lib/launchpad/content/pricing/calc";
import { AFTER_HOW, AGREE_ITEMS, BEFORE_HOW, CHANNELS, FEEDBACK_HOW, PAYMENT_HOW, POLISH_QUESTIONS, PRACTICE_WHEN, PRACTICE_WHO, ALSO_MAX } from "@/lib/launchpad/content/getting-ready/copy";
import { isAvailabilitySlot } from "@/lib/launchpad/content/planning/catalog";

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
export type ComparedToOthers = "lower than" | "about the same as" | "higher than";

export type ServicePrice = {
  serviceId: string;
  /** Whole dollars. */
  price: number;
  costPerJob: number;
  keptPerJob: number;
  /** Set only when this service has a competitor range. Not a wrap-up field. */
  comparedToOthers?: ComparedToOthers;
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

/** One service's packages and extras (row 15). Ids are catalog option ids, plus one optional free-text extra. */
export type ServiceOffering = {
  serviceId: string;
  packages: readonly string[];
  packagesExtra?: string;
  addons: readonly string[];
  addonsExtra?: string;
};

export type OfferAnswer = {
  kind: "offer";
  version: 1;
  offerings: readonly ServiceOffering[];
  availability: readonly string[];
  availabilityExtra?: string;
};

export type CustomerAnswer = {
  kind: "customer";
  version: 1;
  numberAsked: number;
  yesNo: "yes" | "no";
  interests: readonly string[];
  interestExtra?: string;
  /** Availability slot ids. Old time chips stay in interests. */
  times?: readonly string[];
  timesExtra?: string;
};

export type CompetitorAnswer = {
  kind: "competitor";
  version: 1;
  walkersChecked: number;
  jobComparedId?: string;
  jobComparedExtra?: string;
  priceLow: number;
  priceHigh: number;
  addons: readonly string[];
  addonsExtra?: string;
  doDifferently: string;
  doDifferentlyExtra?: string;
};

export type FundingSource = "own_cash" | "borrow";
export type FundingRepayMode = "fixed_over_time" | "weekly_amount";
export type FundingRepayUnit = "weeks" | "months";

/** Row 26. No lender, charity, or cause. */
export type FundingAnswer = {
  kind: "funding";
  version: 1;
  fundingSource: FundingSource;
  startupTotal: number;
  currency: string;
  fundingRepayMode?: FundingRepayMode;
  fundingRepayCount?: number;
  fundingRepayUnit?: FundingRepayUnit;
  fundingPeriodPayment?: number;
  fundingWeeklyAmount?: number;
  fundingWeeksToRepay?: number;
};

export type FindCustomersAnswer = {
  kind: "find-customers";
  version: 1;
  channels: string[];
  channelsExtra?: string;
};

export type AgreeJobAnswer = {
  kind: "agree-job";
  version: 1;
  /** Which of the five sections the learner marked as read. No booking details. */
  understood: {
    collect_info: boolean;
    confirm_dog: boolean;
    when_where: boolean;
    cost_payment: boolean;
    plans_change: boolean;
  };
};

export type DeliverJobAnswer = {
  kind: "deliver-job";
  version: 1;
  beforeHow: string;
  afterHow: string;
};

export type WrapJobAnswer = {
  kind: "wrap-job";
  version: 1;
  paymentHow: readonly string[];
  feedbackHow: readonly string[];
};

export type PracticeRunAnswer = {
  kind: "practice-run";
  version: 1;
  who: string;
  service: string;
  when: string;
};

export type PolishResult = { result: "good" | "suggestions"; suggestion?: string };

export type PolishServiceAnswer = {
  kind: "polish-service";
  version: 1;
  rows: Record<string, PolishResult>;
};

/** Row 35. Selected channels and where each one is used. */
export type SalesChannelsAnswer = {
  kind: "sales-channels";
  version: 1;
  selected: readonly string[];
  where: Readonly<Record<string, readonly string[]>>;
  whereExtra?: Readonly<Record<string, string>>;
};

/** Row 36. Hook, proof, two services, and the leftover piece choices. */
export type MarketingMaterialsAnswer = {
  kind: "marketing-materials";
  version: 1;
  mainService?: string;
  secondService?: string;
  hook?: string;
  proof?: string;
  pieces: Readonly<Record<string, string>>;
};

/** Row 37. The target numbers only. */
export type TellPeopleAnswer = {
  kind: "tell-people";
  version: 1;
  counts: Readonly<Record<string, number>>;
};

/** Level 7 Reflect, Improve, or Grow. Lists and short ids only. */
export type LevelUpAnswer = {
  kind: "level-up";
  version: 1;
  selected: readonly string[];
  picks: Readonly<Record<string, string>>;
  starts: Readonly<Record<string, string>>;
  idea: string;
  option: string;
  success: string;
  start: string;
};

export type LaunchpadAnswer =
  | BusinessIdentityAnswer
  | SelectionAnswer
  | RankingAnswer
  | FieldsAnswer
  | CostsAnswer
  | PriceAnswer
  | JobsAnswer
  | OfferAnswer
  | CustomerAnswer
  | CompetitorAnswer
  | FundingAnswer
  | FindCustomersAnswer
  | AgreeJobAnswer
  | DeliverJobAnswer
  | WrapJobAnswer
  | PracticeRunAnswer
  | PolishServiceAnswer
  | SalesChannelsAnswer
  | MarketingMaterialsAnswer
  | TellPeopleAnswer
  | LevelUpAnswer;

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
    const compared = raw.comparedToOthers;
    const row: ServicePrice = { serviceId: raw.serviceId, price, costPerJob: cost, keptPerJob: keptPerJob(price, cost) };
    if (compared === "lower than" || compared === "about the same as" || compared === "higher than") row.comparedToOthers = compared;
    prices.push(row);
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

function stringMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (ID_RE.test(key) && typeof raw === "string" && raw.trim()) out[key] = raw.trim().slice(0, STORED_TEXT_MAX);
  }
  return out;
}

function idMap(value: unknown): Record<string, string[]> {
  if (!isRecord(value)) return {};
  const out: Record<string, string[]> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!ID_RE.test(key)) continue;
    const ids = idList(raw);
    if (ids.length) out[key] = ids;
  }
  return out;
}

function countMap(value: unknown): Record<string, number> {
  if (!isRecord(value)) return {};
  const out: Record<string, number> = {};
  for (const [key, raw] of Object.entries(value)) {
    const count = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
    if (ID_RE.test(key) && Number.isFinite(count) && count >= 0 && count <= 999) out[key] = Math.round(count);
  }
  return out;
}

export function parseSalesChannelsAnswer(value: unknown): SalesChannelsAnswer | null {
  if (!isRecord(value) || value.kind !== "sales-channels" || value.version !== 1) return null;
  const selected = idList(value.selected);
  if (selected.length === 0) return null;
  const extra = stringMap(value.whereExtra);
  return { kind: "sales-channels", version: 1, selected, where: idMap(value.where), ...(Object.keys(extra).length ? { whereExtra: extra } : {}) };
}

export function parseMarketingMaterialsAnswer(value: unknown): MarketingMaterialsAnswer | null {
  if (!isRecord(value) || value.kind !== "marketing-materials" || value.version !== 1) return null;
  const main = typeof value.mainService === "string" && ID_RE.test(value.mainService) ? value.mainService : undefined;
  const second = typeof value.secondService === "string" && ID_RE.test(value.secondService) ? value.secondService : undefined;
  const hook = typeof value.hook === "string" && ID_RE.test(value.hook) ? value.hook : undefined;
  const proof = typeof value.proof === "string" && ID_RE.test(value.proof) ? value.proof : undefined;
  return { kind: "marketing-materials", version: 1, ...(main ? { mainService: main } : {}), ...(second ? { secondService: second } : {}), ...(hook ? { hook } : {}), ...(proof ? { proof } : {}), pieces: stringMap(value.pieces) };
}

export function parseTellPeopleAnswer(value: unknown): TellPeopleAnswer | null {
  if (!isRecord(value) || value.kind !== "tell-people" || value.version !== 1) return null;
  return { kind: "tell-people", version: 1, counts: countMap(value.counts) };
}

export function salesChannelsOf(answers: LaunchpadAnswers | undefined, key: string): SalesChannelsAnswer | undefined {
  const value = answers?.[key];
  return value?.kind === "sales-channels" ? value : undefined;
}

export function marketingOf(answers: LaunchpadAnswers | undefined, key: string): MarketingMaterialsAnswer | undefined {
  const value = answers?.[key];
  return value?.kind === "marketing-materials" ? value : undefined;
}

export function tellPeopleOf(answers: LaunchpadAnswers | undefined, key: string): TellPeopleAnswer | undefined {
  const value = answers?.[key];
  return value?.kind === "tell-people" ? value : undefined;
}

function stringIdMap(value: unknown): Record<string, string> {
  if (!isRecord(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (ID_RE.test(key) && typeof raw === "string" && ID_RE.test(raw)) out[key] = raw;
  }
  return out;
}

export function parseLevelUpAnswer(value: unknown): LevelUpAnswer | null {
  if (!isRecord(value) || value.kind !== "level-up" || value.version !== 1) return null;
  const text = (raw: unknown) => (typeof raw === "string" && (raw === "" || ID_RE.test(raw)) ? raw : "");
  return {
    kind: "level-up",
    version: 1,
    selected: idList(value.selected),
    picks: stringIdMap(value.picks),
    starts: stringIdMap(value.starts),
    idea: text(value.idea),
    option: text(value.option),
    success: text(value.success),
    start: text(value.start),
  };
}

export function levelUpOf(answers: LaunchpadAnswers | undefined, key: string): LevelUpAnswer | undefined {
  const value = answers?.[key];
  return value?.kind === "level-up" ? value : undefined;
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
    case "offer":
      return parseOfferAnswer(value);
    case "customer":
      return parseCustomerAnswer(value);
    case "competitor":
      return parseCompetitorAnswer(value);
    case "funding":
      return parseFundingAnswer(value);
    case "find-customers":
      return parseFindCustomersAnswer(value);
    case "agree-job":
      return parseAgreeJobAnswer(value);
    case "deliver-job":
      return parseDeliverJobAnswer(value);
    case "wrap-job":
      return parseWrapJobAnswer(value);
    case "practice-run":
      return parsePracticeRunAnswer(value);
    case "polish-service":
      return parsePolishServiceAnswer(value);
    case "sales-channels":
      return parseSalesChannelsAnswer(value);
    case "marketing-materials":
      return parseMarketingMaterialsAnswer(value);
    case "tell-people":
      return parseTellPeopleAnswer(value);
    case "level-up":
      return parseLevelUpAnswer(value);
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

function optText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = value.replace(/\s+/g, " ").trim().slice(0, max);
  return text || undefined;
}

function idGroup(value: unknown): string[] {
  return idList(value).slice(0, 20);
}

export function parseOfferAnswer(value: unknown): OfferAnswer | null {
  if (!isRecord(value) || value.kind !== "offer" || value.version !== 1 || !Array.isArray(value.offerings)) return null;
  const offerings: ServiceOffering[] = [];
  const seen = new Set<string>();
  for (const raw of value.offerings.slice(0, 12)) {
    if (!isRecord(raw) || typeof raw.serviceId !== "string" || !ID_RE.test(raw.serviceId) || seen.has(raw.serviceId)) continue;
    seen.add(raw.serviceId);
    const row: ServiceOffering = { serviceId: raw.serviceId, packages: idGroup(raw.packages), addons: idGroup(raw.addons) };
    const packagesExtra = optText(raw.packagesExtra, 40);
    const addonsExtra = optText(raw.addonsExtra, 40);
    if (packagesExtra) row.packagesExtra = packagesExtra;
    if (addonsExtra) row.addonsExtra = addonsExtra;
    offerings.push(row);
  }
  const availabilityExtra = optText(value.availabilityExtra, 80) ?? optText(value.availability_extra, 80);
  return {
    kind: "offer",
    version: 1,
    offerings,
    availability: idGroup(value.availability),
    ...(availabilityExtra ? { availabilityExtra } : {}),
  };
}

export function parseCustomerAnswer(value: unknown): CustomerAnswer | null {
  if (!isRecord(value) || value.kind !== "customer" || value.version !== 1) return null;
  if (value.yesNo !== "yes" && value.yesNo !== "no") return null;
  if (typeof value.numberAsked !== "number" || !Number.isInteger(value.numberAsked) || value.numberAsked < 1 || value.numberAsked > 20) return null;
  const interestExtra = optText(value.interestExtra, 80);
  const times = idGroup(value.times).filter(isAvailabilitySlot);
  const timesExtra = optText(value.timesExtra, 80);
  return {
    kind: "customer",
    version: 1,
    numberAsked: value.numberAsked,
    yesNo: value.yesNo,
    interests: idGroup(value.interests),
    ...(interestExtra ? { interestExtra } : {}),
    ...(times.length ? { times } : {}),
    ...(timesExtra ? { timesExtra } : {}),
  };
}

export function parseCompetitorAnswer(value: unknown): CompetitorAnswer | null {
  if (!isRecord(value) || value.kind !== "competitor" || value.version !== 1) return null;
  if (typeof value.walkersChecked !== "number" || !Number.isInteger(value.walkersChecked) || value.walkersChecked < 1 || value.walkersChecked > 10) return null;
  const low = wholePrice(value.priceLow);
  const high = wholePrice(value.priceHigh);
  if (low === null || high === null || high < low) return null;
  if (typeof value.doDifferently !== "string" || !ID_RE.test(value.doDifferently)) return null;
  const jobId = typeof value.jobComparedId === "string" && ID_RE.test(value.jobComparedId) ? value.jobComparedId : undefined;
  const jobExtra = optText(value.jobComparedExtra, 40);
  const addonsExtra = optText(value.addonsExtra, 40);
  const ideaExtra = optText(value.doDifferentlyExtra, 80);
  if (!jobId && !jobExtra) return null;
  return {
    kind: "competitor",
    version: 1,
    walkersChecked: value.walkersChecked,
    ...(jobId ? { jobComparedId: jobId } : {}),
    ...(jobExtra ? { jobComparedExtra: jobExtra } : {}),
    priceLow: low,
    priceHigh: high,
    addons: idGroup(value.addons),
    ...(addonsExtra ? { addonsExtra } : {}),
    doDifferently: value.doDifferently,
    ...(ideaExtra ? { doDifferentlyExtra: ideaExtra } : {}),
  };
}

export function offerOf(answers: LaunchpadAnswers | undefined, key: string): OfferAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "offer" ? a : undefined;
}

export function customerOf(answers: LaunchpadAnswers | undefined, key: string): CustomerAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "customer" ? a : undefined;
}

export function competitorOf(answers: LaunchpadAnswers | undefined, key: string): CompetitorAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "competitor" ? a : undefined;
}

export function parseFundingAnswer(value: unknown): FundingAnswer | null {
  if (!isRecord(value) || value.kind !== "funding" || value.version !== 1) return null;
  if (value.fundingSource !== "own_cash" && value.fundingSource !== "borrow") return null;
  const startup = moneyAmount(value.startupTotal, true);
  if (startup === null) return null;
  const currency = typeof value.currency === "string" && /^[A-Z]{3}$/.test(value.currency) ? value.currency : "USD";
  const base: FundingAnswer = { kind: "funding", version: 1, fundingSource: value.fundingSource, startupTotal: startup, currency };
  if (value.fundingSource === "own_cash") return base;
  if (value.fundingRepayMode === "fixed_over_time") {
    const count = typeof value.fundingRepayCount === "number" && Number.isInteger(value.fundingRepayCount) && value.fundingRepayCount >= 1 ? value.fundingRepayCount : null;
    const unit = value.fundingRepayUnit === "weeks" || value.fundingRepayUnit === "months" ? value.fundingRepayUnit : null;
    if (count === null || !unit) return null;
    return { ...base, fundingRepayMode: "fixed_over_time", fundingRepayCount: count, fundingRepayUnit: unit, fundingPeriodPayment: Math.round((startup / count) * 100) / 100 };
  }
  if (value.fundingRepayMode === "weekly_amount") {
    const weekly = moneyAmount(value.fundingWeeklyAmount, false);
    if (weekly === null || weekly <= 0) return null;
    const weeks = startup <= 0 ? 0 : Math.ceil(Math.round(startup * 100) / Math.round(weekly * 100));
    return { ...base, fundingRepayMode: "weekly_amount", fundingWeeklyAmount: weekly, fundingWeeksToRepay: weeks };
  }
  return null;
}

export function fundingOf(answers: LaunchpadAnswers | undefined, key: string): FundingAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "funding" ? a : undefined;
}

function knownIds(value: unknown, allowed: readonly { id: string }[]): string[] {
  const ok = new Set(allowed.map((row) => row.id));
  return idList(value).filter((id) => ok.has(id));
}

export function parseFindCustomersAnswer(value: unknown): FindCustomersAnswer | null {
  if (!isRecord(value) || value.kind !== "find-customers" || value.version !== 1) return null;
  const channels = knownIds(value.channels, CHANNELS);
  if (channels.length < 1) return null;
  const extra = typeof value.channelsExtra === "string" ? value.channelsExtra.trim().slice(0, ALSO_MAX) : "";
  return { kind: "find-customers", version: 1, channels, ...(extra ? { channelsExtra: extra } : {}) };
}

export function parseAgreeJobAnswer(value: unknown): AgreeJobAnswer | null {
  if (!isRecord(value) || value.kind !== "agree-job" || value.version !== 1) return null;
  const understood = {
    collect_info: false,
    confirm_dog: false,
    when_where: false,
    cost_payment: false,
    plans_change: false,
  };
  if (isRecord(value.understood)) {
    for (const item of AGREE_ITEMS) understood[item.id] = value.understood[item.id] === true;
  } else {
    const ticked = new Set(knownIds(value.ticked, AGREE_ITEMS));
    for (const item of AGREE_ITEMS) if (ticked.has(item.id)) understood[item.id] = true;
  }
  return { kind: "agree-job", version: 1, understood };
}

export function parseDeliverJobAnswer(value: unknown): DeliverJobAnswer | null {
  if (!isRecord(value) || value.kind !== "deliver-job" || value.version !== 1) return null;
  const beforeHow = knownIds([value.beforeHow], BEFORE_HOW)[0];
  const afterHow = knownIds([value.afterHow], AFTER_HOW)[0];
  if (!beforeHow || !afterHow) return null;
  return { kind: "deliver-job", version: 1, beforeHow, afterHow };
}

function optionList(value: unknown, allowed: readonly { id: string }[]): string[] {
  if (typeof value === "string") return knownIds([value], allowed);
  return knownIds(value, allowed);
}

export function parseWrapJobAnswer(value: unknown): WrapJobAnswer | null {
  if (!isRecord(value) || value.kind !== "wrap-job" || value.version !== 1) return null;
  if ("funding_lender" in value) return null;
  return {
    kind: "wrap-job",
    version: 1,
    paymentHow: optionList(value.paymentHow, PAYMENT_HOW),
    feedbackHow: optionList(value.feedbackHow, FEEDBACK_HOW),
  };
}

export function parsePracticeRunAnswer(value: unknown): PracticeRunAnswer | null {
  if (!isRecord(value) || value.kind !== "practice-run" || value.version !== 1) return null;
  const who = knownIds([value.who], PRACTICE_WHO)[0];
  const when = knownIds([value.when], PRACTICE_WHEN)[0];
  const service = typeof value.service === "string" && ID_RE.test(value.service) ? value.service : "";
  if (!who || !when || !service) return null;
  return { kind: "practice-run", version: 1, who, service, when };
}

export function parsePolishServiceAnswer(value: unknown): PolishServiceAnswer | null {
  if (!isRecord(value) || value.kind !== "polish-service" || value.version !== 1 || !isRecord(value.rows)) return null;
  const rows: Record<string, PolishResult> = {};
  for (const question of POLISH_QUESTIONS) {
    const row = value.rows[question.id];
    if (!isRecord(row) || (row.result !== "good" && row.result !== "suggestions")) return null;
    const suggestion = typeof row.suggestion === "string" ? row.suggestion.trim().slice(0, 200) : "";
    rows[question.id] = row.result === "suggestions" ? { result: "suggestions", ...(suggestion ? { suggestion } : {}) } : { result: "good" };
  }
  return { kind: "polish-service", version: 1, rows };
}

export function findCustomersOf(answers: LaunchpadAnswers | undefined, key: string): FindCustomersAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "find-customers" ? a : undefined;
}

export function agreeJobOf(answers: LaunchpadAnswers | undefined, key: string): AgreeJobAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "agree-job" ? a : undefined;
}

export function deliverJobOf(answers: LaunchpadAnswers | undefined, key: string): DeliverJobAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "deliver-job" ? a : undefined;
}

export function wrapJobOf(answers: LaunchpadAnswers | undefined, key: string): WrapJobAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "wrap-job" ? a : undefined;
}

export function practiceRunOf(answers: LaunchpadAnswers | undefined, key: string): PracticeRunAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "practice-run" ? a : undefined;
}

export function polishServiceOf(answers: LaunchpadAnswers | undefined, key: string): PolishServiceAnswer | undefined {
  const a = answers?.[key];
  return a?.kind === "polish-service" ? a : undefined;
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
