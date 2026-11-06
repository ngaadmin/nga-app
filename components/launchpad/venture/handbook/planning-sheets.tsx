"use client";

import { jobsOf, priceOf, fundingOf } from "@/lib/launchpad/content/answers";
import { JOBS_COVER_ANSWER_KEY, SET_PRICE_ANSWER_KEY } from "@/lib/launchpad/content/pricing/screens";
import { FUNDING_ANSWER_KEY } from "@/lib/launchpad/content/planning/funding";
import { formatMoney } from "@/lib/dashboard/currency/format-money";
import { formatStartupMoney } from "@/lib/launchpad/content/know-your-cost/logic";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { AccentLabel } from "@/components/launchpad/venture/handbook/paper-art";
import { ART, Sticker } from "@/components/launchpad/venture/handbook/workbook-frame";
import { chosenServices } from "@/lib/launchpad/content/know-your-cost/logic";

function nameFor(id: string, labels: readonly { id: string; label: string }[]): string {
  return labels.find((row) => row.id === id)?.label ?? id;
}

/** My price, written on the page. The coin stack sits below the figures. */
export function PriceSheet() {
  const ctx = useLaunchpadAnswers();
  const price = priceOf(ctx?.answers, SET_PRICE_ANSWER_KEY);
  const labels = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  const currency = readCurrencyPreference();
  if (!price) return null;
  return (
    <div data-price-sheet="">
      <AccentLabel as="h2">My price</AccentLabel>
      <p className="mt-2 text-[13px] leading-snug text-[#6B7280]">Each service has its own price and its own job cost.</p>
      {price.prices.map((row) => (
        <div key={row.serviceId} className="mt-4 border-t border-dashed border-[#E4D3B4] pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-heading text-[18px] font-semibold text-[#19347D]">{nameFor(row.serviceId, labels)}</h3>
            <span className="font-heading text-[22px] font-bold text-[#19347D]">{formatMoney(row.price, currency)}</span>
          </div>
          <p className="mt-2 text-[14px] text-[#19347D]">Price {formatMoney(row.price, currency)}</p>
          <p className="text-[14px] text-[#19347D]">Job cost per job {formatMoney(row.costPerJob, currency)}</p>
          <p className="font-semibold text-[#19347D]">I keep {formatMoney(row.keptPerJob, currency)}</p>
          <p className="text-[13px] text-[#6B7280]">
            {formatMoney(row.price, currency)} − {formatMoney(row.costPerJob, currency)} = {formatMoney(row.keptPerJob, currency)}
          </p>
        </div>
      ))}
      <p className="mt-3 text-[12px] text-[#9AA3B5]">Job cost comes from My costs (Page 3b).</p>
      <div className="mt-6 flex justify-end pr-2">
        <Sticker src={ART.coins} alt="" />
      </div>
    </div>
  );
}

export function JobsSheet() {
  const ctx = useLaunchpadAnswers();
  const jobs = jobsOf(ctx?.answers, JOBS_COVER_ANSWER_KEY);
  const labels = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  const currency = readCurrencyPreference();
  if (!jobs) return null;
  return (
    <div data-jobs-sheet="">
      <AccentLabel as="h2">Jobs to cover my costs</AccentLabel>
      {jobs.mode === "multi" && jobs.typicalWeek ? (
        <ul className="mt-3 text-[15px] leading-snug text-[#19347D]">
          {jobs.typicalWeek.map((row) => (
            <li key={row.serviceId}>
              {row.jobsPerWeek} {nameFor(row.serviceId, labels)} · I keep {formatMoney(row.subtotal, currency)}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[15px] text-[#19347D]">
          {jobs.jobsPerWeek} jobs a week · I keep {formatMoney(jobs.keptPerJob ?? 0, currency)}
        </p>
      )}
      <p className="mt-3 font-heading text-[16px] font-semibold text-[#19347D]">Weekly keep {formatMoney(jobs.weeklyKeep ?? 0, currency)}</p>
      <p className="text-[15px] text-[#19347D]">Start-up to cover {formatStartupMoney(jobs.startupTotal, currency)}</p>
      <p className="mt-1 text-[15px] font-semibold text-[#19347D]">About {jobs.weeksNeeded} weeks to cover start-up.</p>
      <div className="mt-6 flex justify-end">
        <Sticker src={ART.growth} alt="" />
      </div>
    </div>
  );
}

/** Funding wrap. Source and payback only. No lender. */
export function FundingSheet() {
  const ctx = useLaunchpadAnswers();
  const funding = fundingOf(ctx?.answers, FUNDING_ANSWER_KEY);
  if (!funding) return <p className="text-[14px] text-[#9CA3AF]">Not answered yet</p>;
  const currency = funding.currency === "USD" ? "USD" : funding.currency;
  const total = formatStartupMoney(funding.startupTotal, currency as "USD");
  const pay = funding.fundingPeriodPayment !== undefined ? formatMoney(funding.fundingPeriodPayment, currency as "USD") : "";
  const weekly = funding.fundingWeeklyAmount !== undefined ? formatMoney(funding.fundingWeeklyAmount, currency as "USD") : "";
  return (
    <div data-funding-wrap="">
      <AccentLabel as="h2">Planning</AccentLabel>
      <h3 className="mt-3 font-heading text-[16px] font-semibold text-[#3FB7DA]">How I&apos;ll cover my start-up costs</h3>
      {funding.fundingSource === "own_cash" ? (
        <p className="mt-2 text-[15px] leading-snug text-[#19347D]">I&apos;ll cover my start-up cost of {total} from my own cash or savings.</p>
      ) : (
        <ul className="mt-2 list-disc pl-5 text-[15px] leading-snug text-[#19347D]">
          <li>I&apos;ll borrow {total}</li>
          <li>
            {funding.fundingRepayMode === "fixed_over_time"
              ? `I'll pay it back: fixed amount, about ${pay} each ${funding.fundingRepayUnit === "months" ? "month" : "week"} for ${funding.fundingRepayCount} ${funding.fundingRepayUnit}.`
              : `I'll pay it back: ${weekly} a week, about ${funding.fundingWeeksToRepay} weeks.`}
          </li>
        </ul>
      )}
      {funding.fundingSource === "borrow" && (
        <p className="mt-2 text-[13px] text-[#6B7280]">Real loans usually add interest; we&apos;ve left that out here to keep it simple.</p>
      )}
      <div className="mt-8 flex items-end justify-between">
        <Sticker src={ART.wallet} alt="" />
        <img src={ART.pennyMaster} alt="" width={46} height={46} className="h-[46px] w-auto" />
      </div>
    </div>
  );
}
