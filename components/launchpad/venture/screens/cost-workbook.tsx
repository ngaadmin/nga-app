"use client";

import type { CostsAnswer } from "@/lib/launchpad/content/answers";
import {
  formatOngoingMoney,
  formatStartupMoney,
  workbookView,
} from "@/lib/launchpad/content/know-your-cost/logic";
import type { SupportedCurrencyCode } from "@/lib/dashboard/currency/currencies";
import { AccentLabel, HandRule } from "@/components/launchpad/venture/handbook/paper-art";
import { ART, Sticker } from "@/components/launchpad/venture/handbook/workbook-frame";

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
    <div className="flex items-baseline justify-between gap-3 text-[13px] leading-tight text-[#19347D]">
      <span className="min-w-0 flex-1">{label}</span>
      <span className="font-heading text-[14px] font-semibold tabular-nums">{amount}</span>
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
      <h3 className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9AA3B5]">Start-up costs</h3>
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
          <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#9AA3B5]">{marketingLabel}</p>
          <div className="flex flex-col gap-0.5">
            {view.marketing.map((line) => (
              <Row key={line.id} label={line.label} amount={money(line.amount)} />
            ))}
          </div>
        </div>
      )}
      {part === "startup" && (
        <div className="mt-6 flex justify-end">
          <Sticker src={ART.kit} alt="" />
        </div>
      )}
      {part !== "startup" && (
        <>
          {part === "rest" && startupHead}
          <p className="mb-1 mt-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#9AA3B5]">{starterLabel}</p>
          <div className="flex flex-col gap-0.5">
            {view.starterGear.map((line) => (
              <Row key={line.id} label={line.label} amount={money(line.amount)} />
            ))}
          </div>
          <div className="mt-2.5 flex items-baseline justify-between font-heading text-[15px] font-bold text-[#19347D]">
            <span>Start-up total</span>
            <span className="tabular-nums" data-startup-total="">{money(view.startupTotal)}</span>
          </div>
          <HandRule />
          <h3 className="mb-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-[#9AA3B5]">Ongoing · cost per job</h3>
          <div className="flex flex-col gap-1">
            {view.ongoing.map((service) => (
              <div key={service.serviceId} className="flex items-center justify-between gap-2 text-[14px] text-[#19347D]">
                <span className="flex min-w-0 flex-1 items-center gap-1">
                  {editable && onEditService && (
                    <button type="button" aria-label={`Edit ${service.label}`} onClick={() => onEditService(service.serviceId)} className="flex size-11 flex-none items-center justify-center rounded-lg" data-pencil="">
                      <Pencil />
                    </button>
                  )}
                  <span className="min-w-0">{service.label}</span>
                </span>
                <span className="font-heading text-[14px] font-semibold tabular-nums">{job(service.perJob)}</span>
              </div>
            ))}
          </div>
          <HandRule />
          <p className="text-[13.5px] leading-snug text-[#6B7280]">{hint}</p>
        </>
      )}
    </div>
  );
}
