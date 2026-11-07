"use client";

import { competitorOf, costsOf, customerOf, jobsOf, offerOf, priceOf, fundingOf, type JobsAnswer } from "@/lib/launchpad/content/answers";
import { JOBS_COVER_ANSWER_KEY, SET_PRICE_ANSWER_KEY } from "@/lib/launchpad/content/pricing/screens";
import { weeklyKeep, weeksFromWeeklyKeep } from "@/lib/launchpad/content/pricing/calc";
import { COMPETITOR_ANSWER_KEY, CUSTOMER_ANSWER_KEY, OFFER_ANSWER_KEY } from "@/lib/launchpad/content/planning/screens";
import { availabilityPhrase, chipLabel, isAvailabilitySlot } from "@/lib/launchpad/content/planning/catalog";
import { FUNDING_ANSWER_KEY } from "@/lib/launchpad/content/planning/funding";
import { formatMoney } from "@/lib/dashboard/currency/format-money";
import { formatStartupMoney, workbookView, chosenServices } from "@/lib/launchpad/content/know-your-cost/logic";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { ChosenValue } from "@/components/launchpad/venture/handbook/chosen-value";
import { AccentLabel } from "@/components/launchpad/venture/handbook/paper-art";
import { ART, Sticker } from "@/components/launchpad/venture/handbook/workbook-frame";
import { FlatSticker } from "@/components/launchpad/venture/handbook/flat-stickers";

function WeekBar({ label, width }: { label: string; width: number }) {
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-[12px] text-[#6B7280]">
        <span>{label}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#E7E1D6]" aria-hidden="true">
        <div className="h-full bg-[#3FB7DA]" style={{ width: `${Math.max(8, Math.min(100, width))}%` }} />
      </div>
    </div>
  );
}

function nameFor(id: string, labels: readonly { id: string; label: string }[]): string {
  return labels.find((row) => row.id === id)?.label ?? id;
}

