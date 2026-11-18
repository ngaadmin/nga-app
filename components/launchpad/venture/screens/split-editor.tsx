"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { useEffect, useState } from "react";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { budgetPercents, earnedAmount, earnedDigits, readBudgetMoneyMade, readBudgetSplit, splitDollars, stepSplitPercent, storedGivingPercent, writeBudgetMoneyMade, BUDGET_JARS } from "@/lib/launchpad/content/budgeting/split";
import { currencySymbol } from "@/lib/dashboard/currency/format-money";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { LESSON_BODY, LESSON_HINT, ScreenPrompt } from "@/components/launchpad/venture/screens/screen-ui";

/** Plain jar, no glow. 32×48 on screen. */
export const SPLIT_JAR_SRC = "/launchpad/budgeting/l6-jar.webp";

export type SplitCopy = {
  context: string;
  guidance: string;
  ask: string;
  madeAsk: string;
  madeLabel: string;
  madeHelp: string;
  madeDefault: string;
};

/** Four budget rows on the shared lesson page. Other is not included. */
export function SplitEditor({ copy, onChange }: { copy: SplitCopy; onChange: (percents: readonly number[]) => void }) {
  const s = useSurfaceCopy();
  const ctx = useLaunchpadAnswers();
  const [rows, setRows] = useState<number[]>(() => readBudgetSplit() ?? budgetPercents(storedGivingPercent(ctx?.floors ?? [], ctx?.answers)));
  const [made, setMade] = useState(() => readBudgetMoneyMade() ?? copy.madeDefault);
  useEffect(() => {
    onChange(rows);
  }, [onChange, rows]);
  useEffect(() => {
    writeBudgetMoneyMade(made);
  }, [made]);
  const set = (next: number[]) => {
    setRows(next);
    onChange(next);
  };
  const total = rows.reduce((sum, value) => sum + value, 0);
  const symbol = currencySymbol(readCurrencyPreference());
  const dollars = splitDollars(earnedAmount(made), rows);
  return (
    <div data-budget-editor="">
      <p className={`mt-3 ${LESSON_BODY}`} data-split-copy="context">{copy.context}</p>
      <p className={`mt-3 ${LESSON_HINT}`} data-split-copy="guidance">{copy.guidance}</p>
      <div className="mt-3" data-money-made="">
        <p className={LESSON_BODY}>{copy.madeAsk}</p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <span className="font-sans text-[18px] font-semibold leading-[26px] text-[#19347D]">{copy.madeLabel}</span>
          <label className="flex h-9 w-[88px] shrink-0 items-center gap-0.5 rounded-[10px] bg-white px-2 shadow-[inset_0_0_0_1.5px_#D9DEE8]">
            <span className="font-sans text-[16px] leading-[23px] text-[#4A5568]" aria-hidden="true">{symbol}</span>
            <input
              inputMode="numeric"
              aria-label={copy.madeLabel}
              value={made}
              onChange={(event) => {
                const next = earnedDigits(event.target.value);
                setMade(next);
                writeBudgetMoneyMade(next);
              }}
              className="w-full bg-transparent text-right font-sans text-[18px] font-bold leading-[26px] tabular-nums text-[#19347D] outline-none"
            />
          </label>
        </div>
        <p className={`mt-1 ${LESSON_HINT}`}>{copy.madeHelp}</p>
      </div>
      <ScreenPrompt tone="question" flush>{copy.ask}</ScreenPrompt>
      <ul className="mt-3 flex flex-col gap-2">
        {BUDGET_JARS.map((jar, index) => (
          <li key={jar.id} className="flex items-center gap-2">
            <img src={SPLIT_JAR_SRC} alt="" width={32} height={48} className="h-12 w-8 flex-none bg-transparent object-contain shadow-none" />
            <span className="min-w-0 flex-1">
              <span className="block font-sans text-[18px] font-normal leading-[26px] text-[#19347D]">{s.jars[jar.id]}</span>
              <span className="block font-sans text-[18px] font-normal leading-[26px] text-[#8A94A8]" data-split-dollars={jar.id}>{symbol}{dollars[index] ?? 0}</span>
            </span>
            <button type="button" aria-label={`Less ${s.jars[jar.id]}`} className="flex size-11 items-center justify-center rounded-full font-sans text-[16px] font-semibold leading-none text-[#19347D] shadow-[inset_0_0_0_1.5px_#D5DAE3]" onClick={() => set(rows.map((value, i) => (i === index ? stepSplitPercent(value, -1) : value)))}>−</button>
            <span className="w-14 text-center font-sans text-[18px] font-semibold leading-[26px] text-[#19347D]">{rows[index]}%</span>
            <button type="button" aria-label={`More ${s.jars[jar.id]}`} className="flex size-11 items-center justify-center rounded-full font-sans text-[16px] font-semibold leading-none text-[#19347D] shadow-[inset_0_0_0_1.5px_#D5DAE3]" onClick={() => set(rows.map((value, i) => (i === index ? stepSplitPercent(value, 1) : value)))}>+</button>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-center font-sans text-[18px] font-semibold leading-[26px] text-[#19347D]" data-split-total="">{s.chrome.totalPercent.replace("{n}", String(total))}</p>
    </div>
  );
}
