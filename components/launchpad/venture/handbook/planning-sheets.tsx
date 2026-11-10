"use client";

import { competitorOf, costsOf, customerOf, jobsOf, offerOf, priceOf, fundingOf, type JobsAnswer } from "@/lib/launchpad/content/answers";
import { JOBS_COVER_ANSWER_KEY, SET_PRICE_ANSWER_KEY } from "@/lib/launchpad/content/pricing/screens";
import { weeklyKeep, weeksFromWeeklyKeep } from "@/lib/launchpad/content/pricing/calc";
import { COMPETITOR_ANSWER_KEY, CUSTOMER_ANSWER_KEY, OFFER_ANSWER_KEY } from "@/lib/launchpad/content/planning/screens";
import { availabilityPhrase, chipLabel, isAvailabilitySlot, WHEN_OPTIONS } from "@/lib/launchpad/content/planning/catalog";
import { FUNDING_ANSWER_KEY } from "@/lib/launchpad/content/planning/funding";
import { formatWorkbookMoney } from "@/lib/dashboard/currency/format-money";
import { formatStartupMoney, workbookView, chosenServices } from "@/lib/launchpad/content/know-your-cost/logic";
import { readCurrencyPreference } from "@/lib/dashboard/currency/currency-storage";
import { useLaunchpadAnswers } from "@/components/launchpad/venture/identity/answers-context";
import { ChosenValue } from "@/components/launchpad/venture/handbook/chosen-value";
import { AccentLabel, WORKBOOK_ANSWER, WORKBOOK_BODY, WORKBOOK_HINT, WORKBOOK_PRICE_ROW } from "@/components/launchpad/venture/handbook/paper-art";
import { BlankSlot, useTemplateBlanks } from "@/components/launchpad/venture/handbook/template-blanks";
import { LargeScribble } from "@/components/launchpad/venture/handbook/scribble-mark";

