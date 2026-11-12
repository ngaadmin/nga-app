"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
import { useMemo, useState } from "react";
import type { FundingAnswer, FundingRepayUnit, LaunchpadAnswers } from "@/lib/launchpad/content/answers";
import { costsOf, fundingOf } from "@/lib/launchpad/content/answers";
import { formatStartupMoney, startupTotal } from "@/lib/launchpad/content/know-your-cost/logic";
import { periodPayment, weeksToRepay } from "@/lib/launchpad/content/planning/funding";
import type { LaunchpadFundingScreen } from "@/lib/launchpad/content/types";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { formatMoney } from "@/lib/dashboard/currency/format-money";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { FREDOKA_CLASS } from "@/components/launchpad/venture/identity/identity-fonts";
import { BronzeFirstLead, LessonContinue } from "@/components/launchpad/venture/screens/screen-ui";
import { TickBadge } from "@/components/launchpad/venture-test/venture-test-ui";

function unitWord(unit: FundingRepayUnit, count: number): string {
  if (unit === "months") return count === 1 ? "month" : "months";
  return count === 1 ? "week" : "weeks";
}

/**
 * Get the money you need to start. Own cash confirms. Borrow sets a payback
 * plan. No lender, no interest, no charity.
 */
export function FundingFlow({
  screen,
  answers: answersProp,
  setAnswer: setAnswerProp,
  onExit = () => {},
  onFinish = () => {},
  onGoToCosts,
}: {
  screen: LaunchpadFundingScreen;
  answers?: LaunchpadAnswers;
  setAnswer?: (key: string, answer: FundingAnswer) => void;
  onExit?: () => void;
  onFinish?: (answer: FundingAnswer) => void;
  onGoToCosts?: () => void;
}) {
  const s = useSurfaceCopy();
  const ctx = useLaunchpadAnswers();
  const answers = answersProp ?? ctx?.answers ?? {};
  const persist = setAnswerProp ?? ((key, answer) => ctx?.setAnswer(key, answer));
  const currency = readCurrencyPreference();
  const costs = costsOf(answers, screen.costsFrom);
  const known = !!costs?.startup.done;
  const startup = costs ? startupTotal(costs) : 0;
  const money = known ? formatStartupMoney(startup, currency) : "";
  const saved = fundingOf(answers, screen.answerKey);
  const [source, setSource] = useState<"own_cash" | "borrow" | null>(saved?.fundingSource ?? null);
  const [step, setStep] = useState<"choose" | "confirm" | "payback">(saved?.fundingSource === "own_cash" ? "confirm" : saved?.fundingSource === "borrow" ? "payback" : "choose");
  const [mode, setMode] = useState<"fixed_over_time" | "weekly_amount" | null>(saved?.fundingRepayMode ?? null);
  const [count, setCount] = useState(saved?.fundingRepayCount ?? 1);
  const [unit, setUnit] = useState<FundingRepayUnit>(saved?.fundingRepayUnit ?? "weeks");
  const [weeklyText, setWeeklyText] = useState(saved?.fundingWeeklyAmount ? String(saved.fundingWeeklyAmount) : "");

  const weekly = Number(weeklyText);
  const weeklyOk = Number.isFinite(weekly) && weekly > 0;
  const payment = periodPayment(startup, count);
  const weeks = weeklyOk ? weeksToRepay(startup, weekly) : null;

  const answer = useMemo((): FundingAnswer | null => {
    if (!known || !source) return null;
    if (source === "own_cash") return { kind: "funding", version: 1, fundingSource: "own_cash", startupTotal: startup, currency };
    if (mode === "fixed_over_time" && count >= 1) {
      return {
        kind: "funding",
        version: 1,
        fundingSource: "borrow",
        startupTotal: startup,
        currency,
        fundingRepayMode: "fixed_over_time",
        fundingRepayCount: count,
        fundingRepayUnit: unit,
        fundingPeriodPayment: payment,
      };
    }
    if (mode === "weekly_amount" && weeklyOk && weeks !== null) {
      return {
        kind: "funding",
        version: 1,
        fundingSource: "borrow",
        startupTotal: startup,
        currency,
        fundingRepayMode: "weekly_amount",
        fundingWeeklyAmount: Math.round(weekly * 100) / 100,
        fundingWeeksToRepay: weeks,
      };
    }
    return null;
  }, [known, source, startup, currency, mode, count, unit, payment, weeklyOk, weekly, weeks]);

  const save = (next: FundingAnswer) => persist(screen.answerKey, next);

  return (
    <section className="flex min-h-0 flex-1 flex-col bg-white" data-task-screen="funding-start" data-funding-step={step}>
      <nav aria-label={s.chrome.breadcrumb} className="mx-5 mt-2 text-[16px] text-[#9AA3B5]">{s.funding.crumb}</nav>
      <div className="mx-5 mt-2 flex items-center gap-1">
        <button type="button" aria-label={s.chrome.back} onClick={() => (step === "choose" ? onExit() : setStep("choose"))} className="flex size-11 items-center justify-center text-[#19347D]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </button>
        <h1 className={`${FREDOKA_CLASS} text-[24px] font-semibold leading-[34px] text-[#19347D]`}>{s.funding.title}</h1>
      </div>
      <div className="mx-5 mt-2 min-h-0 flex-1 overflow-y-auto pb-4">
        {step === "choose" && (
          <>
            <BronzeFirstLead
              flush
              question={screen.copy.prompt}
              context={screen.copy.context}
              guidance={screen.copy.guidance}
              questionClassName={known ? "" : "!text-[#C5CDD8]"}
            />
            {known ? (
              <div className="mt-4 rounded-2xl bg-[#F4FBFE] px-4 py-5 text-center" data-startup-total="">
                <p className="text-[16px] text-[#6B7280]">{s.funding.startupIs}</p>
                <p className="font-heading text-[40px] font-extrabold leading-none text-[#19347D]">{money}</p>
                <p className="mt-1 text-[16px] text-[#9AA3B5]">{s.funding.fromCosts}</p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-[#D9DEE8] px-4 py-6 text-center">
                <p className="font-heading text-3xl text-[#C5CDD8]">$?</p>
                <p className="mt-2 text-[16px] leading-snug text-[#6B7280]">{screen.copy.missing}</p>
                {onGoToCosts && (
                  <button type="button" className="mt-3 inline-flex h-10 items-center rounded-full px-4 font-semibold text-[#0CC1E0] shadow-[inset_0_0_0_1.5px_#0CC1E0]" onClick={onGoToCosts}>
                    {screen.copy.missingAction}
                  </button>
                )}
              </div>
            )}
            {([
              ["own_cash", screen.copy.ownCash],
              ["borrow", screen.copy.borrow],
            ] as const).map(([id, label]) => {
              const on = source === id;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={!known}
                  aria-pressed={on}
                  onClick={() => setSource(id)}
                  className={`mb-2 flex w-full items-center justify-between rounded-2xl px-3 py-3 text-left font-heading text-[16px] font-bold ${on ? "bg-[#F4FBFE] text-[#19347D] shadow-[inset_0_0_0_1.5px_#0CC1E0]" : "bg-white text-[#19347D] shadow-[inset_0_0_0_1.5px_#E5E7EB]"} disabled:text-[#C5CDD8]`}
                >
                  {label}
                  <span className={`size-5 rounded-full ${on ? "bg-[#0CC1E0] shadow-[inset_0_0_0_4px_white,inset_0_0_0_6px_#0CC1E0]" : "shadow-[inset_0_0_0_1.5px_#D9DEE8]"}`} />
                </button>
              );
            })}
          </>
        )}
        {step === "confirm" && (
          <div className="flex flex-col items-center px-2 pt-8 text-center">
            <TickBadge size={56} />
            <p className="mt-4 font-sans text-[18px] font-normal leading-[26px] text-[#19347D]">
              {screen.copy.ownCashConfirm.replace("{startup-total} {currency}", money)}
            </p>
          </div>
        )}
        {step === "payback" && (
          <>
            <p className="inline-flex rounded-full bg-[#E7F8FC] px-3 py-1 text-[18px] font-semibold text-[#19347D]">Borrowing {money}</p>
            <h2 className={`mt-3 ${FREDOKA_CLASS} text-[21px] font-semibold leading-[30px] text-[#0CC1E0]`}>{screen.copy.paybackTitle}</h2>
            <div className={`mt-3 w-full rounded-2xl p-3 text-left ${mode === "fixed_over_time" ? "shadow-[inset_0_0_0_1.5px_#0CC1E0]" : "shadow-[inset_0_0_0_1.5px_#E5E7EB]"}`}>
              <button type="button" aria-pressed={mode === "fixed_over_time"} onClick={() => setMode("fixed_over_time")} className="w-full text-left">
                <span className="font-heading text-[16px] font-bold text-[#19347D]">{screen.copy.fixedMode}</span>
                <span className="mt-0.5 block text-[16px] text-[#6B7280]">{screen.copy.fixedHelp}</span>
              </button>
              {mode === "fixed_over_time" && (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] text-[#19347D]">{s.funding.payBackOver}</span>
                    <button type="button" aria-label={s.funding.fewerPeriods} className="flex size-9 items-center justify-center rounded-lg shadow-[inset_0_0_0_1.5px_#D9DEE8]" onClick={() => setCount(Math.max(1, count - 1))}>−</button>
                    <span className="w-6 text-center font-heading font-bold" data-repay-count="">{count}</span>
                    <button type="button" aria-label={s.funding.morePeriods} className="flex size-9 items-center justify-center rounded-lg shadow-[inset_0_0_0_1.5px_#D9DEE8]" onClick={() => setCount(count + 1)}>+</button>
                  </div>
                  <div className="mt-2 flex gap-2">
                    {(["weeks", "months"] as const).map((item) => (
                      <button key={item} type="button" aria-pressed={unit === item} onClick={() => setUnit(item)} className={`h-9 rounded-full px-3 text-[16px] font-semibold ${unit === item ? "bg-[#E7F8FC] text-[#19347D]" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
                        {item === "weeks" ? "Weeks" : "Months"}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 rounded-xl bg-[#F4FBFE] px-3 py-3">
                    <p className="text-[16px] font-semibold uppercase tracking-wide text-[#0A8FA8]">{unit === "weeks" ? s.funding.eachWeek : s.funding.eachMonth}</p>
                    <p className="font-heading text-[28px] font-extrabold text-[#19347D]" data-period-payment="">{formatMoney(payment, currency)}</p>
                    <p className="text-[18px] text-[#19347D]">
                      {s.funding.youWillPay} {formatMoney(payment, currency)} each {unitWord(unit, 1)} for {count} {unitWord(unit, count)}.
                    </p>
                    <p className="text-[16px] text-[#6B7280]">{money} / {count} = {formatMoney(payment, currency)}</p>
                  </div>
                </div>
              )}
            </div>
            <div className={`mt-3 w-full rounded-2xl p-3 text-left ${mode === "weekly_amount" ? "shadow-[inset_0_0_0_1.5px_#0CC1E0]" : "shadow-[inset_0_0_0_1.5px_#E5E7EB]"}`}>
              <button type="button" aria-pressed={mode === "weekly_amount"} onClick={() => setMode("weekly_amount")} className="w-full text-left">
                <span className="font-heading text-[16px] font-bold text-[#19347D]">{screen.copy.weeklyMode}</span>
                <span className="mt-0.5 block text-[16px] text-[#6B7280]">{screen.copy.weeklyHelp}</span>
              </button>
              {mode === "weekly_amount" && (
                <div className="mt-3">
                  <label className="flex items-center gap-2 text-[18px] text-[#19347D]">
                    {s.funding.iWillPay}
                    <input aria-label={s.funding.weeklyAmount} inputMode="decimal" value={weeklyText} onChange={(event) => setWeeklyText(event.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1"))} className="h-10 w-16 rounded-lg text-center font-bold shadow-[inset_0_0_0_1.5px_#0CC1E0] outline-none" />
                    {s.funding.aWeek}
                  </label>
                  {weeks !== null && (
                    <div className="mt-3 rounded-xl bg-[#F4FBFE] px-3 py-3">
                      <p className="text-[16px] font-semibold uppercase tracking-wide text-[#0A8FA8]">{s.funding.paidBack}</p>
                      <p className="font-heading text-[28px] font-extrabold text-[#19347D]" data-weeks-to-repay="">{weeks} {unitWord("weeks", weeks)}</p>
                      <p className="text-[18px] text-[#19347D]">
                        At {formatMoney(weekly, currency)} {s.funding.atAWeek} {weeks} {unitWord("weeks", weeks)} {s.funding.toPayBack} {money}.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="mt-4 text-[16px] leading-snug text-[#6B7280]">{screen.copy.disclaimer}</p>
          </>
        )}
      </div>
      <div className="px-5 pb-[18px]">
        {step === "choose" ? (
          <LessonContinue disabled={!known || !source} onClick={() => source && setStep(source === "own_cash" ? "confirm" : "payback")}>Next</LessonContinue>
        ) : (
          <LessonContinue
            disabled={!answer}
            onClick={() => {
              if (!answer) return;
              save(answer);
              onFinish(answer);
            }}
          >
            Done
          </LessonContinue>
        )}
      </div>
    </section>
  );
}
