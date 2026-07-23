import { roundAudAmount } from "@/lib/dashboard/destination-jars";

export type LedgerFlow = "in" | "out";

export type LedgerCategory =
  | "deposit"
  | "cash_in"
  | "allocation"
  | "spend"
  | "transfer"
  | "savings_goal"
  | "goal_spend"
  | "milestone"
  | "setup"
  | "info";

export type LedgerEntry = {
  id: string;
  message: string;
  category: LedgerCategory;
  timestamp: number;
  amount?: number;
  flow?: LedgerFlow;
  highlight?: boolean;
};

export type LedgerTimePeriod = "week" | "month" | "year" | "all";

export type LedgerFlowSummary = {
  totalIn: number;
  totalOut: number;
};

const INFLOW_CATEGORIES: readonly LedgerCategory[] = ["deposit", "cash_in"];
const OUTFLOW_CATEGORIES: readonly LedgerCategory[] = ["spend", "goal_spend"];

const MS_PER_DAY = 86_400_000;

export function ledgerPeriodStartMs(
  period: LedgerTimePeriod,
  now = Date.now(),
): number | null {
  switch (period) {
    case "week":
      return now - 7 * MS_PER_DAY;
    case "month":
      return now - 30 * MS_PER_DAY;
    case "year":
      return now - 365 * MS_PER_DAY;
    case "all":
      return null;
  }
}

export function filterLedgerByPeriod(
  entries: readonly LedgerEntry[],
  period: LedgerTimePeriod,
  now = Date.now(),
): LedgerEntry[] {
  const startMs = ledgerPeriodStartMs(period, now);
  if (startMs === null) return [...entries];
  return entries.filter((entry) => entry.timestamp >= startMs);
}

export function summarizeLedgerFlow(
  entries: readonly LedgerEntry[],
): LedgerFlowSummary {
  return entries.reduce<LedgerFlowSummary>(
    (totals, entry) => {
      if (entry.amount === undefined || entry.amount <= 0) return totals;

      if (INFLOW_CATEGORIES.includes(entry.category)) {
        totals.totalIn = roundAudAmount(totals.totalIn + entry.amount);
      }
      if (OUTFLOW_CATEGORIES.includes(entry.category)) {
        totals.totalOut = roundAudAmount(totals.totalOut + entry.amount);
      }
      return totals;
    },
    { totalIn: 0, totalOut: 0 },
  );
}

export function partitionLedgerEntries(entries: readonly LedgerEntry[]): {
  inflows: LedgerEntry[];
  outflows: LedgerEntry[];
  activity: LedgerEntry[];
} {
  const inflows: LedgerEntry[] = [];
  const outflows: LedgerEntry[] = [];
  const activity: LedgerEntry[] = [];

  for (const entry of entries) {
    if (INFLOW_CATEGORIES.includes(entry.category)) {
      inflows.push(entry);
    } else if (OUTFLOW_CATEGORIES.includes(entry.category)) {
      outflows.push(entry);
    } else {
      activity.push(entry);
    }
  }

  const byNewest = (a: LedgerEntry, b: LedgerEntry) => b.timestamp - a.timestamp;
  inflows.sort(byNewest);
  outflows.sort(byNewest);
  activity.sort(byNewest);

  return { inflows, outflows, activity };
}

export function formatLedgerRowDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(timestamp));
}

export function ledgerFlowBarWidths(summary: LedgerFlowSummary): {
  inPercent: number;
  outPercent: number;
} {
  const total = summary.totalIn + summary.totalOut;
  if (total <= 0) {
    return { inPercent: 50, outPercent: 50 };
  }
  return {
    inPercent: Math.round((summary.totalIn / total) * 100),
    outPercent: Math.round((summary.totalOut / total) * 100),
  };
}
