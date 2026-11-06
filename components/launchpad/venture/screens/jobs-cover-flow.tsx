"use client";

import { useMemo, useState } from "react";
import type { JobsAnswer, LaunchpadAnswers, TypicalWeekRow } from "@/lib/launchpad/content/answers";
import { costsOf, priceOf } from "@/lib/launchpad/content/answers";
import type { LaunchpadFloor, LaunchpadJobsCoverScreen } from "@/lib/launchpad/content/types";
import { findKnowYourCost, formatOngoingMoney, formatStartupMoney, startupTotal } from "@/lib/launchpad/content/know-your-cost/logic";
import { jobsNeeded, weeklyKeep, weeksFromJobs, weeksFromWeeklyKeep } from "@/lib/launchpad/content/pricing/calc";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";

const CONTINUE_ON =
  "inline-flex h-11 min-w-[140px] items-center justify-center rounded-full bg-[#19347D] px-6 font-heading text-[15px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#19347D]";
const CONTINUE_OFF =
  "inline-flex h-11 min-w-[140px] items-center justify-center rounded-full bg-[#E5E7EB] px-6 font-heading text-[15px] font-bold text-[#9AA3B5]";
const SCROLL = "min-h-0 overflow-y-auto [@media(max-height:879px)]:flex-1";

function BackTitle({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mx-5 mt-2 flex items-center gap-1">
      <button type="button" onClick={onBack} aria-label="Back" className="flex size-11 items-center justify-center text-[#19347D]">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <h1 className="font-heading text-[17px] font-bold text-[#19347D]">{title}</h1>
    </div>
  );
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (next: number) => void }) {
  return (
    <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`Jobs per week for ${label}`}>
      <button
        type="button"
        aria-label={`Fewer ${label} jobs`}
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
        className="flex size-9 items-center justify-center rounded-lg text-[#19347D] shadow-[inset_0_0_0_1.5px_#D9DEE8] disabled:text-[#D9DEE8]"
      >
        −
      </button>
      <span className="w-5 text-center font-heading text-[15px] font-bold tabular-nums text-[#19347D]" data-jobs-count="">
        {value}
      </span>
      <button
        type="button"
        aria-label={`More ${label} jobs`}
        disabled={value >= 7}
        onClick={() => onChange(value + 1)}
        className="flex size-9 items-center justify-center rounded-lg text-[#19347D] shadow-[inset_0_0_0_1.5px_#D9DEE8] disabled:text-[#D9DEE8]"
      >
        +
      </button>
    </div>
  );
}

/**
 * How many jobs cover start-up. One service uses keep per job. Several
 * services use a typical week. Charity is not part of the keep.
 */