/** My price, written on the page. The coin stack sits below the figures. */
export function PriceSheet() {
  const ctx = useLaunchpadAnswers();
  const price = priceOf(ctx?.answers, SET_PRICE_ANSWER_KEY);
  const offer = offerOf(ctx?.answers, OFFER_ANSWER_KEY);
  const competitor = competitorOf(ctx?.answers, COMPETITOR_ANSWER_KEY);
  const labels = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  const currency = readCurrencyPreference();
  if (!price) return null;
  return (
    <div data-price-sheet="">
      <AccentLabel as="h2">My price</AccentLabel>
      <p className="mt-2 text-[13px] leading-snug text-[#6B7280]">Each service has its own price and its own job cost.</p>
      {price.prices.map((row) => {
        const pkg = offer?.offerings.find((item) => item.serviceId === row.serviceId)?.packages[0];
        const compared = row.serviceId === "dog-walking" || row.serviceId === competitor?.jobComparedId;
        return (
        <div key={row.serviceId} className="mt-2 border-t border-dashed border-[#E4D3B4] pt-2 leading-tight">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-heading text-[18px] font-semibold text-[#19347D]">{nameFor(row.serviceId, labels)}</h3>
            <span className="font-heading text-[22px] font-bold text-[#19347D]"><ChosenValue>{formatMoney(row.price, currency)}</ChosenValue></span>
          </div>
          <p className="mt-1 text-[14px] text-[#19347D]">for one <ChosenValue>{pkg ? chipLabel(pkg) : "job"}</ChosenValue></p>
          <p className="text-[14px] text-[#4B5563]">
            {compared && competitor ? (
              <>
                Others charge <ChosenValue>{formatMoney(competitor.priceLow, currency)}</ChosenValue> to <ChosenValue>{formatMoney(competitor.priceHigh, currency)}</ChosenValue>. Mine is <ChosenValue>{row.comparedToOthers ?? "about the same as"}</ChosenValue> others.
              </>
            ) : (
              "Others range: not checked yet."
            )}
          </p>
          <p className="mt-2 text-[14px] text-[#19347D]">Price <ChosenValue>{formatMoney(row.price, currency)}</ChosenValue></p>
          <p className="text-[14px] text-[#19347D]">Job cost per job <ChosenValue>{formatMoney(row.costPerJob, currency)}</ChosenValue></p>
          <p className="text-[#19347D]">I keep <ChosenValue>{formatMoney(row.keptPerJob, currency)}</ChosenValue></p>
          <p className="text-[13px] text-[#6B7280]">
            {formatMoney(row.price, currency)} − {formatMoney(row.costPerJob, currency)} = {formatMoney(row.keptPerJob, currency)}
          </p>
        </div>
        );
      })}
      <p className="mt-3 text-[12px] text-[#9AA3B5]">Job cost comes from My costs (Page 3b).</p>
      <div className="mt-2 flex justify-end pr-2">
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
  const changeCount = (serviceId: string, delta: number) => {
    if (!jobs.typicalWeek || !ctx?.setAnswer) return;
    const typicalWeek = jobs.typicalWeek.map((row) => {
      if (row.serviceId !== serviceId) return row;
      const jobsPerWeek = Math.min(7, Math.max(0, row.jobsPerWeek + delta));
      return { ...row, jobsPerWeek, subtotal: Math.round(jobsPerWeek * row.keptPerJob * 100) / 100 };
    });
    const weekly = weeklyKeep(typicalWeek);
    const next: JobsAnswer = {
      ...jobs,
      typicalWeek,
      weeklyKeep: weekly,
      weeksNeeded: weeksFromWeeklyKeep(jobs.startupTotal, weekly) ?? 0,
    };
    ctx.setAnswer(JOBS_COVER_ANSWER_KEY, next);
  };
  return (
    <div data-jobs-sheet="">
      <AccentLabel as="h2">Jobs to cover my costs</AccentLabel>
      {jobs.mode === "multi" && jobs.typicalWeek ? (
        <ul className="mt-3">
          {jobs.typicalWeek.map((row) => (
            <li key={row.serviceId} className="flex items-center justify-between gap-2 border-b border-dashed border-[#E4D3B4] py-2 text-[15px] text-[#19347D]">
              <span className="flex items-center gap-2">
                <button type="button" aria-label={`Fewer ${nameFor(row.serviceId, labels)} jobs`} className="flex size-8 items-center justify-center rounded-full border border-[#19347D] text-[#19347D]" onClick={() => changeCount(row.serviceId, -1)}>−</button>
                <span className="w-4 text-center"><ChosenValue>{row.jobsPerWeek}</ChosenValue></span>
                <button type="button" aria-label={`More ${nameFor(row.serviceId, labels)} jobs`} className="flex size-8 items-center justify-center rounded-full border border-[#19347D] text-[#19347D]" onClick={() => changeCount(row.serviceId, 1)}>+</button>
                <span>{nameFor(row.serviceId, labels)}</span>
              </span>
              <span>I keep <ChosenValue>{formatMoney(row.subtotal, currency)}</ChosenValue></span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-[15px] text-[#19347D]">
          <ChosenValue>{jobs.jobsPerWeek}</ChosenValue> jobs a week · I keep <ChosenValue>{formatMoney(jobs.keptPerJob ?? 0, currency)}</ChosenValue>
        </p>
      )}
      <p className="mt-3 font-heading text-[16px] text-[#19347D]">Weekly keep <ChosenValue>{formatMoney(jobs.weeklyKeep ?? 0, currency)}</ChosenValue></p>
      <p className="text-[15px] text-[#19347D]">Start-up to cover <ChosenValue>{formatStartupMoney(jobs.startupTotal, currency)}</ChosenValue></p>
      <p className="mt-1 text-[15px] text-[#19347D]">About <ChosenValue>{jobs.weeksNeeded}</ChosenValue> weeks to cover start-up.</p>
      <p className="mt-1 text-[13px] text-[#6B7280]">
        {formatStartupMoney(jobs.startupTotal, currency)} ÷ {formatMoney(jobs.weeklyKeep ?? 0, currency)} a week
        {jobs.weeklyKeep ? ` = ${(jobs.startupTotal / jobs.weeklyKeep).toFixed(2)}, round up to ${jobs.weeksNeeded}` : ""}.
      </p>
      <WeekBar label="Week 1" width={100} />
      {jobs.weeksNeeded > 1 && <WeekBar label="Week 2" width={Math.round(((jobs.startupTotal / (jobs.weeklyKeep || 1)) - 1) * 100)} />}
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
        <p className="mt-2 text-[15px] leading-snug text-[#19347D]">
          I&apos;ll cover my start-up cost of <ChosenValue>{total}</ChosenValue> from my own cash or savings.
        </p>
      ) : (
        <ul className="mt-2 list-disc pl-5 text-[15px] leading-snug text-[#19347D]">
          <li>I&apos;ll borrow <ChosenValue>{total}</ChosenValue></li>
          <li>
            {funding.fundingRepayMode === "fixed_over_time" ? (
              <>
                I&apos;ll pay it back: fixed amount, about <ChosenValue>{pay}</ChosenValue> each {funding.fundingRepayUnit === "months" ? "month" : "week"} for <ChosenValue>{funding.fundingRepayCount}</ChosenValue> {funding.fundingRepayUnit}.
              </>
            ) : (
              <>
                I&apos;ll pay it back: <ChosenValue>{weekly}</ChosenValue> a week, about <ChosenValue>{funding.fundingWeeksToRepay}</ChosenValue> weeks.
              </>
            )}
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

/** Pricing workbook page. The competitor lesson form stays separate. */
export function PricingSummarySheet() {
  const ctx = useLaunchpadAnswers();
  const competitor = competitorOf(ctx?.answers, COMPETITOR_ANSWER_KEY);
  const addons = competitor?.addons.map((id) => chipLabel(id).toLowerCase()) ?? [];
  const idea = competitor ? chipLabel(competitor.doDifferently).toLowerCase() : "";
  return (
    <div data-pricing-summary="">
      <AccentLabel as="h2">Pricing</AccentLabel>
      <p className="mt-3 text-[15px] leading-snug text-[#19347D]">
        {addons.length ? (
          <>
            They often include <ChosenValue>{addons.join(" and ")}</ChosenValue>.
          </>
        ) : (
          "What others include is not checked yet."
        )}
      </p>
      <p className="mt-2 text-[15px] leading-snug text-[#19347D]">{idea ? <>I could do differently: <ChosenValue>{idea}</ChosenValue>.</> : ""}</p>
      <p className="mt-3 text-[13px] text-[#6B7280]">Full list on Pages 3 and 3b. Tap a line to change it.</p>
      <div className="mt-6 flex items-end gap-3">
        <img src={ART.pennyThinking} alt="" width={46} height={46} className="h-[46px] w-auto shrink-0" />
        <FlatSticker kind="bulb" doodle />
        <FlatSticker kind="sparkle" doodle />
        <FlatSticker kind="sparkle" doodle />
      </div>
    </div>
  );
}

export function PlanningWrapSheet({ sheet }: { sheet: "plan-1" | "plan-2" | "plan-3" | "plan-4" }) {
  const part = sheet === "plan-1" ? 1 : sheet === "plan-2" ? 2 : sheet === "plan-3" ? 3 : 4;
  return (
    <div data-planning-wrap={sheet}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#9AA3B5]">Planning · Level 2 · {part} of 4</p>
      {sheet === "plan-1" && <PlanSelling />}
      {sheet === "plan-2" && <PlanCosts />}
      {sheet === "plan-3" && <PlanOthers />}
      {sheet === "plan-4" && <PlanWeek />}
    </div>
  );
}

function PlanSelling() {
  const ctx = useLaunchpadAnswers();
  const offer = offerOf(ctx?.answers, OFFER_ANSWER_KEY);
  const customer = customerOf(ctx?.answers, CUSTOMER_ANSWER_KEY);
  const labels = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  return (
    <div>
      <h3 className="mt-3 font-heading text-[16px] font-semibold text-[#3FB7DA]">What I am selling</h3>
      {offer?.offerings.map((row) => (
        <p key={row.serviceId} className="mt-1 text-[15px] leading-snug text-[#19347D]">
          {nameFor(row.serviceId, labels)}: <ChosenValue>{row.packages.map(chipLabel).join(", ")}</ChosenValue>
          {row.addons.length ? (
            <>
              {" "}
              with <ChosenValue>{row.addons.map(chipLabel).join(", ")}</ChosenValue>
            </>
          ) : null}
          .
        </p>
      ))}
      <h3 className="mt-3 font-heading text-[16px] font-semibold text-[#3FB7DA]">When and who might want it</h3>
      <p className="mt-1 text-[15px] text-[#19347D]">
        {offer?.availability.length ? (
          <ChosenValue>{offer.availability.every(isAvailabilitySlot) ? availabilityPhrase(offer.availability) : offer.availability.map(chipLabel).join(", ")}</ChosenValue>
        ) : (
          "Not answered yet"
        )}
        .
      </p>
      {customer && (
        <p className="mt-1 text-[15px] text-[#19347D]">
          I asked <ChosenValue>{customer.numberAsked}</ChosenValue> people. They were interested in <ChosenValue>{customer.interests.map(chipLabel).join(", ")}</ChosenValue>.
        </p>
      )}
      <p className="mt-2 text-[12px] text-[#9AA3B5]">Tap a line to change your picks.</p>
      <div className="mt-4 flex justify-end"><Sticker src={ART.ticket} alt="" /></div>
    </div>
  );
}

function PlanCosts() {
  const ctx = useLaunchpadAnswers();
  const costs = costsOf(ctx?.answers, "l2-costs");
  const view = costs ? workbookView(costs) : null;
  const currency = readCurrencyPreference();
  if (!view) return null;
  return (
    <div>
      <h3 className="mt-3 font-heading text-[16px] font-semibold text-[#3FB7DA]">My costs</h3>
      {[...view.marketing, ...view.starterGear].map((line) => (
        <p key={line.id} className="flex justify-between border-b border-dashed border-[#E4D3B4] py-1 text-[14px] text-[#19347D]">
          <span>{line.label}</span>
          <ChosenValue>{formatStartupMoney(line.amount, currency)}</ChosenValue>
        </p>
      ))}
      <p className="mt-2 text-[#19347D]">Start-up total <ChosenValue>{formatStartupMoney(view.startupTotal, currency)}</ChosenValue></p>
      <p className="mt-2 text-[14px] text-[#19347D]">
        Ongoing cost per job: {view.ongoing.map((row, index) => (
          <span key={row.serviceId}>
            {index > 0 ? ", " : ""}
            {row.label} <ChosenValue>{formatMoney(row.perJob, currency)}</ChosenValue>
          </span>
        ))}
        .
      </p>
    </div>
  );
}

function PlanOthers() {
  const ctx = useLaunchpadAnswers();
  const competitor = competitorOf(ctx?.answers, COMPETITOR_ANSWER_KEY);
  const price = priceOf(ctx?.answers, SET_PRICE_ANSWER_KEY);
  const currency = readCurrencyPreference();
  const labels = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  const addons = competitor?.addons.map((id) => chipLabel(id).toLowerCase()).join(" and ") ?? "";
  return (
    <div>
      <h3 className="mt-3 font-heading text-[16px] font-semibold text-[#3FB7DA]">What others charge</h3>
      <p className="mt-1 text-[15px] leading-snug text-[#19347D]">
        {competitor
          ? (
            <>
              <ChosenValue>{competitor.walkersChecked}</ChosenValue> other walkers charge <ChosenValue>{formatMoney(competitor.priceLow, currency)}</ChosenValue> to <ChosenValue>{formatMoney(competitor.priceHigh, currency)}</ChosenValue>. They often include <ChosenValue>{addons}</ChosenValue>.
            </>
          )
          : "Not checked yet."}
      </p>
      {competitor && (
        <p className="mt-1 text-[15px] text-[#19347D]">
          I could do differently: <ChosenValue>{chipLabel(competitor.doDifferently).toLowerCase()}</ChosenValue>.
        </p>
      )}
      <h3 className="mt-3 font-heading text-[16px] font-semibold text-[#3FB7DA]">My price</h3>
      {price?.prices.map((row) => (
        <p key={row.serviceId} className="mt-1 text-[15px] leading-snug text-[#19347D]">
          {nameFor(row.serviceId, labels)} · I keep <ChosenValue>{formatMoney(row.keptPerJob, currency)}</ChosenValue>
          <span className="block text-[13px] text-[#6B7280]">
            {formatMoney(row.price, currency)} − {formatMoney(row.costPerJob, currency)} = {formatMoney(row.keptPerJob, currency)}
          </span>
        </p>
      ))}
      <p className="mt-2 text-[13px] text-[#6B7280]">Each line: price − job cost = I keep. Tap a line to change it. Costs and prices stay read-only here.</p>
    </div>
  );
}

function PlanWeek() {
  const ctx = useLaunchpadAnswers();
  const jobs = jobsOf(ctx?.answers, JOBS_COVER_ANSWER_KEY);
  const labels = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  const currency = readCurrencyPreference();
  if (!jobs) return null;
  const mix = jobs.typicalWeek?.map((row) => `${row.jobsPerWeek} ${nameFor(row.serviceId, labels)}`).join(" + ") ?? "";
  const math = jobs.typicalWeek?.map((row) => `${row.jobsPerWeek} × ${formatMoney(row.keptPerJob, currency)}`).join(" + ");
  return (
    <div>
      <h3 className="mt-3 font-heading text-[16px] font-semibold text-[#3FB7DA]">Jobs to cover my costs</h3>
      <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#9AA3B5]">Typical week</p>
      <p className="mt-1 text-[15px] text-[#19347D]"><ChosenValue>{mix}</ChosenValue> a week.</p>
      <p className="text-[15px] text-[#19347D]">Keep <ChosenValue>{formatMoney(jobs.weeklyKeep ?? 0, currency)}</ChosenValue> a week.</p>
      <p className="text-[15px] text-[#19347D]">About <ChosenValue>{jobs.weeksNeeded}</ChosenValue> weeks to cover <ChosenValue>{formatStartupMoney(jobs.startupTotal, currency)}</ChosenValue> start-up.</p>
      {math && (
        <p className="mt-1 text-[13px] text-[#6B7280]">
          {math} = {formatMoney(jobs.weeklyKeep ?? 0, currency)} a week.
        </p>
      )}
      <p className="mt-2 text-[13px] text-[#6B7280]">Your typical week stays read-only here.</p>
      <div className="mt-4 flex justify-end">
        <Sticker src={ART.jar} alt="" />
      </div>
    </div>
  );
}
