"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import type { LaunchpadFloor } from "@/lib/launchpad/content/types";
import { BUDGET_JARS, budgetPercents, earnedAmount, readBudgetMoneyMade, readBudgetSplit, splitDollars, storedGivingPercent } from "@/lib/launchpad/content/budgeting/split";
import { formatWholeMoney } from "@/lib/dashboard/currency/format-money";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { AccentLabel, WORKBOOK_ANSWER, WORKBOOK_BODY } from "@/components/launchpad/venture/handbook/paper-art";

export function budgetPercentsFor(floors: readonly LaunchpadFloor[], answers: LaunchpadAnswers | undefined): number[] {
  return budgetPercents(storedGivingPercent(floors, answers));
}

/**
 * "My budget split" on the shared workbook page.
 * Jar percents stay the Budgeting bronze split. Dollars are Money made times those percents.
 */
export function BudgetSplit({
  heading = "My budget split",
  percents,
}: {
  heading?: string;
  /** Jar percents. When omitted, the saved bronze split wins, then Giving from Module 1 or 5. */
  percents?: readonly number[];
}) {
  const ctx = useLaunchpadAnswers();
  const shares = percents ?? readBudgetSplit() ?? budgetPercentsFor(ctx?.floors ?? [], ctx?.answers);
  const s = useSurfaceCopy();
  const currency = readCurrencyPreference();
  const moneyMade = readBudgetMoneyMade();
  const amounts = splitDollars(earnedAmount(moneyMade ?? ""), shares);
  return (
    <div data-budget-sheet="">
      <AccentLabel as="h2">{heading}</AccentLabel>
      {moneyMade != null ? (
        <p className={`mt-3 ${WORKBOOK_BODY}`} data-money-made-playback="">
          {s.workbook.moneyMade} <span className={WORKBOOK_ANSWER}>{formatWholeMoney(earnedAmount(moneyMade), currency)}</span>
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
            <span className={`text-right ${WORKBOOK_ANSWER}`} data-budget-amount={jar.id}>{formatWholeMoney(amounts[index] ?? 0, currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
