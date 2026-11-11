"use client";

import { levelUpOf } from "@/lib/launchpad/content/answers";
import { weeklyFocusRows } from "@/lib/launchpad/content/level-up/model";
import type { LaunchpadLevelUpContent } from "@/lib/launchpad/content/level-up/model";
import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { AccentLabel, WORKBOOK_HINT, WORKBOOK_SUB } from "@/components/launchpad/venture/handbook/paper-art";
import { LargeScribble, SCRIBBLE_SRC } from "@/components/launchpad/venture/handbook/scribble-mark";

/** One Growing workbook page: week label, then the picked statement as an aqua bullet. */
export function WeeklyFocusSheet({ content, title }: { content: LaunchpadLevelUpContent; title: string }) {
  const empty = useSurfaceCopy().chrome.notAnswered;
  const answers = useLaunchpadAnswers()?.answers;
  const rows = weeklyFocusRows(content, levelUpOf(answers, "l7-improve")?.improvePlan ?? []);
  return (
    <div data-weekly-focus="">
      <AccentLabel as="h2">{title}</AccentLabel>
      {rows.length === 0 ? (
        <p className={`mt-3 ${WORKBOOK_HINT}`}>{empty}</p>
      ) : (
        rows.map((row, index) => (
          <div key={`${row.weekLabel}-${row.line}`}>
            <h3 className={`${WORKBOOK_SUB} ${index === 0 ? "mt-2" : "mt-[21px]"}`}>{row.weekLabel}</h3>
            <ul className="m-0 mt-1.5 list-none p-0">
              <li className="relative mb-1.5 pl-5 font-sans text-[16px] font-normal leading-[26px] text-[#19347D]">
                <span aria-hidden="true" data-aqua-bullet="" className="absolute left-1 top-[10px] size-[7px] rounded-full bg-[#0CC1E0]" />
                {row.line}
              </li>
            </ul>
          </div>
        ))
      )}
      <div className="relative">
        <div className="pointer-events-none absolute bottom-3 left-0 flex flex-col gap-1" aria-hidden="true">
          <img src={SCRIBBLE_SRC.star} alt="" width={18} height={18} draggable={false} className="size-[18px] rotate-[8deg] mix-blend-multiply" />
          <img src={SCRIBBLE_SRC.sparkle} alt="" width={18} height={18} draggable={false} className="size-[18px] -rotate-[8deg] mix-blend-multiply" />
        </div>
        <LargeScribble name="calendar" />
      </div>
    </div>
  );
}
