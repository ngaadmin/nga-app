"use client";

import type { CostsAnswer } from "@/lib/launchpad/content/answers";
import {
  formatOngoingMoney,
  formatStartupMoney,
  workbookView,
} from "@/lib/launchpad/content/know-your-cost/logic";
import type { SupportedCurrencyCode } from "@/lib/dashboard/currency/currencies";
import { ChosenValue } from "@/components/launchpad/venture/handbook/chosen-value";
import { AccentLabel, HandRule, WORKBOOK_BODY, WORKBOOK_GROUP, WORKBOOK_HINT, WORKBOOK_PRICE_ROW } from "@/components/launchpad/venture/handbook/paper-art";
import { LargeScribble } from "@/components/launchpad/venture/handbook/scribble-mark";

function Pencil() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

function Row({ label, amount }: { label: string; amount: string }) {
  return (
    <div className={`${WORKBOOK_PRICE_ROW} ${WORKBOOK_BODY}`} data-cost-row="">
      <span className="min-w-0">{label}</span>
      <span className="text-left tabular-nums"><ChosenValue>{amount}</ChosenValue></span>
    </div>
  );
}

/**
 * Workbook My costs. Pencils sit on the start-up list and each service row.
 * Calculated totals have none.
 */
export function CostWorkbookBody({
  answer,
  currency,
  marketingLabel,
  starterLabel,
  hint,
  editable,
  onEditStartup,
  onEditService,
  part = "all",
}: {
  answer: CostsAnswer;
  currency: SupportedCurrencyCode;
  marketingLabel: string;
  starterLabel: string;
  hint: string;
  /** Page 3 is marketing. Page 3b is starter gear, the total, and job cost. */
  part?: "all" | "startup" | "rest";
  editable: boolean;
  onEditStartup?: () => void;
  onEditService?: (serviceId: string) => void;
}) {
  const view = workbookView(answer);
  const money = (amount: number) => formatStartupMoney(amount, currency);
  const job = (amount: number) => formatOngoingMoney(amount, currency);
  const startupHead = (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <h3 className="font-sans text-[16px] font-semibold leading-6 text-[#0CC1E0]">Start-up costs</h3>
      {editable && onEditStartup && (
        <button type="button" aria-label="Edit start-up costs" onClick={onEditStartup} className="flex size-11 items-center justify-center rounded-lg" data-pencil="">
          <Pencil />
        </button>
      )}
    </div>
  );
  return (
    <div data-cost-workbook="">
      <AccentLabel as="h2">My costs</AccentLabel>
      {part !== "rest" && (
        <div className="mt-3.5">
          {startupHead}
          <p className={`mb-1 ${WORKBOOK_GROUP}`}>{marketingLabel}</p>
          <div className="flex flex-col gap-0.5">
            {view.marketing.map((line) => (
              <Row key={line.id} label={line.label} amount={money(line.amount)} />
            ))}
          </div>
        </div>
      )}
      {part === "startup" && (
        <div className="mt-6 flex justify-end">
          <LargeScribble name="wallet" />
        </div>
      )}
      {part !== "startup" && (
        <>
          {part === "rest" && startupHead}
          <p className={`mb-1 mt-2 ${WORKBOOK_GROUP}`}>{starterLabel}</p>
          <div className="flex flex-col gap-0.5">
            {view.starterGear.map((line) => (
              <Row key={line.id} label={line.label} amount={money(line.amount)} />
            ))}
          </div>
          <div className={`${WORKBOOK_PRICE_ROW} mt-2.5 ${WORKBOOK_BODY}`}>
            <span>Start-up total</span>
            <span className="text-left tabular-nums" data-startup-total=""><ChosenValue>{money(view.startupTotal)}</ChosenValue></span>
          </div>
          <HandRule />
          <h3 className={`mb-1.5 ${WORKBOOK_GROUP}`}>Ongoing · cost per job</h3>
          <div className="flex flex-col gap-1">
            {view.ongoing.map((service) => (
              <div key={service.serviceId} className={`${WORKBOOK_PRICE_ROW} ${WORKBOOK_BODY}`}>
                <span className="flex min-w-0 items-center gap-1">
                  {editable && onEditService && (
                    <button type="button" aria-label={`Edit ${service.label}`} onClick={() => onEditService(service.serviceId)} className="flex size-11 flex-none items-center justify-center rounded-lg" data-pencil="">
                      <Pencil />
                    </button>
                  )}
                  <span className="min-w-0">{service.label}</span>
                </span>
                <span className="text-left tabular-nums"><ChosenValue>{job(service.perJob)}</ChosenValue></span>
              </div>
            ))}
          </div>
          <HandRule />
          <p className={WORKBOOK_HINT}>{hint}</p>
        </>
      )}
    </div>
  );
}
