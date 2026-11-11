"use client";

import { useSurfaceCopy } from "@/components/launchpad/venture/surface-copy";
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
  const s = useSurfaceCopy();
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
        <AccentLabel as="h2">{s.price.myPrice}</AccentLabel>
        <p className={`mt-2 ${WORKBOOK_HINT}`}>{s.price.eachService}</p>
        <p className={`mt-2 ${WORKBOOK_BODY}`}>Price <BlankSlot /> {s.price.forOne} <BlankSlot /></p>
      </div>
    );
  }
  return (
    <div data-price-sheet="">
      <AccentLabel as="h2">{s.price.myPrice}</AccentLabel>
      <p className={`mt-2 ${WORKBOOK_HINT}`}>{s.price.eachService}</p>
      {price.prices.map((row) => {
        const pkg = offer?.offerings.find((item) => item.serviceId === row.serviceId)?.packages[0];
        const compared = row.serviceId === "dog-walking" || row.serviceId === competitor?.jobComparedId;
        return (
        <div key={row.serviceId} className="mt-2 border-t border-dashed border-[#E4D3B4] pt-2">
          <div className={WORKBOOK_PRICE_ROW}>
            <h3 className={WORKBOOK_ANSWER}>{nameFor(row.serviceId, labels)}</h3>
            <span className="text-left"><ChosenValue>{formatWorkbookMoney(row.price, currency)}</ChosenValue></span>
          </div>
          <p className={`mt-1 ${WORKBOOK_BODY}`}>{s.price.forOne} <ChosenValue>{pkg ? chipLabel(pkg) : "job"}</ChosenValue></p>
          <p className={WORKBOOK_BODY}>
            {compared && competitor ? (
              <>
                {s.price.othersCharge} <ChosenValue>{formatWorkbookMoney(competitor.priceLow, currency)}</ChosenValue> to <ChosenValue>{formatWorkbookMoney(competitor.priceHigh, currency)}</ChosenValue>{s.price.mineIsShort} <ChosenValue>{row.comparedToOthers ?? s.price.aboutTheSame}</ChosenValue> others.
              </>
            ) : (
              s.price.notCheckedPeriod
            )}
          </p>
          <p className={`mt-2 ${WORKBOOK_BODY}`}>Price <ChosenValue>{formatWorkbookMoney(row.price, currency)}</ChosenValue></p>
          <p className={WORKBOOK_BODY}>{s.price.jobCostPerJob} <ChosenValue>{formatWorkbookMoney(row.costPerJob, currency)}</ChosenValue></p>
          <p className={WORKBOOK_BODY}>{s.jobs.iKeep} <ChosenValue>{formatWorkbookMoney(row.keptPerJob, currency)}</ChosenValue></p>
          <p className={WORKBOOK_HINT}>
            {formatWorkbookMoney(row.price, currency)} − {formatWorkbookMoney(row.costPerJob, currency)} = {formatWorkbookMoney(row.keptPerJob, currency)}
          </p>
        </div>
        );
      })}
      <p className={`mt-3 ${WORKBOOK_HINT}`}>{s.price.jobCostFrom}</p>
      <LargeScribble name="coins" />
    </div>
  );
}