function WeekBar({ label, width }: { label: string; width: number }) {
  return (
    <div className="mt-2">
      <div className={`flex items-center justify-between ${WORKBOOK_HINT}`}>
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
  const templates = useTemplateBlanks();
  if (!price) {
    if (!templates) return null;
    return (
      <div data-price-sheet="">
        <AccentLabel as="h2">My price</AccentLabel>
        <p className={`mt-2 ${WORKBOOK_HINT}`}>Each service has its own price and its own job cost.</p>
        <p className={`mt-2 ${WORKBOOK_BODY}`}>Price <BlankSlot /> for one <BlankSlot /></p>
      </div>
    );
  }
  return (
    <div data-price-sheet="">
      <AccentLabel as="h2">My price</AccentLabel>
      <p className={`mt-2 ${WORKBOOK_HINT}`}>Each service has its own price and its own job cost.</p>
      {price.prices.map((row) => {
        const pkg = offer?.offerings.find((item) => item.serviceId === row.serviceId)?.packages[0];
        const compared = row.serviceId === "dog-walking" || row.serviceId === competitor?.jobComparedId;
        return (
        <div key={row.serviceId} className="mt-2 border-t border-dashed border-[#E4D3B4] pt-2">
          <div className={WORKBOOK_PRICE_ROW}>
            <h3 className={WORKBOOK_ANSWER}>{nameFor(row.serviceId, labels)}</h3>
            <span className="text-left"><ChosenValue>{formatWorkbookMoney(row.price, currency)}</ChosenValue></span>
          </div>
          <p className={`mt-1 ${WORKBOOK_BODY}`}>for one <ChosenValue>{pkg ? chipLabel(pkg) : "job"}</ChosenValue></p>
          <p className={WORKBOOK_BODY}>
            {compared && competitor ? (
              <>
                Others charge <ChosenValue>{formatWorkbookMoney(competitor.priceLow, currency)}</ChosenValue> to <ChosenValue>{formatWorkbookMoney(competitor.priceHigh, currency)}</ChosenValue>. Mine is <ChosenValue>{row.comparedToOthers ?? "about the same as"}</ChosenValue> others.
              </>
            ) : (
              "Others range: not checked yet."
            )}
          </p>
          <p className={`mt-2 ${WORKBOOK_BODY}`}>Price <ChosenValue>{formatWorkbookMoney(row.price, currency)}</ChosenValue></p>
          <p className={WORKBOOK_BODY}>Job cost per job <ChosenValue>{formatWorkbookMoney(row.costPerJob, currency)}</ChosenValue></p>
          <p className={WORKBOOK_BODY}>I keep <ChosenValue>{formatWorkbookMoney(row.keptPerJob, currency)}</ChosenValue></p>
          <p className={WORKBOOK_HINT}>
            {formatWorkbookMoney(row.price, currency)} − {formatWorkbookMoney(row.costPerJob, currency)} = {formatWorkbookMoney(row.keptPerJob, currency)}
          </p>
        </div>
        );
      })}
      <p className={`mt-3 ${WORKBOOK_HINT}`}>Job cost comes from My costs.</p>
      <LargeScribble name="coins" />
    </div>
  );
}

export function JobsSheet() {
  const ctx = useLaunchpadAnswers();
  const jobs = jobsOf(ctx?.answers, JOBS_COVER_ANSWER_KEY);
  const labels = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  const currency = readCurrencyPreference();
  const templates = useTemplateBlanks();
  if (!jobs) {
    if (!templates) return null;
    return (
      <div data-jobs-sheet="">
        <AccentLabel as="h2">Jobs to cover my costs</AccentLabel>
        <p className={`mt-3 ${WORKBOOK_BODY}`}><BlankSlot /> jobs a week · I keep <BlankSlot /></p>
        <p className={`mt-3 ${WORKBOOK_BODY}`}>Weekly keep <BlankSlot /></p>
        <p className={WORKBOOK_BODY}>Start-up to cover <BlankSlot /></p>
        <p className={`mt-1 ${WORKBOOK_BODY}`}>About <BlankSlot /> weeks to cover start-up.</p>
      </div>
    );
  }
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
            <li key={row.serviceId} className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-dashed border-[#E4D3B4] py-2 ${WORKBOOK_BODY}`}>
              <span className="flex shrink-0 items-center gap-2">
                <button type="button" aria-label={`Fewer ${nameFor(row.serviceId, labels)} jobs`} className="flex size-8 items-center justify-center rounded-full border border-[#19347D] text-[#19347D]" onClick={() => changeCount(row.serviceId, -1)}>−</button>
                <span className="w-4 text-center"><ChosenValue>{row.jobsPerWeek}</ChosenValue></span>
                <button type="button" aria-label={`More ${nameFor(row.serviceId, labels)} jobs`} className="flex size-8 items-center justify-center rounded-full border border-[#19347D] text-[#19347D]" onClick={() => changeCount(row.serviceId, 1)}>+</button>
                <span className="whitespace-nowrap">{nameFor(row.serviceId, labels)}</span>
              </span>
              <span className="shrink-0 whitespace-nowrap">I keep <ChosenValue>{formatWorkbookMoney(row.subtotal, currency)}</ChosenValue></span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`mt-3 ${WORKBOOK_BODY}`}>
          <ChosenValue>{jobs.jobsPerWeek}</ChosenValue> jobs a week · I keep <ChosenValue>{formatWorkbookMoney(jobs.keptPerJob ?? 0, currency)}</ChosenValue>
        </p>
      )}
      <p className={`mt-3 ${WORKBOOK_BODY}`}>Weekly keep <ChosenValue>{formatWorkbookMoney(jobs.weeklyKeep ?? 0, currency)}</ChosenValue></p>
      <p className={WORKBOOK_BODY}>Start-up to cover <ChosenValue>{formatStartupMoney(jobs.startupTotal, currency)}</ChosenValue></p>
      <p className={`mt-1 ${WORKBOOK_BODY}`}>About <ChosenValue>{jobs.weeksNeeded}</ChosenValue> weeks to cover start-up.</p>
      <p className={`mt-1 ${WORKBOOK_HINT}`}>
        {formatStartupMoney(jobs.startupTotal, currency)} ÷ {formatWorkbookMoney(jobs.weeklyKeep ?? 0, currency)} a week
        {jobs.weeklyKeep ? ` = ${(jobs.startupTotal / jobs.weeklyKeep).toFixed(2)}, round up to ${jobs.weeksNeeded}` : ""}.
      </p>
      <WeekBar label="Week 1" width={100} />
      {jobs.weeksNeeded > 1 && <WeekBar label="Week 2" width={Math.round(((jobs.startupTotal / (jobs.weeklyKeep || 1)) - 1) * 100)} />}
      <LargeScribble name="growth" />
    </div>
  );
}

