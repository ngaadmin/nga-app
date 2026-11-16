"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { useEffect, useMemo, useState } from "react";
import type { ComparedToOthers, LaunchpadAnswers, PriceAnswer, ServicePrice } from "@/lib/launchpad/content/answers";
import { competitorOf, priceOf } from "@/lib/launchpad/content/answers";
import { packageServiceId } from "@/lib/launchpad/content/planning/catalog";
import { COMPETITOR_ANSWER_KEY } from "@/lib/launchpad/content/planning/screens";
import type { LaunchpadFloor, LaunchpadSetPriceScreen } from "@/lib/launchpad/content/types";
import { findKnowYourCost, formatOngoingMoney, parseStartupInput, savedCosts, serviceTotal } from "@/lib/launchpad/content/know-your-cost/logic";
import { isWholePrice, keptPerJob } from "@/lib/launchpad/content/pricing/calc";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { currencySymbol } from "@/lib/dashboard/currency/format-money";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { StoryAudioPlayer } from "@/components/academy/lesson/story-audio-player";
import { STORY_BEAT_NEXT_LOCK_MS, stopStoryAudio, storyBeatNextEnabled } from "@/lib/academy/lessons/story-audio/playback";
import { SCRIBBLE_SRC } from "@/components/launchpad/venture/handbook/scribble-mark";
import { LESSON_BODY, LESSON_HINT, LessonContinue, LessonCredit, LessonSurface, LessonTopBar } from "@/components/launchpad/venture/screens/screen-ui";

const SCROLL = "min-h-0 overflow-y-auto [@media(max-height:879px)]:flex-1";

/**
 * Set the price. One row per service: name, cost and keep, and a compact
 * price field. Keep is price minus cost. Nothing is given to a cause here.
 */
