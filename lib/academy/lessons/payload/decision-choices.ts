import {
  parseCashUpdate,
  type CashComparison,
  type CashUpdate,
} from "@/lib/academy/lessons/payload/cash-placeholder";

export type DecisionChoice = {
  label: string;
  cashUpdate?: CashUpdate;
  goToLabel?: string;
  showWhen?: CashComparison;
  /** Hub button that stays locked until every other skill on the screen is done. */
  requiresCompletedHub?: boolean;
};

export type DecisionPrompt = {
  text: string;
  showWhen: CashComparison;
};

const CLAUSE =
  /IF\s+cash\s*(?:>=|<=|>|<|=)\s*\d+\s*THEN|ELSE\b|TEXT\s*:|CHOICE\s+[A-Z]\s*:|BUTTON\s*:/gi;

const IF_CLAUSE = /^IF\s+cash\s*(>=|<=|>|<|=)\s*(\d+)\s*THEN\s*([\s\S]*)$/i;
const ELSE_CLAUSE = /^ELSE\s*([\s\S]*)$/i;
const TEXT_CLAUSE = /^TEXT\s*:\s*([\s\S]*)$/i;
const CHOICE_CLAUSE = /^(?:CHOICE\s+[A-Z]|BUTTON)\s*:\s*([\s\S]*)$/i;

function clauses(raw: string): string[] {
  const starts: number[] = [];
  CLAUSE.lastIndex = 0;
  for (const match of raw.matchAll(CLAUSE)) {
    starts.push(match.index ?? 0);
  }
  if (starts.length === 0) return [];
  return starts.map((start, index) => {
    const end = starts[index + 1] ?? raw.length;
    return raw.slice(start, end).trim();
  });
}

function comparison(symbol: string, amount: number): CashComparison {
  switch (symbol) {
    case ">=":
      return { op: "gte", amount };
    case ">":
      return { op: "gt", amount };
    case "<=":
      return { op: "lte", amount };
    case "<":
      return { op: "lt", amount };
    default:
      return { op: "eq", amount };
  }
}

function negate(comparison: CashComparison): CashComparison {
  switch (comparison.op) {
    case "gte":
      return { op: "lt", amount: comparison.amount };
    case "gt":
      return { op: "lte", amount: comparison.amount };
    case "lte":
      return { op: "gt", amount: comparison.amount };
    case "lt":
      return { op: "gte", amount: comparison.amount };
    case "eq":
      return { op: "neq", amount: comparison.amount };
    case "neq":
      return { op: "eq", amount: comparison.amount };
  }
}

function goScreenLabel(value: string): string | undefined {
  return /GO\s+Screen\s+([A-Za-z0-9-]+)/i.exec(value)?.[1];
}

function buttonLabel(value: string): string {
  const shown = /show button\s+["“]([^"”]+)["”]/i.exec(value);
  const head = (shown?.[1] ?? value).split(/\s*→\s*/)[0] ?? "";
  return head.replace(/\s+/g, " ").trim();
}

function readChoice(body: string, showWhen?: CashComparison): DecisionChoice | undefined {
  const label = buttonLabel(body);
  if (!label) return undefined;
  const cashUpdate = parseCashUpdate(body);
  const goToLabel = goScreenLabel(body);
  const requiresCompletedHub = /\bWHEN\s+complete\b/i.test(body);
  return {
    label,
    ...(cashUpdate ? { cashUpdate } : {}),
    ...(goToLabel ? { goToLabel } : {}),
    ...(showWhen ? { showWhen } : {}),
    ...(requiresCompletedHub ? { requiresCompletedHub: true } : {}),
  };
}

export type DecisionScript = {
  choices: DecisionChoice[];
  prompts: DecisionPrompt[];
};

/**
 * Choices whose settings use `IF cash`, `ELSE show button`, or `BUTTON:`.
 * A same-line `IF` applies to that one choice. An `IF` that ends the line
 * applies until the next `IF`. `ELSE` covers only the button on its line.
 * `TEXT:` under an `IF` is the prompt for that cash branch.
 */
export function parseDecisionScript(raw: string): DecisionScript | undefined {
  if (!/\bIF\s+cash\b|show button|\bBUTTON\s*:/i.test(raw)) return undefined;
  const choices: DecisionChoice[] = [];
  const prompts: DecisionPrompt[] = [];
  let sticky: CashComparison | undefined;
  let lastIf: CashComparison | undefined;

  for (const clause of clauses(raw)) {
    const ifMatch = IF_CLAUSE.exec(clause);
    if (ifMatch) {
      const when = comparison(ifMatch[1] ?? "=", Number(ifMatch[2]));
      lastIf = when;
      const rest = (ifMatch[3] ?? "").replace(/^(?:CHOICE\s+[A-Z]|BUTTON)\s*:\s*/i, "").trim();
      if (!rest) {
        sticky = when;
        continue;
      }
      sticky = undefined;
      const choice = readChoice(rest, when);
      if (choice) choices.push(choice);
      continue;
    }

    const elseMatch = ELSE_CLAUSE.exec(clause);
    if (elseMatch) {
      sticky = undefined;
      const choice = readChoice(elseMatch[1] ?? "", lastIf ? negate(lastIf) : undefined);
      if (choice) choices.push(choice);
      continue;
    }

    const textMatch = TEXT_CLAUSE.exec(clause);
    if (textMatch) {
      const text = (textMatch[1] ?? "").replace(/\s+/g, " ").trim();
      if (text && sticky) prompts.push({ text, showWhen: sticky });
      continue;
    }

    const choiceMatch = CHOICE_CLAUSE.exec(clause);
    if (!choiceMatch) continue;
    const choice = readChoice(choiceMatch[1] ?? "", sticky);
    if (choice) choices.push(choice);
  }

  if (choices.length === 0 && prompts.length === 0) return undefined;
  return { choices, prompts };
}

export function parseDecisionChoices(raw: string): DecisionChoice[] | undefined {
  const script = parseDecisionScript(raw);
  return script && script.choices.length > 0 ? script.choices : undefined;
}

export function goToScreenLabel(value: string): string | undefined {
  return goScreenLabel(value);
}