export function JobsCoverFlow({
  screen,
  floors: floorsProp,
  answers: answersProp,
  setAnswer: setAnswerProp,
  onExit = () => {},
  onFinish = () => {},
}: {
  screen: LaunchpadJobsCoverScreen;
  floors?: readonly LaunchpadFloor[];
  answers?: LaunchpadAnswers;
  setAnswer?: (answerKey: string, answer: JobsAnswer) => void;
  onExit?: () => void;
  onFinish?: (answer: JobsAnswer) => void;
}) {
  const ctx = useLaunchpadAnswers();
  const floors = floorsProp ?? ctx?.floors ?? [];
  const answers = answersProp ?? ctx?.answers ?? {};
  const persist = setAnswerProp ?? ((key, answer) => ctx?.setAnswer(key, answer));
  const currency = readCurrencyPreference();
  const price = priceOf(answers, screen.priceFrom);
  const costsScreen = useMemo(() => findKnowYourCost(floors), [floors]);
  const costs = costsOf(answers, screen.costsFrom) ?? (costsScreen ? costsOf(answers, costsScreen.screen.answerKey) : undefined);
  const startup = costs ? startupTotal(costs) : 0;
  const labels = new Map((costs?.ongoing ?? []).map((service) => [service.serviceId, service.label]));
  const priced = (price?.prices ?? []).filter((row) => row.keptPerJob > 0 && labels.has(row.serviceId));
  const offered = costs?.ongoing.length ?? 0;
  const pricesReady = offered === 0 || (priced.length === offered && priced.length > 0);
  const mode: "single" | "multi" = priced.length >= 2 ? "multi" : "single";
  const [weekId, setWeekId] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const single = priced[0];
  const needed = single ? jobsNeeded(startup, single.keptPerJob) : null;
  const picked = screen.weekOptions.find((option) => option.id === weekId);
  const singleWeeks = needed !== null && picked ? weeksFromJobs(needed, picked.jobs) : null;

  const typical: TypicalWeekRow[] = priced.map((row) => {
    const jobs = counts[row.serviceId] ?? 0;
    return { serviceId: row.serviceId, jobsPerWeek: jobs, keptPerJob: row.keptPerJob, subtotal: (jobs * Math.round(row.keptPerJob * 100)) / 100 };
  });
  const weekly = weeklyKeep(typical);
  const multiWeeks = weeksFromWeeklyKeep(startup, weekly);

  let answer: JobsAnswer | null = null;
  if (pricesReady && offered === 0) {
    answer = startup <= 0 ? { kind: "jobs", version: 1, mode: "single", startupTotal: startup, weeksNeeded: 0, jobsNeeded: 0, jobsPerWeek: 1, keptPerJob: 0 } : null;
  } else if (pricesReady && mode === "single" && single && needed !== null && picked && singleWeeks !== null) {
    answer = {
      kind: "jobs",
      version: 1,
      mode: "single",
      startupTotal: startup,
      keptPerJob: single.keptPerJob,
      jobsNeeded: needed,
      jobsPerWeek: picked.jobs,
      jobsPerWeekOptionId: picked.id,
      weeksNeeded: singleWeeks,
    };
  } else if (pricesReady && mode === "multi" && multiWeeks !== null) {
    answer = { kind: "jobs", version: 1, mode: "multi", startupTotal: startup, typicalWeek: typical, weeklyKeep: weekly, weeksNeeded: multiWeeks };
  }
  const ready = answer !== null;

  const save = (next: JobsAnswer) => persist(screen.answerKey, next);

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white [@media(max-height:879px)]:overflow-hidden" data-task-screen="jobs-to-cover" data-jobs-mode={pricesReady ? mode : "blocked"}>
      <BackTitle title="Jobs to cover your costs" onBack={onExit} />
      <div className={`mx-5 mt-1 ${SCROLL}`}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#9AA3B5]">Pricing</p>
        <p className="mt-1 text-[13.5px] leading-snug text-[#6B7280]">{screen.copy.context}</p>
        {!pricesReady && <p className="mt-4 text-[14px] text-[#19347D]">{screen.copy.needPrice}</p>}
        {pricesReady && startup <= 0 && <p className="mt-4 text-[14px] font-semibold text-[#19347D]">{screen.copy.covered}</p>}
        {pricesReady && mode === "single" && single && needed !== null && (
          <div className="mt-4">
            <p className="text-[15px] leading-snug text-[#19347D]">
              You need <b data-jobs-needed="">{needed}</b> {needed === 1 ? "job" : "jobs"} to cover {formatStartupMoney(startup, currency)} of start-up costs. You keep{" "}
              {formatOngoingMoney(single.keptPerJob, currency)} on each one.
            </p>
            <p className="mt-3 text-[13.5px] text-[#6B7280]">{screen.copy.guidance}</p>
            <h2 className="mb-2 mt-4 font-heading text-[15px] font-bold text-[#19347D]">{screen.copy.singlePrompt}</h2>
            <div className="flex flex-col gap-2" role="radiogroup" aria-label={screen.copy.singlePrompt}>
              {screen.weekOptions.map((option) => {
                const on = weekId === option.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => {
                      setWeekId(option.id);
                      const weeks = weeksFromJobs(needed, option.jobs);
                      if (weeks === null) return;
                      save({
                        kind: "jobs",
                        version: 1,
                        mode: "single",
                        startupTotal: startup,
                        keptPerJob: single.keptPerJob,
                        jobsNeeded: needed,
                        jobsPerWeek: option.jobs,
                        jobsPerWeekOptionId: option.id,
                        weeksNeeded: weeks,
                      });
                    }}
                    className={`flex h-11 items-center justify-between rounded-xl px-3 text-left text-[14px] font-medium text-[#19347D] ${on ? "bg-[#F0FBFE] shadow-[inset_0_0_0_1.5px_#0CC1E0]" : "bg-white shadow-[inset_0_0_0_1.5px_#E5E7EB]"}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {singleWeeks !== null && (
              <p className="mt-3 text-[14px] text-[#19347D]">
                About <b data-weeks-needed="">{singleWeeks}</b> {singleWeeks === 1 ? "week" : "weeks"}.
              </p>
            )}
          </div>
        )}
        {pricesReady && mode === "multi" && (
          <div className="mt-4">
            <p className="text-[13.5px] leading-snug text-[#6B7280]">{screen.copy.guidance}</p>
            <h2 className="mb-2 mt-3 font-heading text-[15px] font-bold text-[#19347D]">{screen.copy.multiPrompt}</h2>
            <div className="flex flex-col gap-2">
              {priced.map((row) => (
                <div key={row.serviceId} className="flex flex-row items-center gap-2 rounded-[14px] bg-white px-3 py-2 shadow-[inset_0_0_0_1.5px_#E5E7EB]" data-service-card={row.serviceId} data-service-tile-layout="row">
                  <span className="min-w-0 flex-1 font-heading text-[15px] font-bold leading-tight text-[#19347D]">{labels.get(row.serviceId)}</span>
                  <span className="shrink-0 text-[12.5px] text-[#6B7280]">{formatOngoingMoney(row.keptPerJob, currency)} kept</span>
                  <Stepper
                    label={labels.get(row.serviceId) ?? "service"}
                    value={counts[row.serviceId] ?? 0}
                    onChange={(next) => {
                      const updated = { ...counts, [row.serviceId]: next };
                      setCounts(updated);
                      const week = priced.map((item) => {
                        const jobs = updated[item.serviceId] ?? 0;
                        return { serviceId: item.serviceId, jobsPerWeek: jobs, keptPerJob: item.keptPerJob, subtotal: (jobs * Math.round(item.keptPerJob * 100)) / 100 };
                      });
                      const keep = weeklyKeep(week);
                      const weeks = weeksFromWeeklyKeep(startup, keep);
                      if (weeks === null) return;
                      save({ kind: "jobs", version: 1, mode: "multi", startupTotal: startup, typicalWeek: week, weeklyKeep: keep, weeksNeeded: weeks });
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-baseline justify-between text-[15px] text-[#19347D]">
              <span>{screen.copy.weeklyLabel}</span>
              <b className="font-heading text-lg tabular-nums" data-weekly-keep="">
                {formatOngoingMoney(weekly, currency)}
              </b>
            </div>
            <div className="mt-1 flex items-baseline justify-between text-[15px] text-[#19347D]">
              <span>{screen.copy.weeksLabel}</span>
              <b className="font-heading text-lg tabular-nums" data-weeks-needed="">
                {multiWeeks === null ? "—" : multiWeeks}
              </b>
            </div>
          </div>
        )}
      </div>
      <div className="mx-5 flex flex-none justify-center pb-4 pt-3 [@media(max-height:879px)]:mt-auto">
        <button
          type="button"
          disabled={!ready}
          className={ready ? CONTINUE_ON : CONTINUE_OFF}
          onClick={() => {
            if (!answer) return;
            save(answer);
            onFinish(answer);
          }}
        >
          Continue
        </button>
      </div>
    </section>
  );
}