/** Funding wrap. Source and payback only. No lender. */
export function FundingSheet() {
  const ctx = useLaunchpadAnswers();
  const funding = fundingOf(ctx?.answers, FUNDING_ANSWER_KEY);
  const templates = useTemplateBlanks();
  if (!funding) {
    if (!templates) return <p className={WORKBOOK_HINT}>Not answered yet</p>;
    return (
      <div data-funding-wrap="">
        <AccentLabel as="h2">Planning</AccentLabel>
        <AccentLabel>How I&apos;ll cover my start-up costs</AccentLabel>
        <p className={`mt-2 ${WORKBOOK_BODY}`}>
          I&apos;ll cover my start-up cost of <BlankSlot /> from my own cash or savings.
        </p>
      </div>
    );
  }
  const currency = funding.currency === "USD" ? "USD" : funding.currency;
  const total = formatStartupMoney(funding.startupTotal, currency as "USD");
  const pay = funding.fundingPeriodPayment !== undefined ? formatWorkbookMoney(funding.fundingPeriodPayment, currency as "USD") : "";
  const weekly = funding.fundingWeeklyAmount !== undefined ? formatWorkbookMoney(funding.fundingWeeklyAmount, currency as "USD") : "";
  return (
    <div data-funding-wrap="">
      <AccentLabel as="h2">Planning</AccentLabel>
      <AccentLabel>How I&apos;ll cover my start-up costs</AccentLabel>
      {funding.fundingSource === "own_cash" ? (
        <p className={`mt-2 ${WORKBOOK_BODY}`}>
          I&apos;ll cover my start-up cost of <ChosenValue>{total}</ChosenValue> from my own cash or savings.
        </p>
      ) : (
        <ul className={`mt-2 list-disc pl-5 ${WORKBOOK_BODY}`}>
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
        <p className={`mt-2 ${WORKBOOK_HINT}`}>Real loans usually add interest; we&apos;ve left that out here to keep it simple.</p>
      )}
      <LargeScribble name="wallet" />
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
      <p className={`mt-3 ${WORKBOOK_BODY}`}>
        {addons.length ? (
          <>
            They often include <ChosenValue>{addons.join(" and ")}</ChosenValue>.
          </>
        ) : (
          "What others include is not checked yet."
        )}
      </p>
      <p className={`mt-2 ${WORKBOOK_BODY}`}>{idea ? <>I could do differently: <ChosenValue>{idea}</ChosenValue>.</> : ""}</p>
      <LargeScribble name="coins" />
    </div>
  );
}

export function PlanningWrapSheet({ sheet }: { sheet: "plan-1" | "plan-2" | "plan-3" | "plan-4" }) {
  return (
    <div data-planning-wrap={sheet}>
      {sheet === "plan-1" && <PlanSelling />}
      {sheet === "plan-2" && <PlanCosts />}
      {sheet === "plan-3" && <PlanOthers />}
      {sheet === "plan-4" && <PlanWeek />}
    </div>
  );
}

