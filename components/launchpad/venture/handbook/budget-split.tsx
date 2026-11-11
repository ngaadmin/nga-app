"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import type { LaunchpadFloor } from "@/lib/launchpad/content/types";
import { BUDGET_JARS, budgetPercents, earnedAmount, earnedDigits, readBudgetSplit, splitDollars, storedGivingPercent } from "@/lib/launchpad/content/budgeting/split";
import { formatWholeMoney } from "@/lib/dashboard/currency/format-money";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { ChosenValue } from "@/components/launchpad/venture/handbook/chosen-value";
import { AccentLabel, WORKBOOK_ANSWER, WORKBOOK_BODY } from "@/components/launchpad/venture/handbook/paper-art";

const EARNED_KEY = "lp-venture-test:budget-earned";

export function budgetPercentsFor(floors: readonly LaunchpadFloor[], answers: LaunchpadAnswers | undefined): number[] {
  return budgetPercents(storedGivingPercent(floors, answers));
}

/** "My budget split" on the shared workbook page. A saved earned amount plays back as text. */
export function BudgetSplit({
  heading = "My budget split",
  earnedLabel = "Money I earned",
  percents,
}: {
  heading?: string;
  earnedLabel?: string;
  /** Jar percents. When omitted, Giving comes from Module 1 or falls back to 5. */
  percents?: readonly number[];
}) {
  const ctx = useLaunchpadAnswers();
  const s = useSurfaceCopy();
  const shares = percents ?? readBudgetSplit() ?? budgetPercentsFor(ctx?.floors ?? [], ctx?.answers);
  const raw = typeof window === "undefined" ? "" : (window.localStorage.getItem(EARNED_KEY) ?? "");
  const filled = earnedDigits(raw).length > 0;
  const currency = readCurrencyPreference();
  const amounts = filled ? splitDollars(earnedAmount(raw), shares) : [];
  return (
    <div data-budget-sheet="">
      <AccentLabel as="h2">{heading}</AccentLabel>
      {filled ? (
        <p className={`mt-4 ${WORKBOOK_BODY}`} data-budget-earned="">
          {earnedLabel} <ChosenValue>{formatWholeMoney(earnedAmount(raw), currency)}</ChosenValue>
        </p>
      ) : null}
      <ul className="mt-4 flex flex-col gap-[22px]">
        {BUDGET_JARS.map((jar, index) => (
          <li key={jar.id} className="grid grid-cols-[minmax(0,1fr)_3.25rem_4.25rem] items-center gap-x-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <img src={jar.icon} alt="" width={32} height={32} className="h-8 w-8 flex-none object-contain" />
              <span className={WORKBOOK_BODY}>{s.jars[jar.id]}</span>
            </span>
            <span className={`text-right ${WORKBOOK_ANSWER}`}>{shares[index] ?? 0}%</span>
            <span className={`text-right ${WORKBOOK_ANSWER}`} data-budget-amount={jar.id}>{filled ? formatWholeMoney(amounts[index] ?? 0, currency) : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