export function JobsSheet() {
  const s = useSurfaceCopy();
  const ctx = useLaunchpadAnswers();
  const jobs = jobsOf(ctx?.answers, JOBS_COVER_ANSWER_KEY);
  const labels = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  const currency = readCurrencyPreference();
  const templates = useTemplateBlanks();
  if (!jobs) {
    if (!templates) return null;
    return (
      <div data-jobs-sheet="">
        <AccentLabel as="h2">{s.jobs.coverMine}</AccentLabel>
        <p className={`mt-3 ${WORKBOOK_BODY}`}><BlankSlot /> {s.jobs.jobsAWeekKeep} <BlankSlot /></p>
        <p className={`mt-3 ${WORKBOOK_BODY}`}>{s.jobs.weeklyKeep} <BlankSlot /></p>
        <p className={WORKBOOK_BODY}>{s.jobs.startupToCover} <BlankSlot /></p>
        <p className={`mt-1 ${WORKBOOK_BODY}`}>About <BlankSlot /> {s.jobs.weeksToCover}</p>
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
      <AccentLabel as="h2">{s.jobs.coverMine}</AccentLabel>
      {jobs.mode === "multi" && jobs.typicalWeek ? (
        <ul className="mt-3">
          {jobs.typicalWeek.map((row) => (
            <li key={row.serviceId} className={`flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-dashed border-[#E4D3B4] py-2 ${WORKBOOK_BODY}`}>
              <span className="flex shrink-0 items-center gap-2">
                <button type="button" aria-label={`${s.sheets.fewerJobs} ${nameFor(row.serviceId, labels)} ${s.jobs.jobsWord}`} className="flex size-8 items-center justify-center rounded-full border border-[#19347D] text-[#19347D]" onClick={() => changeCount(row.serviceId, -1)}>−</button>
                <span className="w-4 text-center"><ChosenValue>{row.jobsPerWeek}</ChosenValue></span>
                <button type="button" aria-label={`${s.sheets.moreJobs} ${nameFor(row.serviceId, labels)} ${s.jobs.jobsWord}`} className="flex size-8 items-center justify-center rounded-full border border-[#19347D] text-[#19347D]" onClick={() => changeCount(row.serviceId, 1)}>+</button>
                <span className="whitespace-nowrap">{nameFor(row.serviceId, labels)}</span>
              </span>
              <span className="shrink-0 whitespace-nowrap">{s.jobs.iKeep} <ChosenValue>{formatWorkbookMoney(row.subtotal, currency)}</ChosenValue></span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`mt-3 ${WORKBOOK_BODY}`}>
          <ChosenValue>{jobs.jobsPerWeek}</ChosenValue> {s.jobs.jobsAWeekKeep} <ChosenValue>{formatWorkbookMoney(jobs.keptPerJob ?? 0, currency)}</ChosenValue>
        </p>
      )}
      <p className={`mt-3 ${WORKBOOK_BODY}`}>{s.jobs.weeklyKeep} <ChosenValue>{formatWorkbookMoney(jobs.weeklyKeep ?? 0, currency)}</ChosenValue></p>
      <p className={WORKBOOK_BODY}>{s.jobs.startupToCover} <ChosenValue>{formatStartupMoney(jobs.startupTotal, currency)}</ChosenValue></p>
      <p className={`mt-1 ${WORKBOOK_BODY}`}>About <ChosenValue>{jobs.weeksNeeded}</ChosenValue> {s.jobs.weeksToCover}</p>
      <p className={`mt-1 ${WORKBOOK_HINT}`}>
        {formatStartupMoney(jobs.startupTotal, currency)} ÷ {formatWorkbookMoney(jobs.weeklyKeep ?? 0, currency)} {s.jobs.aWeek}
        {jobs.weeklyKeep ? ` = ${(jobs.startupTotal / jobs.weeklyKeep).toFixed(2)}${s.jobs.roundUp} ${jobs.weeksNeeded}` : ""}.
      </p>
      <WeekBar label={s.jobs.week1} width={100} />
      {jobs.weeksNeeded > 1 && <WeekBar label={s.jobs.week2} width={Math.round(((jobs.startupTotal / (jobs.weeklyKeep || 1)) - 1) * 100)} />}
      <LargeScribble name="growth" />
    </div>
  );
}

/** Funding wrap. Source and payback only. No lender. */
export function FundingSheet() {
  const s = useSurfaceCopy();
  const ctx = useLaunchpadAnswers();
  const funding = fundingOf(ctx?.answers, FUNDING_ANSWER_KEY);
  const templates = useTemplateBlanks();
  if (!funding) {
    if (!templates) return <p className={WORKBOOK_HINT}>{s.chrome.notAnswered}</p>;
    return (
      <div data-funding-wrap="">
        <AccentLabel as="h2">Planning</AccentLabel>
        <AccentLabel>{s.sheets.howIllCover}</AccentLabel>
        <p className={`mt-2 ${WORKBOOK_BODY}`}>
          {s.sheets.illCover} <BlankSlot /> {s.sheets.fromOwnCash}
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
      <AccentLabel>{s.sheets.howIllCover}</AccentLabel>
      {funding.fundingSource === "own_cash" ? (
        <p className={`mt-2 ${WORKBOOK_BODY}`}>
          {s.sheets.illCover} <ChosenValue>{total}</ChosenValue> {s.sheets.fromOwnCash}
        </p>
      ) : (
        <ul className={`mt-2 list-disc pl-5 ${WORKBOOK_BODY}`}>
          <li>{s.sheets.illBorrow} <ChosenValue>{total}</ChosenValue></li>
          <li>
            {funding.fundingRepayMode === "fixed_over_time" ? (
              <>
                {s.sheets.illPayFixed} <ChosenValue>{pay}</ChosenValue> each {funding.fundingRepayUnit === "months" ? "month" : "week"} for <ChosenValue>{funding.fundingRepayCount}</ChosenValue> {funding.fundingRepayUnit}.
              </>
            ) : (
              <>
                {s.sheets.illPay} <ChosenValue>{weekly}</ChosenValue> {s.sheets.aWeekAbout} <ChosenValue>{funding.fundingWeeksToRepay}</ChosenValue> weeks.
              </>
            )}
          </li>
        </ul>
      )}
      {funding.fundingSource === "borrow" && (
        <p className={`mt-2 ${WORKBOOK_HINT}`}>{s.sheets.interestNote}</p>
      )}
      <LargeScribble name="wallet" />
    </div>
  );
}

/** Pricing workbook page. The competitor lesson form stays separate. */
export function PricingSummarySheet() {
  const s = useSurfaceCopy();
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
            {s.competitor.oftenInclude} <ChosenValue>{addons.join(" and ")}</ChosenValue>.
          </>
        ) : (
          s.competitor.notCheckedIncludes
        )}
      </p>
      <p className={`mt-2 ${WORKBOOK_BODY}`}>{idea ? <>{s.competitor.couldDifferently} <ChosenValue>{idea}</ChosenValue>.</> : ""}</p>
      {(competitor?.jobComparedId || competitor?.jobComparedExtra?.trim()) && (
        <p className={`mt-1 ${WORKBOOK_BODY}`} data-job-compared="">
          {s.competitor.jobCompared}: {competitor.jobComparedId ? <span>{nameFor(competitor.jobComparedId, chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer"))}</span> : null}
          {competitor.jobComparedExtra?.trim() ? <> {competitor.jobComparedId ? " " : null}<ChosenValue>{competitor.jobComparedExtra}</ChosenValue></> : null}
        </p>
      )}
      {competitor?.addonsExtra?.trim() ? (
        <p className={`mt-1 ${WORKBOOK_BODY}`} data-competitor-extras="">
          {s.competitor.ownExtras}: <ChosenValue>{competitor.addonsExtra}</ChosenValue>
        </p>
      ) : null}
      {competitor?.doDifferentlyExtra?.trim() ? (
        <p className={`mt-1 ${WORKBOOK_BODY}`} data-differently-extra="">
          {s.competitor.ownIdea}: <ChosenValue>{competitor.doDifferentlyExtra}</ChosenValue>
        </p>
      ) : null}
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
  const s = useSurfaceCopy();
  const ctx = useLaunchpadAnswers();
  const templates = useTemplateBlanks();
  const offer = offerOf(ctx?.answers, OFFER_ANSWER_KEY);
  const customer = customerOf(ctx?.answers, CUSTOMER_ANSWER_KEY);
  const labels = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  return (
    <div>
      <AccentLabel>{s.sheets.selling}</AccentLabel>
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
      <AccentLabel>{s.sheets.whenWho}</AccentLabel>
      <p className={`mt-1 ${WORKBOOK_BODY}`}>
        {offer?.availability.length ? (
          <ChosenValue>{offer.availability.every(isAvailabilitySlot) ? availabilityPhrase(offer.availability) : offer.availability.map(chipLabel).join(", ")}</ChosenValue>
        ) : templates ? (
          <BlankSlot />
        ) : (
          s.chrome.notAnswered
        )}
        .
      </p>
      {customer && (
        <p className={`mt-1 ${WORKBOOK_BODY}`}>
          {s.sheets.iAsked} <ChosenValue>{customer.numberAsked}</ChosenValue> {s.sheets.peopleInterested} <ChosenValue>{customer.interests.filter((id) => !WHEN_OPTIONS.some((time) => time.id === id)).map(chipLabel).join(", ")}</ChosenValue>.
          {customer.times && customer.times.length > 0 ? <> {s.sheets.wantedWalks} <ChosenValue>{availabilityPhrase(customer.times)}</ChosenValue>.</> : null}
        </p>
      )}
      <LargeScribble name="pawtrail" />
    </div>
  );
}

function PlanCosts() {
  const s = useSurfaceCopy();
  const ctx = useLaunchpadAnswers();
  const costs = costsOf(ctx?.answers, "l2-costs");
  const view = costs ? workbookView(costs) : null;
  const currency = readCurrencyPreference();
  if (!view) return null;
  return (
    <div>
      <AccentLabel>{s.workbook.myCosts}</AccentLabel>
      {[...view.marketing, ...view.starterGear].map((line) => (
        <div key={line.id} className={`${WORKBOOK_PRICE_ROW} border-b border-dashed border-[#E4D3B4] py-1 ${WORKBOOK_BODY}`} data-cost-row="">
          <span className="min-w-0">{line.label}</span>
          <span className="text-left tabular-nums"><ChosenValue>{formatStartupMoney(line.amount, currency)}</ChosenValue></span>
        </div>
      ))}
      <div className={`${WORKBOOK_PRICE_ROW} mt-2 ${WORKBOOK_BODY}`}>
        <span>{s.costs.startupTotal}</span>
        <span className="text-left tabular-nums"><ChosenValue>{formatStartupMoney(view.startupTotal, currency)}</ChosenValue></span>
      </div>
      <p className={`mt-2 ${WORKBOOK_BODY}`}>
        {s.costs.ongoingCostLine} {view.ongoing.map((row, index) => (
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
  const s = useSurfaceCopy();
  const ctx = useLaunchpadAnswers();
  const competitor = competitorOf(ctx?.answers, COMPETITOR_ANSWER_KEY);
  const price = priceOf(ctx?.answers, SET_PRICE_ANSWER_KEY);
  const currency = readCurrencyPreference();
  const labels = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  const addons = competitor?.addons.map((id) => chipLabel(id).toLowerCase()).join(" and ") ?? "";
  return (
    <div>
      <AccentLabel>{s.price.whatOthersCharge}</AccentLabel>
      <p className={`mt-1 ${WORKBOOK_BODY}`}>
        {competitor
          ? (
            <>
              <ChosenValue>{competitor.walkersChecked}</ChosenValue> {s.price.otherWalkers} <ChosenValue>{formatWorkbookMoney(competitor.priceLow, currency)}</ChosenValue> to <ChosenValue>{formatWorkbookMoney(competitor.priceHigh, currency)}</ChosenValue>{s.price.theyIncludePeriod} <ChosenValue>{addons}</ChosenValue>.
            </>
          )
          : s.price.notCheckedShort}
      </p>
      {competitor && (
        <p className={`mt-1 ${WORKBOOK_BODY}`}>
          {s.competitor.couldDifferently} <ChosenValue>{chipLabel(competitor.doDifferently).toLowerCase()}</ChosenValue>.
        </p>
      )}
      <AccentLabel>{s.price.myPrice}</AccentLabel>
      {price?.prices.map((row) => (
        <p key={row.serviceId} className={`mt-1 ${WORKBOOK_BODY}`}>
          {nameFor(row.serviceId, labels)} {s.price.iKeepLead} <ChosenValue>{formatWorkbookMoney(row.keptPerJob, currency)}</ChosenValue>
          <span className={`block ${WORKBOOK_HINT}`}>
            {formatWorkbookMoney(row.price, currency)} − {formatWorkbookMoney(row.costPerJob, currency)} = {formatWorkbookMoney(row.keptPerJob, currency)}
          </span>
        </p>
      ))}
      <p className={`mt-2 ${WORKBOOK_HINT}`}>{s.price.eachLine}</p>
    </div>
  );
}

function PlanWeek() {
  const s = useSurfaceCopy();
  const ctx = useLaunchpadAnswers();
  const jobs = jobsOf(ctx?.answers, JOBS_COVER_ANSWER_KEY);
  const labels = chosenServices(ctx?.floors ?? [], ctx?.answers, "l1-offer");
  const currency = readCurrencyPreference();
  const templates = useTemplateBlanks();
  if (!jobs) return templates ? <p className={`mt-2 ${WORKBOOK_BODY}`}>{s.jobs.aTypicalWeek} <BlankSlot /></p> : null;
  const mix = jobs.typicalWeek?.map((row) => `${row.jobsPerWeek} ${nameFor(row.serviceId, labels)}`).join(" + ") ?? "";
  const math = jobs.typicalWeek?.map((row) => `${row.jobsPerWeek} × ${formatWorkbookMoney(row.keptPerJob, currency)}`).join(" + ");
  return (
    <div>
      <AccentLabel>{s.jobs.coverMine}</AccentLabel>
      <p className="mt-2 font-sans text-[16px] font-semibold leading-6 text-[#4A5568]">{s.jobs.typicalWeek}</p>
      <p className={`mt-1 ${WORKBOOK_BODY}`}><ChosenValue>{mix}</ChosenValue> {s.jobs.aWeekPeriod}</p>
      <p className={WORKBOOK_BODY}>Keep <ChosenValue>{formatWorkbookMoney(jobs.weeklyKeep ?? 0, currency)}</ChosenValue> {s.jobs.aWeekPeriod}</p>
      <p className={WORKBOOK_BODY}>About <ChosenValue>{jobs.weeksNeeded}</ChosenValue> {s.jobs.weeksToCoverShort} <ChosenValue>{formatStartupMoney(jobs.startupTotal, currency)}</ChosenValue> start-up.</p>
      {math && (
        <p className={`mt-1 ${WORKBOOK_HINT}`}>
          {math} = {formatWorkbookMoney(jobs.weeklyKeep ?? 0, currency)} {s.jobs.aWeekPeriod}
        </p>
      )}
      <p className={`mt-2 ${WORKBOOK_HINT}`}>{s.jobs.typicalReadOnly}</p>
      <div className="mt-4 flex justify-end">
        <LargeScribble name="jar" />
      </div>
    </div>
  );
}