function PlanSelling() {
  const ctx = useLaunchpadAnswers();
  const templates = useTemplateBlanks();
  const offer = offerOf(ctx?.answers, OFFER_ANSWER_KEY);
  const customer = customerOf(ctx?.answers, CUSTOMER_ANSWER_KEY);
  const labels = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  return (
    <div>
      <AccentLabel>What I am selling</AccentLabel>
      {offer?.offerings.map((row) => (
        <p key={row.serviceId} className={`mt-1 ${WORKBOOK_BODY}`}>
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
      <AccentLabel>When and who might want it</AccentLabel>
      <p className={`mt-1 ${WORKBOOK_BODY}`}>
        {offer?.availability.length ? (
          <ChosenValue>{offer.availability.every(isAvailabilitySlot) ? availabilityPhrase(offer.availability) : offer.availability.map(chipLabel).join(", ")}</ChosenValue>
        ) : templates ? (
          <BlankSlot />
        ) : (
          "Not answered yet"
        )}
        .
      </p>
      {customer && (
        <p className={`mt-1 ${WORKBOOK_BODY}`}>
          I asked <ChosenValue>{customer.numberAsked}</ChosenValue> people. They were interested in <ChosenValue>{customer.interests.filter((id) => !WHEN_OPTIONS.some((time) => time.id === id)).map(chipLabel).join(", ")}</ChosenValue>.
          {customer.times && customer.times.length > 0 ? <> They wanted walks <ChosenValue>{availabilityPhrase(customer.times)}</ChosenValue>.</> : null}
        </p>
      )}
      <LargeScribble name="pawtrail" />
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
      <AccentLabel>My costs</AccentLabel>
      {[...view.marketing, ...view.starterGear].map((line) => (
        <div key={line.id} className={`${WORKBOOK_PRICE_ROW} border-b border-dashed border-[#E4D3B4] py-1 ${WORKBOOK_BODY}`} data-cost-row="">
          <span className="min-w-0">{line.label}</span>
          <span className="text-left tabular-nums"><ChosenValue>{formatStartupMoney(line.amount, currency)}</ChosenValue></span>
        </div>
      ))}
      <div className={`${WORKBOOK_PRICE_ROW} mt-2 ${WORKBOOK_BODY}`}>
        <span>Start-up total</span>
        <span className="text-left tabular-nums"><ChosenValue>{formatStartupMoney(view.startupTotal, currency)}</ChosenValue></span>
      </div>
      <p className={`mt-2 ${WORKBOOK_BODY}`}>
        Ongoing cost per job: {view.ongoing.map((row, index) => (
          <span key={row.serviceId}>
            {index > 0 ? ", " : ""}
            {row.label} <ChosenValue>{formatWorkbookMoney(row.perJob, currency)}</ChosenValue>
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
      <AccentLabel>What others charge</AccentLabel>
      <p className={`mt-1 ${WORKBOOK_BODY}`}>
        {competitor
          ? (
            <>
              <ChosenValue>{competitor.walkersChecked}</ChosenValue> other walkers charge <ChosenValue>{formatWorkbookMoney(competitor.priceLow, currency)}</ChosenValue> to <ChosenValue>{formatWorkbookMoney(competitor.priceHigh, currency)}</ChosenValue>. They often include <ChosenValue>{addons}</ChosenValue>.
            </>
          )
          : "Not checked yet."}
      </p>
      {competitor && (
        <p className={`mt-1 ${WORKBOOK_BODY}`}>
          I could do differently: <ChosenValue>{chipLabel(competitor.doDifferently).toLowerCase()}</ChosenValue>.
        </p>
      )}
      <AccentLabel>My price</AccentLabel>
      {price?.prices.map((row) => (
        <p key={row.serviceId} className={`mt-1 ${WORKBOOK_BODY}`}>
          {nameFor(row.serviceId, labels)} · I keep <ChosenValue>{formatWorkbookMoney(row.keptPerJob, currency)}</ChosenValue>
          <span className={`block ${WORKBOOK_HINT}`}>
            {formatWorkbookMoney(row.price, currency)} − {formatWorkbookMoney(row.costPerJob, currency)} = {formatWorkbookMoney(row.keptPerJob, currency)}
          </span>
        </p>
      ))}
      <p className={`mt-2 ${WORKBOOK_HINT}`}>Each line: price minus job cost equals what I keep. Costs and prices stay read-only here.</p>
    </div>
  );
}

function PlanWeek() {
  const ctx = useLaunchpadAnswers();
  const jobs = jobsOf(ctx?.answers, JOBS_COVER_ANSWER_KEY);
  const labels = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  const currency = readCurrencyPreference();
  const templates = useTemplateBlanks();
  if (!jobs) return templates ? <p className={`mt-2 ${WORKBOOK_BODY}`}>A typical week <BlankSlot /></p> : null;
  const mix = jobs.typicalWeek?.map((row) => `${row.jobsPerWeek} ${nameFor(row.serviceId, labels)}`).join(" + ") ?? "";
  const math = jobs.typicalWeek?.map((row) => `${row.jobsPerWeek} × ${formatWorkbookMoney(row.keptPerJob, currency)}`).join(" + ");
  return (
    <div>
      <AccentLabel>Jobs to cover my costs</AccentLabel>
      <p className="mt-2 font-sans text-[16px] font-semibold leading-6 text-[#4A5568]">Typical week</p>
      <p className={`mt-1 ${WORKBOOK_BODY}`}><ChosenValue>{mix}</ChosenValue> a week.</p>
      <p className={WORKBOOK_BODY}>Keep <ChosenValue>{formatWorkbookMoney(jobs.weeklyKeep ?? 0, currency)}</ChosenValue> a week.</p>
      <p className={WORKBOOK_BODY}>About <ChosenValue>{jobs.weeksNeeded}</ChosenValue> weeks to cover <ChosenValue>{formatStartupMoney(jobs.startupTotal, currency)}</ChosenValue> start-up.</p>
      {math && (
        <p className={`mt-1 ${WORKBOOK_HINT}`}>
          {math} = {formatWorkbookMoney(jobs.weeklyKeep ?? 0, currency)} a week.
        </p>
      )}
      <p className={`mt-2 ${WORKBOOK_HINT}`}>Your typical week stays read-only here.</p>
      <div className="mt-4 flex justify-end">
        <LargeScribble name="jar" />
      </div>
    </div>
  );
}
