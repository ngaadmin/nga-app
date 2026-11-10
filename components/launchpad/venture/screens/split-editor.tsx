"use client";

import { useEffect, useState } from "react";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { BUDGET_JARS, budgetPercents, readBudgetSplit, stepSplitPercent, storedGivingPercent } from "@/lib/launchpad/content/budgeting/split";

/** The small Academy emergencies jar, used as the row marker. */
export const SPLIT_JAR_SRC = "/assets/illustrations/characters/pairs/prop-ex-m1-emergencies-jar-r1.webp";

/** Four budget rows on the shared lesson page. Other is not included. */
export function SplitEditor({ onChange }: { onChange: (percents: readonly number[]) => void }) {
  const ctx = useLaunchpadAnswers();
  const [rows, setRows] = useState<number[]>(() => readBudgetSplit() ?? budgetPercents(storedGivingPercent(ctx?.floors ?? [], ctx?.answers)));
  useEffect(() => {
    onChange(rows);
  }, [onChange, rows]);
  const set = (next: number[]) => {
    setRows(next);
    onChange(next);
  };
  const total = rows.reduce((sum, value) => sum + value, 0);
  return (
    <div data-budget-editor="">
      <ul className="flex flex-col gap-3">
        {BUDGET_JARS.map((jar, index) => (
          <li key={jar.id} className="flex items-center gap-2">
            <img src={SPLIT_JAR_SRC} alt="" width={40} height={40} className="h-10 w-10 flex-none object-contain" />
            <span className="min-w-0 flex-1 font-sans text-[18px] font-normal leading-[26px] text-[#19347D]">{jar.label}</span>
            <button type="button" aria-label={`Less ${jar.label}`} className="flex size-11 items-center justify-center rounded-full font-sans text-[16px] font-semibold leading-none text-[#19347D] shadow-[inset_0_0_0_1.5px_#D5DAE3]" onClick={() => set(rows.map((value, i) => (i === index ? stepSplitPercent(value, -1) : value)))}>−</button>
            <span className="w-14 text-center font-sans text-[18px] font-semibold leading-[26px] text-[#19347D]">{rows[index]}%</span>
            <button type="button" aria-label={`More ${jar.label}`} className="flex size-11 items-center justify-center rounded-full font-sans text-[16px] font-semibold leading-none text-[#19347D] shadow-[inset_0_0_0_1.5px_#D5DAE3]" onClick={() => set(rows.map((value, i) => (i === index ? stepSplitPercent(value, 1) : value)))}>+</button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-center font-sans text-[18px] font-semibold leading-[26px] text-[#19347D]" data-split-total="">Total {total}%</p>
    </div>
  );
}
