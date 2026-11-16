"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { useEffect, useMemo, useState } from "react";
import type { JobsAnswer, LaunchpadAnswers, TypicalWeekRow } from "@/lib/launchpad/content/answers";
import { costsOf, priceOf } from "@/lib/launchpad/content/answers";
import type { LaunchpadFloor, LaunchpadJobsCoverScreen } from "@/lib/launchpad/content/types";
import { findKnowYourCost, formatOngoingMoney, formatStartupMoney, startupTotal } from "@/lib/launchpad/content/know-your-cost/logic";
import { jobsNeeded, weeklyKeep, weeksFromJobs, weeksFromWeeklyKeep } from "@/lib/launchpad/content/pricing/calc";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { FREDOKA_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";
import { MasterMuteButton } from "@/components/academy/lesson/master-mute-button";
import { StoryAudioPlayer } from "@/components/academy/lesson/story-audio-player";
import { STORY_BEAT_NEXT_LOCK_MS, stopStoryAudio, storyBeatNextEnabled } from "@/lib/academy/lessons/story-audio/playback";
import { SCRIBBLE_SRC } from "@/components/launchpad/venture/handbook/scribble-mark";
import { LESSON_BODY, LESSON_HINT, LessonContinue, LessonTopBar } from "@/components/launchpad/venture/screens/screen-ui";

const SCROLL = "min-h-0 overflow-y-auto [@media(max-height:879px)]:flex-1";

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (next: number) => void }) {
  const s = useSurfaceCopy();
  return (
    <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`${s.jobs.perWeekFor} ${label}`}>
      <button
        type="button"
        aria-label={`${s.jobs.fewer} ${label} ${s.jobs.jobsWord}`}
        disabled={value <= 0}
        onClick={() => onChange(value - 1)}
        className="flex size-9 items-center justify-center rounded-lg text-[#19347D] shadow-[inset_0_0_0_1.5px_#D9DEE8] disabled:text-[#D9DEE8]"
      >
        −
      </button>
      <span className="w-6 text-center font-sans text-[18px] font-bold leading-[26px] tabular-nums text-[#19347D]" data-jobs-count="">
        {value}
      </span>
      <button
        type="button"
        aria-label={`${s.jobs.more} ${label} ${s.jobs.jobsWord}`}
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
  const s = useSurfaceCopy();
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
  const [page, setPage] = useState<1 | 2>(1);
  const clip = page === 1 ? screen.audio : screen.weekAudio;
  const narrating = Boolean(clip?.src);
  const beatKey = narrating ? clip?.src ?? "" : "";
  const [lockKey, setLockKey] = useState(beatKey);
  const [beatElapsedMs, setBeatElapsedMs] = useState(0);
  if (beatKey !== lockKey) {
    setLockKey(beatKey);
    setBeatElapsedMs(0);
  }
  // Re-arm the short lock for each clip, so page 2 unlocks after its own clip starts.
  useEffect(() => {
    if (!narrating) return;
    const timer = window.setTimeout(() => setBeatElapsedMs(STORY_BEAT_NEXT_LOCK_MS), STORY_BEAT_NEXT_LOCK_MS);
    return () => window.clearTimeout(timer);
  }, [narrating, beatKey]);
  useEffect(() => {
    if (!narrating) return;
    return () => stopStoryAudio();
  }, [narrating]);
  const introReady = storyBeatNextEnabled({ isStoryBeat: narrating, screenReady: true, elapsedMs: beatElapsedMs });

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
    <section className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-white [@media(max-height:879px)]:overflow-hidden" data-task-screen="jobs-to-cover" data-jobs-page={page === 1 ? "text" : "week"} data-jobs-mode={pricesReady ? mode : "blocked"}>
      {page === 1 || screen.weekAudio?.src ? <MasterMuteButton /> : null}
      <LessonTopBar title={s.jobs.title} onBack={page === 1 ? onExit : () => setPage(1)} progress={{ index: page === 1 ? 1 : 2, total: 2 }} />
      {page === 1 ? (
        <div className={`relative mx-5 mt-5 ${SCROLL}`}>
          <img src={SCRIBBLE_SRC.coins} alt="" data-jobs-art="coins" className="mx-auto mb-5 block h-[120px] w-auto" />
          <p className="font-sans text-[16px] font-semibold leading-[23px] text-[#4A5568]">{screen.copy.eyebrow}</p>
          <p className={`mt-3 ${LESSON_BODY}`}>{screen.copy.context}</p>
          <p className={`mt-3 ${LESSON_BODY}`}>{screen.copy.guidance}</p>
        </div>
      ) : (
      <div className="mx-5 mt-2 min-h-0 flex-1 overflow-hidden">
        {screen.copy.weekIntro ? <p className="mb-1 font-sans text-[15px] font-normal leading-[20px] text-[#4A5568]">{screen.copy.weekIntro}</p> : null}
        {!pricesReady && <p className="mt-2 font-sans text-[16px] leading-[22px] text-[#19347D]">{screen.copy.needPrice}</p>}
        {pricesReady && startup <= 0 && <p className="mt-2 font-sans text-[16px] font-semibold leading-[22px] text-[#19347D]">{screen.copy.covered}</p>}
        {pricesReady && mode === "single" && single && needed !== null && (
          <div className="mt-2">
            <p className="font-sans text-[16px] leading-[22px] text-[#19347D]">
              {s.jobs.youNeed} <b data-jobs-needed="">{needed}</b> {needed === 1 ? "job" : "jobs"} {s.jobs.toCover} {formatStartupMoney(startup, currency)} {s.jobs.ofStartup}{" "}
              {formatOngoingMoney(single.keptPerJob, currency)} {s.jobs.onEach}
            </p>
            <h2 className={`mb-1 mt-2 ${FREDOKA_CLASS} text-[18px] font-semibold leading-6 text-[#0CC1E0]`}>{screen.copy.singlePrompt}</h2>
            <div className="flex flex-col gap-1" role="radiogroup" aria-label={screen.copy.singlePrompt}>
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
                    className={`flex h-9 items-center justify-between rounded-xl px-3 text-left font-sans text-[16px] font-medium leading-5 text-[#19347D] ${on ? "bg-[#F0FBFE] shadow-[inset_0_0_0_1.5px_#0CC1E0]" : "bg-white shadow-[inset_0_0_0_1.5px_#E5E7EB]"}`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
            {singleWeeks !== null && (
              <p className="mt-1.5 font-sans text-[16px] leading-[22px] text-[#19347D]">
                About <b data-weeks-needed="">{singleWeeks}</b> {singleWeeks === 1 ? "week" : "weeks"}.
              </p>
            )}
          </div>
        )}
        {pricesReady && mode === "multi" && (
          <div>
            <h2 className={`mb-1 ${FREDOKA_CLASS} text-[18px] font-semibold leading-6 text-[#0CC1E0]`}>{screen.copy.multiPrompt}</h2>
            <div className="flex flex-col gap-1">
              {priced.map((row) => {
                const jobs = counts[row.serviceId] ?? 0;
                const subtotal = (jobs * Math.round(row.keptPerJob * 100)) / 100;
                return (
                <div key={row.serviceId} className="flex flex-row items-center gap-2 rounded-[14px] bg-white px-3 py-1 shadow-[inset_0_0_0_1.5px_#E5E7EB]" data-service-card={row.serviceId} data-service-tile-layout="row">
                  <span className="min-w-0 flex-1 font-sans text-[16px] font-bold leading-5 text-[#19347D]">{labels.get(row.serviceId)}</span>
                  <span className="shrink-0 text-right text-[16px] leading-tight text-[#6B7280]">
                    {formatOngoingMoney(row.keptPerJob, currency)} kept
                    {jobs > 0 && (
                      <>
                        {" · "}
                        <span data-subtotal="">{formatOngoingMoney(subtotal, currency)}</span>
                      </>
                    )}
                  </span>
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
                );
              })}
            </div>
            <div className="mt-2 flex items-baseline justify-between font-sans text-[16px] leading-[22px] text-[#19347D]">
              <span>{screen.copy.weeklyLabel}</span>
              <b className="font-heading text-lg tabular-nums" data-weekly-keep="">
                {formatOngoingMoney(weekly, currency)}
              </b>
            </div>
            <div className="mt-1 flex items-baseline justify-between font-sans text-[18px] leading-[26px] text-[#19347D]">
              <span>{screen.copy.startupLabel}</span>
              <b className="font-heading text-lg tabular-nums" data-startup-total="">
                {formatStartupMoney(startup, currency)}
              </b>
            </div>
            <p className="mt-2 font-sans text-[18px] leading-[26px] text-[#19347D]">
              {screen.copy.weeksLabel}{" "}
              <b className="font-heading text-lg tabular-nums" data-weeks-needed="">
                {multiWeeks === null ? screen.copy.weeksEmpty : `${multiWeeks} ${multiWeeks === 1 ? "week" : "weeks"}`}
              </b>
            </p>
          </div>
        )}
      </div>
      )}
      <div className="flex flex-none flex-col items-center px-5 pb-[18px] pt-3 [@media(max-height:879px)]:mt-auto">
        {narrating && clip ? <StoryAudioPlayer inline clip={clip} /> : null}
        <LessonContinue
          disabled={!introReady || (page === 2 && !ready)}
          onClick={() => {
            if (page === 1) {
              if (!introReady) return;
              stopStoryAudio();
              setPage(2);
              return;
            }
            if (!answer) return;
            save(answer);
            onFinish(answer);
          }}
        >
          Continue
        </LessonContinue>
      </div>
    </section>
  );
}
