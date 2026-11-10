import { fieldsOf, type LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import type { LaunchpadFloor } from "@/lib/launchpad/content/types";

/** Default jars until screen 7 ("Now set your own split") exists. */
export const BUDGET_JARS = [
  { id: "giving", label: "Giving", icon: "/launchpad/budgeting/jar-giving.webp" },
  { id: "emergencies", label: "Emergencies", icon: "/launchpad/budgeting/jar-emergencies.webp" },
  { id: "pay", label: "Pay yourself", icon: "/launchpad/budgeting/jar-pay-yourself.webp" },
  { id: "grow", label: "Grow your business", icon: "/launchpad/budgeting/jar-grow.webp" },
] as const;

export type BudgetJarId = (typeof BUDGET_JARS)[number]["id"];

const GIVING_BASE = 5;
const PAY_BASE = 40;
/** Each + or − moves one row by this many percentage points. */
export const BUDGET_SPLIT_STEP = 5;
const SPLIT_KEY = "lp-venture-test:budget-split";

export function stepSplitPercent(value: number, direction: 1 | -1): number {
  return Math.min(100, Math.max(0, value + direction * BUDGET_SPLIT_STEP));
}

export function readBudgetSplit(): number[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SPLIT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length !== BUDGET_JARS.length) return null;
    if (!parsed.every((value) => typeof value === "number" && value >= 0 && value <= 100)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeBudgetSplit(percents: readonly number[]): void {
  window.localStorage.setItem(SPLIT_KEY, JSON.stringify(percents));
}

/**
 * Giving is the Module 1 percent when it is above 0, otherwise 5.
 * Emergencies, Pay yourself, and Grow your business stay 15, 40, and 40.
 * The four numbers do not have to add up to 100.
 */
export function budgetPercents(givingPercent: number | null): number[] {
  const giving = givingPercent != null && Number.isFinite(givingPercent) && givingPercent > 0 ? givingPercent : GIVING_BASE;
  return [giving, 15, PAY_BASE, 40];
}

/** Module 1 "Support a cause" percent, when the learner stored one above 0. */
export function storedGivingPercent(floors: readonly LaunchpadFloor[], answers: LaunchpadAnswers | undefined): number | null {
  for (const floor of floors) {
    for (const silver of floor.silvers) {
      const vision = silver.wrapUp?.type === "identity-wrap-up" ? silver.wrapUp.vision : undefined;
      if (!vision) continue;
      const raw = fieldsOf(answers, vision.causeGoalKey)?.values[vision.causePercentField];
      const pct = typeof raw === "number" ? raw : Number(String(raw ?? "").trim());
      if (Number.isFinite(pct) && pct > 0) return pct;
    }
  }
  return null;
}

/**
 * Whole dollars. Floor each share, then give leftover dollars to the largest
 * remainders. A tie goes to the higher percent, then to the earlier row.
 * The shares always add up to the amount.
 */
export function splitDollars(total: number, percents: readonly number[]): number[] {
  const amount = Math.max(0, Math.floor(Number.isFinite(total) ? total : 0));
  const raw = percents.map((percent) => (amount * percent) / 100);
  const out = raw.map((value) => Math.floor(value));
  let left = amount - out.reduce((sum, value) => sum + value, 0);
  const order = raw
    .map((value, index) => ({ index, remainder: value - out[index]!, percent: percents[index] ?? 0 }))
    .sort((a, b) => b.remainder - a.remainder || b.percent - a.percent || a.index - b.index);
  for (const row of order) {
    if (left <= 0) break;
    out[row.index] = (out[row.index] ?? 0) + 1;
    left -= 1;
  }
  return out;
}

/** Digits only. An empty field calculates from 100. Zero stays zero. */
export function earnedAmount(raw: string): number {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return 100;
  return Math.min(99999, Number.parseInt(digits, 10));
}

export function earnedDigits(raw: string): string {
  return raw.replace(/\D/g, "").replace(/^0+(?=\d)/, "").slice(0, 5);
}
