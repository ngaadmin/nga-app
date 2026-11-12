"use client";

import type { LaunchpadSilver } from "@/lib/launchpad/content/types";
import { getReadyOf, recordJobOf, wrapUpJobOf } from "@/lib/launchpad/content/answers";
import { deliveryLookups, joinWords, keptAmount, moneyText } from "@/lib/launchpad/content/delivery/logic";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { AccentLabel } from "@/components/launchpad/venture/handbook/paper-art";
import { LargeScribble, type ScribbleName } from "@/components/launchpad/venture/handbook/scribble-mark";

const BODY = "mb-3 font-sans text-[18px] font-normal leading-[26px] text-[#19347D]";
const TIGHT = "mb-2 font-sans text-[18px] font-normal leading-[26px] text-[#19347D]";
const PICK = "font-semibold text-[#0CC1E0]";

function Line({ before, pick, after, className = BODY }: { before: string; pick?: string; after?: string; className?: string }) {
  return (
    <p className={className}>
      {before}
      {pick ? <span className={PICK}>{pick}</span> : null}
      {after}
    </p>
  );
}

function labelOf(options: readonly { id: string; label: string }[] | undefined, id: string | undefined): string {
  return options?.find((row) => row.id === id)?.label ?? "";
}

function scribbleName(name: string | undefined): ScribbleName {
  if (name === "paw" || name === "star" || name === "treats" || name === "sparkle" || name === "heart" || name === "bone" || name === "coins" || name === "growth") return name;
  return "paw";
}

function screenOf(silver: LaunchpadSilver, step: "ready" | "wrap" | "record") {
  for (const bronze of silver.bronzes)
    for (const task of bronze.tasks)
      for (const screen of task.screens)
        if (screen.type === "delivery" && screen.step === step) return screen;
  return undefined;
}

export function DeliveryWorkbook({ silver, sheet }: { silver: LaunchpadSilver; sheet: string }) {
  const ctx = useLaunchpadAnswers();
  const step = sheet === "ready-before" ? "ready" : sheet === "ready-after" ? "wrap" : "record";
  const screen = screenOf(silver, step) ?? silver.bronzes.flatMap((bronze) => bronze.tasks.flatMap((task) => task.screens)).find((item) => item.type === "delivery" && item.step === step);
  if (!screen || screen.type !== "delivery") return null;
  const lookups = deliveryLookups(screen, ctx?.floors ?? [], ctx?.answers);
  if (sheet === "ready-before" && screen.ready) {
    const copy = screen.ready;
    const saved = getReadyOf(ctx?.answers, screen.answerKey);
    const gear = lookups.gear.length ? `${copy.packTitle}${copy.packSep}${joinWords(lookups.gear, screen.joinWord)}${copy.packAfter}` : copy.packEmpty;
    return (
      <div data-delivery-workbook="ready-before">
        <AccentLabel as="h2">{screen.playbackTitle}</AccentLabel>
        <Line className={TIGHT} before={copy.remindBefore} pick={lookups.remind} after={copy.remindAfter} />
        <Line className={TIGHT} before={copy.aboutBefore} pick={labelOf(copy.aboutOptions, saved?.remindAbout)} after={copy.aboutAfter} />
        <Line className={TIGHT} before={copy.travelBefore} pick={labelOf(copy.travelOptions, saved?.travelHow)} after={copy.travelAfter} />
        <Line className={TIGHT} before={copy.leaveBefore} pick={labelOf(copy.leaveOptions, saved?.leaveEarly)} after={copy.leaveAfter} />
        <Line className={TIGHT} before={copy.packBefore} pick={labelOf(copy.packOptions, saved?.packWhen)} after={copy.packAfter} />
        <p className={TIGHT}>{gear}</p>
        <LargeScribble name={scribbleName(screen.doodles[2])} className="mt-2" />
      </div>
    );
  }
  if (sheet === "ready-after" && screen.wrap) {
    const copy = screen.wrap;
    const saved = wrapUpJobOf(ctx?.answers, screen.answerKey);
    return (
      <div data-delivery-workbook="ready-after">
        <AccentLabel as="h2">{screen.playbackTitle}</AccentLabel>
        <Line className={TIGHT} before={copy.proofBefore} pick={lookups.proof} after={copy.proofAfter} />
        <Line className={TIGHT} before={copy.paymentBefore} pick={lookups.payment} after={copy.paymentAfter} />
        <Line className={TIGHT} before={copy.askPayBefore} pick={labelOf(copy.askPayOptions, saved?.paymentWhen)} after={copy.askPayAfter} />
        <Line className={TIGHT} before={copy.feedbackBefore} pick={lookups.feedback} after={copy.feedbackAfter} />
        <Line className={TIGHT} before={copy.askBefore} pick={labelOf(copy.askOptions, saved?.feedbackQuestion)} after={copy.askAfter} />
        <p className={TIGHT}>{copy.trackerLine}</p>
        <Line className={TIGHT} before={copy.whenBefore} pick={labelOf(copy.whenOptions, saved?.trackerWhen)} after={copy.whenAfter} />
      </div>
    );
  }
  if (sheet === "job-record" && screen.record) {
    const copy = screen.record;
    const saved = recordJobOf(ctx?.answers, screen.answerKey);
    return (
      <div data-delivery-workbook="job-record">
        <AccentLabel as="h2">{screen.playbackTitle}</AccentLabel>
        {(saved?.jobs ?? []).map((job, index) => {
          const name = lookups.services.find((row) => row.id === job.serviceId)?.label ?? job.serviceId;
          const cost = lookups.costFor(job.serviceId) ?? 0;
          const kept = keptAmount(job.paid, cost);
          return (
            <p key={`${job.serviceId}-${index}`} className={BODY}>
              <span className="font-semibold">{name}</span>
              {copy.serviceSuffix}
              {copy.paidLead}
              <span className={PICK}>{moneyText(job.paid)}</span>
              {copy.costLead}
              <span className={PICK}>{moneyText(cost)}</span>
              {copy.keptLead}
              <span className={PICK}>{moneyText(kept)}</span>
              {copy.lineAfter}
            </p>
          );
        })}
        <p className={BODY}>{copy.trackerLine}</p>
        <LargeScribble name={scribbleName(screen.doodles[2])} />
      </div>
    );
  }
  return null;
}
