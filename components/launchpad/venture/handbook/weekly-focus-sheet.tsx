"use client";

import type { ReactNode } from "react";
import { levelUpOf } from "@/lib/launchpad/content/answers";
import { fillToken, weeklyFocusRows } from "@/lib/launchpad/content/level-up/model";
import type { LaunchpadLevelUpContent } from "@/lib/launchpad/content/level-up/model";
import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { AccentLabel, WORKBOOK_HINT, WORKBOOK_SUB } from "@/components/launchpad/venture/handbook/paper-art";
import { LargeScribble, SCRIBBLE_SRC } from "@/components/launchpad/venture/handbook/scribble-mark";

const BULLET = "relative mb-1 pl-5 font-sans text-[16px] font-normal leading-[26px] text-[#19347D]";

function AquaBullet({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <li className={BULLET}>
      <span aria-hidden="true" data-aqua-bullet="" className="absolute left-1 top-[10px] size-[7px] rounded-full bg-[#0CC1E0]" />
      {strong ? <span className="font-semibold">{children}</span> : children}
    </li>
  );
}

/** Reflect playback: one aqua section per area, then the saved statement labels. */
export function WhatWentWellSheet({ content, title }: { content: LaunchpadLevelUpContent; title: string }) {
  const answers = useLaunchpadAnswers()?.answers;
  const selected = new Set(levelUpOf(answers, "l7-reflect")?.selected ?? []);
  return (
    <div data-what-went-well="">
      <div className="relative">
        <AccentLabel as="h2">{title}</AccentLabel>
        <img src={SCRIBBLE_SRC.sparkle} alt="" width={18} height={18} draggable={false} className="pointer-events-none absolute right-1 top-0 size-[18px] rotate-[10deg] mix-blend-multiply" />
      </div>
      {content.sections.map((section, index) => {
        const lines = content.statements.filter((item) => item.section === section.id && selected.has(item.id));
        if (lines.length === 0) return null;
        return (
          <div key={section.id}>
            <h3 className={`${WORKBOOK_SUB} ${index === 0 ? "mt-1.5" : "mt-3.5"}`}>{section.label}</h3>
            <ul className="m-0 mt-1 list-none p-0">
              {lines.map((item) => (
                <AquaBullet key={item.id}>{item.label}</AquaBullet>
              ))}
            </ul>
          </div>
        );
      })}
      <div className="relative mt-4 min-h-[88px]">
        <img src={SCRIBBLE_SRC.heart} alt="" width={18} height={18} draggable={false} data-heart-doodle="" className="pointer-events-none absolute bottom-1 left-0 size-[18px] -rotate-12 mix-blend-multiply" />
        <LargeScribble name="beagle" />
      </div>
    </div>
  );
}

/** Grow playback: one aqua section per idea, then the saved slots as aqua bullets. */
export function GrowthPlanSheet({ content, title }: { content: LaunchpadLevelUpContent; title: string }) {
  const answers = useLaunchpadAnswers()?.answers;
  const saved = levelUpOf(answers, "l7-grow");
  const plans = saved?.growPlans ?? [];
  const order = saved?.ideas ?? [];
  const rows = [...plans].sort((a, b) => order.indexOf(a.idea) - order.indexOf(b.idea));
  return (
    <div data-growth-plan="" data-idea-count={rows.length}>
      <AccentLabel as="h2">{title}</AccentLabel>
      {rows.map((plan, index) => {
        const idea = content.grow.ideas.find((item) => item.id === plan.idea);
        const start = content.grow.startOptions?.find((item) => item.id === plan.when);
        const checkIn = content.grow.checkInOptions?.find((item) => item.id === plan.checkIn);
        return (
          <div key={plan.idea}>
            <h3 className={`${WORKBOOK_SUB} ${index === 0 ? "mt-1.5" : "mt-3.5"}`}>{idea?.label ?? plan.idea}</h3>
            <ul className="m-0 mt-1 list-none p-0">
              {plan.options.map((id) => {
                const option = idea?.options.find((item) => item.id === id);
                return option ? <AquaBullet key={id}>{option.label}</AquaBullet> : null;
              })}
              <AquaBullet>
                <span className="font-semibold">{plan.successCount}</span>
                {idea?.stacked?.countAfter ? ` ${idea.stacked.countAfter}` : null}
              </AquaBullet>
              {checkIn ? <AquaBullet>{checkIn.label}</AquaBullet> : null}
              {plan.checkInDate && content.grow.dateLine ? <AquaBullet>{fillToken(content.grow.dateLine, "date", plan.checkInDate)}</AquaBullet> : null}
              {start ? <AquaBullet>{start.label}</AquaBullet> : null}
            </ul>
          </div>
        );
      })}
      <div className="relative mt-4 min-h-[88px]">
        <div className="pointer-events-none absolute bottom-2 left-0 flex flex-col gap-1" aria-hidden="true">
          <img src={SCRIBBLE_SRC.star} alt="" width={18} height={18} draggable={false} className="size-[18px] rotate-[8deg] mix-blend-multiply" />
          <img src={SCRIBBLE_SRC.sparkle} alt="" width={18} height={18} draggable={false} className="size-[18px] -rotate-[8deg] mix-blend-multiply" />
        </div>
        <LargeScribble name="growth" />
      </div>
    </div>
  );
}

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
              <AquaBullet>{row.line}</AquaBullet>
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
