"use client";

import { useState } from "react";
import type { LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import type { LaunchpadFloor } from "@/lib/launchpad/content/types";
import { BUDGET_JARS, budgetPercents, earnedAmount, earnedDigits, readBudgetSplit, splitDollars, storedGivingPercent } from "@/lib/launchpad/content/budgeting/split";
import { formatWholeMoney } from "@/lib/dashboard/currency/format-money";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { AccentLabel, WORKBOOK_ANSWER, WORKBOOK_BODY, WORKBOOK_SUB } from "@/components/launchpad/venture/handbook/paper-art";

const EARNED_KEY = "lp-venture-test:budget-earned";

function Pencil() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#4A5568" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

export function budgetPercentsFor(floors: readonly LaunchpadFloor[], answers: LaunchpadAnswers | undefined): number[] {
  return budgetPercents(storedGivingPercent(floors, answers));
}

/** "My budget split" on the shared workbook page. The earned amount stays on this device. */
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
  const shares = percents ?? readBudgetSplit() ?? budgetPercentsFor(ctx?.floors ?? [], ctx?.answers);
  const [raw, setRaw] = useState(() => {
    if (typeof window === "undefined") return "100";
    const saved = window.localStorage.getItem(EARNED_KEY);
    return saved == null ? "100" : earnedDigits(saved);
  });
  const currency = readCurrencyPreference();
  const amounts = splitDollars(earnedAmount(raw), shares);
  return (
    <div data-budget-sheet="">
      <AccentLabel as="h2">{heading}</AccentLabel>
      <div className="mt-4 flex items-center justify-between gap-3">
        <h3 className={WORKBOOK_SUB}>{earnedLabel}</h3>
        <button type="button" aria-label="Edit money I earned" className="flex size-11 items-center justify-center" onClick={() => document.getElementById("budget-earned")?.focus()}>
          <Pencil />
        </button>
      </div>
      <label className="mt-1 inline-flex min-w-[88px] items-baseline border-b-2 border-[#0CC1E0] pb-0.5" htmlFor="budget-earned">
        <span className={WORKBOOK_ANSWER}>$</span>
        <input
          id="budget-earned"
          aria-label={earnedLabel}
          inputMode="numeric"
          autoComplete="off"
          placeholder="100"
          value={raw}
          onChange={(event) => {
            const next = earnedDigits(event.target.value);
            setRaw(next);
            window.localStorage.setItem(EARNED_KEY, next);
          }}
          className={`w-[6ch] bg-transparent outline-none placeholder:text-[#19347D]/40 ${WORKBOOK_ANSWER}`}
        />
      </label>
      <ul className="mt-4 flex flex-col gap-[22px]">
        {BUDGET_JARS.map((jar, index) => (
          <li key={jar.id} className="grid grid-cols-[minmax(0,1fr)_3.25rem_4.25rem] items-center gap-x-3">
            <span className="flex min-w-0 items-center gap-2.5">
              <img src={jar.icon} alt="" width={32} height={32} className="h-8 w-8 flex-none object-contain" />
              <span className={WORKBOOK_BODY}>{jar.label}</span>
            </span>
            <span className={`text-right ${WORKBOOK_ANSWER}`}>{shares[index] ?? 0}%</span>
            <span className={`text-right ${WORKBOOK_ANSWER}`} data-budget-amount={jar.id}>{formatWholeMoney(amounts[index] ?? 0, currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