export function SetPriceFlow({
  screen,
  floors: floorsProp,
  answers: answersProp,
  setAnswer: setAnswerProp,
  onExit = () => {},
  onFinish = () => {},
}: {
  screen: LaunchpadSetPriceScreen;
  floors?: readonly LaunchpadFloor[];
  answers?: LaunchpadAnswers;
  setAnswer?: (answerKey: string, answer: PriceAnswer) => void;
  onExit?: (answer: PriceAnswer) => void;
  onFinish?: (answer: PriceAnswer) => void;
}) {
  const s = useSurfaceCopy();
  const ctx = useLaunchpadAnswers();
  const floors = floorsProp ?? ctx?.floors ?? [];
  const answers = answersProp ?? ctx?.answers ?? {};
  const persist = setAnswerProp ?? ((key, answer) => ctx?.setAnswer(key, answer));
  const currency = readCurrencyPreference();
  const symbol = currencySymbol(currency);
  const costs = useMemo(() => {
    const found = findKnowYourCost(floors);
    return found ? savedCosts(answers, found.screen, floors) : null;
  }, [answers, floors]);
  const services = costs?.ongoing ?? [];
  const competitor = competitorOf(answers, COMPETITOR_ANSWER_KEY);
  const rangedService = competitor?.jobComparedId ? packageServiceId(competitor.jobComparedId) : undefined;
  const saved = priceOf(answers, screen.answerKey);
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const row of saved?.prices ?? []) init[row.serviceId] = String(row.price);
    return init;
  });
  const [intro, setIntro] = useState(true);
  const narrating = intro && Boolean(screen.audio?.src);
  const beatKey = narrating ? screen.audio?.src ?? "" : "";
  const [lockKey, setLockKey] = useState(beatKey);
  const [beatElapsedMs, setBeatElapsedMs] = useState(0);
  if (beatKey !== lockKey) {
    setLockKey(beatKey);
    setBeatElapsedMs(0);
  }
  useEffect(() => {
    if (!narrating) return;
    const timer = window.setTimeout(() => setBeatElapsedMs(STORY_BEAT_NEXT_LOCK_MS), STORY_BEAT_NEXT_LOCK_MS);
    return () => {
      window.clearTimeout(timer);
      stopStoryAudio();
    };
  }, [narrating]);
  const introReady = storyBeatNextEnabled({ isStoryBeat: narrating, screenReady: true, elapsedMs: beatElapsedMs });
  const [compared, setCompared] = useState<Record<string, ComparedToOthers | "">>(() => {
    const init: Record<string, ComparedToOthers | ""> = {};
    for (const row of saved?.prices ?? []) if (row.comparedToOthers) init[row.serviceId] = row.comparedToOthers;
    return init;
  });

  const buildRows = (nextDrafts: Record<string, string>, nextCompared: Record<string, ComparedToOthers | "">): ServicePrice[] =>
    services.flatMap((service) => {
      const parsed = parseStartupInput(nextDrafts[service.serviceId] ?? "");
      if (parsed === null || !isWholePrice(parsed)) return [];
      const cost = serviceTotal(service.lines);
      const row: ServicePrice = { serviceId: service.serviceId, price: parsed, costPerJob: cost, keptPerJob: keptPerJob(parsed, cost) };
      const choice = nextCompared[service.serviceId];
      const priced = competitor?.servicePrices?.find((item) => item.serviceId === service.serviceId);
      const hasAverage = (priced?.offers ?? []).some((id) => (priced?.averages[id] ?? 0) >= 1);
      if ((hasAverage || rangedService === service.serviceId) && choice) row.comparedToOthers = choice;
      return [row];
    });
  const rows = buildRows(drafts, compared);
  const answer: PriceAnswer = { kind: "price", version: 1, prices: rows };
  const needsCompare = (serviceId: string) => {
    const priced = competitor?.servicePrices?.find((item) => item.serviceId === serviceId);
    const hasAverage = (priced?.offers ?? []).some((id) => (priced?.averages[id] ?? 0) >= 1);
    return hasAverage || rangedService === serviceId;
  };
  const ready =
    services.length === 0 ||
    (rows.length === services.length && rows.every((row) => row.keptPerJob > 0 && (!needsCompare(row.serviceId) || !!row.comparedToOthers)));

  const commit = (nextDrafts: Record<string, string>, nextCompared = compared) => {
    setDrafts(nextDrafts);
    setCompared(nextCompared);
    persist(screen.answerKey, { kind: "price", version: 1, prices: buildRows(nextDrafts, nextCompared) });
  };

  if (intro) {
    return (
      <LessonSurface
        title={s.price.title}
        onBack={() => onExit(answer)}
        progress={{ index: 1, total: 2 }}
        showMute={narrating}
        creditSlot
        aboveFooter={narrating && screen.audio ? <StoryAudioPlayer inline clip={screen.audio} /> : null}
        footer={<LessonContinue disabled={!introReady} onClick={() => { stopStoryAudio(); setIntro(false); }} />}
      >
        <div data-task-screen="set-price" data-price-page="intro">
          <img src={SCRIBBLE_SRC.wallet} alt="" data-price-art="wallet" className="mx-auto block h-20 w-auto" />
          <p className={`mt-5 ${LESSON_BODY}`}>{screen.copy.context}</p>
          <p className={`mt-3 ${LESSON_BODY}`}>{screen.copy.guidance}</p>
          {screen.copy.later ? <p className={`mt-3 ${LESSON_BODY}`}>{screen.copy.later}</p> : null}
          {screen.copy.credit ? <LessonCredit credit={screen.copy.credit} /> : null}
        </div>
      </LessonSurface>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white [@media(max-height:879px)]:overflow-hidden" data-task-screen="set-price" data-price-page="fields">
      <LessonTopBar title={s.price.title} onBack={() => setIntro(true)} progress={{ index: 2, total: 2 }} />
      <div className={`mx-5 mt-5 ${SCROLL}`}>
        <p className="font-sans text-[16px] font-semibold leading-[23px] text-[#4A5568]">{screen.copy.eyebrow}</p>
        <div className="mt-4 flex flex-col gap-2">
          {services.length === 0 && <p className="text-[16px] text-[#6B7280]">{screen.copy.emptyServices}</p>}
          {services.map((service) => {
            const row = rows.find((item) => item.serviceId === service.serviceId);
            const cost = serviceTotal(service.lines);
            const low = row ? row.keptPerJob <= 0 : false;
            return (
              <article key={service.serviceId} className="rounded-[14px] bg-white px-3 py-2.5 shadow-[inset_0_0_0_1.5px_#E5E7EB]" data-service-card={service.serviceId}>
                <div className="flex flex-col gap-1" data-service-tile-layout="price">
                  <div className="flex items-center justify-between gap-2">
                  <h2 className="min-w-0 font-sans text-[18px] font-bold leading-[26px] text-[#19347D]">{service.label}</h2>
                  <label className="flex h-11 w-[120px] shrink-0 items-center gap-0.5 rounded-[10px] bg-white px-2 shadow-[inset_0_0_0_1.5px_#D9DEE8]">
                    <span className="font-sans text-[16px] leading-[23px] text-[#4A5568]" aria-hidden="true">
                      {symbol}
                    </span>
                    <input
                      inputMode="numeric"
                      aria-label={`${s.price.priceFor} ${service.label}`}
                      value={drafts[service.serviceId] ?? ""}
                      onChange={(event) => {
                        const next = event.target.value.replace(/\D/g, "").slice(0, 4);
                        commit({ ...drafts, [service.serviceId]: next });
                      }}
                      className="w-full bg-transparent text-right font-sans text-[20px] font-bold leading-[26px] tabular-nums text-[#19347D] outline-none"
                    />
                  </label>
                  </div>
                  <p className="font-sans text-[16px] leading-[23px] text-[#4A5568]">
                    {screen.copy.costLabel} {formatOngoingMoney(cost, currency)}
                    <span className="mx-1 text-[#D9DEE8]" aria-hidden="true">
                      ·
                    </span>
                    <span className="font-semibold text-[#19347D]" data-kept="">
                      {screen.copy.keepLabel} {row ? formatOngoingMoney(row.keptPerJob, currency) : "—"}
                    </span>
                  </p>
                </div>
                {(() => {
                  const priced = competitor?.servicePrices?.find((item) => item.serviceId === service.serviceId);
                  const amounts = (priced?.offers ?? []).flatMap((id) => {
                    const amount = priced?.averages[id];
                    return amount && amount >= 1 ? [amount] : [];
                  });
                  if (!amounts.length && !(rangedService === service.serviceId && competitor)) {
                    return <p className="mt-1 font-sans text-[16px] leading-[23px] text-[#4A5568]">{s.price.notChecked}</p>;
                  }
                  return (
                  <p className="mt-1 text-[18px] text-[#19347D]">
                    {amounts.length
                      ? <>{s.price.othersChargeDollar}{amounts.join(s.price.averageJoin)}{s.price.onAverage}</>
                      : <>{s.price.othersChargeDollar}{competitor?.priceLow} to ${competitor?.priceHigh}</>}
                    {s.price.mineIs}{" "}
                    <select
                      aria-label={`${s.price.comparedFor} ${service.label}`}
                      value={compared[service.serviceId] ?? ""}
                      onChange={(event) => {
                        const value = event.target.value as ComparedToOthers | "";
                        commit(drafts, { ...compared, [service.serviceId]: value });
                      }}
                      className="h-8 rounded-lg bg-white px-1 font-semibold shadow-[inset_0_0_0_1.5px_#D9DEE8]"
                    >
                      <option value="">Choose</option>
                      <option value="lower than">{s.price.lower}</option>
                      <option value="about the same as">{s.price.same}</option>
                      <option value="higher than">{s.price.higher}</option>
                    </select>
                  </p>
                  );
                })()}
                {low && <p className="mt-1 text-[18px] text-[#B45309]">{screen.copy.lowKeep}</p>}
              </article>
            );
          })}
        </div>
        {screen.copy.howTo ? <p className={`mt-3 ${LESSON_HINT}`}>{screen.copy.howTo}</p> : null}
      </div>
      <div className="flex flex-none justify-center px-5 pb-[18px] pt-3 [@media(max-height:879px)]:mt-auto">
        <LessonContinue disabled={!ready} onClick={() => ready && onFinish(answer)}>
          Continue
        </LessonContinue>
      </div>
    </section>
  );
}
