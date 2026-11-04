import {
  ANSWER_KEY_RE,
  parseBusinessIdentityAnswer,
  type BusinessIdentityAnswer,
} from "@/lib/launchpad/content/identity";

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

export type LaunchpadAnswer = BusinessIdentityAnswer | SelectionAnswer | RankingAnswer | FieldsAnswer;

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

export const selectionAnswer = (selected: readonly string[]): SelectionAnswer => ({ kind: "selection", version: 1, selected });
export const rankingAnswer = (order: readonly string[], notApplicable: readonly string[] = []): RankingAnswer => ({
  kind: "ranking",
  version: 1,
  order,
  notApplicable,
});
export const fieldsAnswer = (values: Record<string, string | number>, notApplicable = false): FieldsAnswer =>
  notApplicable ? { kind: "fields", version: 1, values, notApplicable: true } : { kind: "fields", version: 1, values };
