/** A choice's `SET cash=6` or `SET cash=cash-8` instruction. */
export type CashUpdate =
  | { op: "set"; amount: number }
  | { op: "adjust"; delta: number };

const SET_CASH = /SET\s+cash\s*=\s*(?:cash\s*([+-])\s*(\d+)|(\d+))/i;

/** Pull a cash instruction out of a choice value. Button labels stay separate. */
export function parseCashUpdate(raw: string): CashUpdate | undefined {
  const match = SET_CASH.exec(raw);
  if (!match) return undefined;
  const absolute = match[3];
  if (absolute !== undefined) {
    return { op: "set", amount: Number(absolute) };
  }
  const delta = Number(match[2]);
  if (!Number.isFinite(delta)) return undefined;
  return { op: "adjust", delta: match[1] === "-" ? -delta : delta };
}

export function applyCashUpdate(current: number | null, update: CashUpdate): number {
  if (update.op === "set") return update.amount;
  return (current ?? 0) + update.delta;
}

/** `IF cash >= 8` / `IF cash = 5` on a decision choice. */
export type CashComparison = {
  op: "gte" | "gt" | "lte" | "lt" | "eq" | "neq";
  amount: number;
};

/**
 * Conditional choices stay hidden until cash is known and does not match.
 * Unset cash (a mid-lesson preview) shows every choice so the screen is not empty.
 */
export function cashMatches(
  comparison: CashComparison | undefined,
  cash: number | null,
): boolean {
  if (!comparison) return true;
  if (cash === null) return true;
  switch (comparison.op) {
    case "gte":
      return cash >= comparison.amount;
    case "gt":
      return cash > comparison.amount;
    case "lte":
      return cash <= comparison.amount;
    case "lt":
      return cash < comparison.amount;
    case "eq":
      return cash === comparison.amount;
    case "neq":
      return cash !== comparison.amount;
  }
}

/** `{cash}` reads as "some money" until a choice has set a number. */
export function displayCashText(text: string, cash: number | null): string {
  if (cash === null) return text.split("{cash}").join("some money");
  return fillCashPlaceholder(text, cash);
}

/** Next with nothing selected is a mistake only on a graded question. */
export function unselectedNextIsMistake(decisionPath: boolean | undefined): boolean {
  return decisionPath !== true;
}

/** `Lars has {cash} left` → `Lars has $6 left`. Leaves the token when cash is still unknown. */
export function fillCashPlaceholder(text: string, cash: number | null): string {
  if (cash === null || !text.includes("{cash}")) return text;
  return text.split("{cash}").join(`$${cash}`);
}
