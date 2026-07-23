"use client";

import { useMemo, useState } from "react";
import { useCurrency } from "@/lib/dashboard/currency-context";
import {
  filterLedgerByPeriod,
  formatLedgerRowDate,
  ledgerFlowBarWidths,
  partitionLedgerEntries,
  summarizeLedgerFlow,
  type LedgerCategory,
  type LedgerEntry,
  type LedgerTimePeriod,
} from "@/lib/dashboard/vault-ledger";
import { cn } from "@/lib/utils/cn";

type LedgerCopy = {
  periodWeek: string;
  periodMonth: string;
  periodYear: string;
  periodAll: string;
  moneyInLabel: string;
  moneyOutLabel: string;
  inflowsHeading: string;
  outflowsHeading: string;
  activityHeading: string;
  emptyPeriod: string;
  categories: Record<LedgerCategory, string>;
};

type VaultLedgerViewProps = {
  ledger: LedgerEntry[];
  copy: LedgerCopy;
};

const PERIOD_LABEL_KEYS = {
  week: "periodWeek",
  month: "periodMonth",
  year: "periodYear",
  all: "periodAll",
} as const satisfies Record<LedgerTimePeriod, keyof LedgerCopy>;

const PERIOD_OPTIONS: LedgerTimePeriod[] = ["week", "month", "year", "all"];

const periodToggleClass =
  "rounded-full border px-2.5 py-1 font-heading text-[10px] font-bold transition-colors sm:text-xs";
const periodToggleActiveClass =
  "border-[#0CC1E0] bg-[#F0FBFF] text-[#031F82]";
const periodToggleIdleClass =
  "border-[#BDE9FB] bg-white text-[#1E3A5F]/75 hover:border-[#0CC1E0]/60";

type LedgerSectionProps = {
  heading: string;
  entries: LedgerEntry[];
  copy: LedgerCopy;
  variant: "in" | "out" | "neutral";
};

function LedgerSection({ heading, entries, copy, variant }: LedgerSectionProps) {
  const { formatMoney } = useCurrency();

  if (entries.length === 0) return null;

  return (
    <section className="space-y-1.5">
      <h3 className="font-heading text-[10px] font-bold uppercase tracking-[0.14em] text-[#1E3A5F]/55">
        {heading}
      </h3>
      <ul className="space-y-1">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className={cn(
              "flex items-center gap-2 rounded-lg px-2.5 py-2",
              entry.highlight ? "bg-[#DCB766]/12" : "bg-[#BDE9FB]/12",
            )}
          >
            <div className="min-w-0 flex-1">
              <p className="font-sans text-[11px] leading-snug text-[#031F82]">
                {entry.message}
              </p>
              <p className="mt-0.5 font-sans text-[10px] text-[#1E3A5F]/60">
                {formatLedgerRowDate(entry.timestamp)}
                {" · "}
                {copy.categories[entry.category]}
              </p>
            </div>
            {entry.amount !== undefined && entry.amount > 0 ? (
              <span
                className={cn(
                  "shrink-0 font-heading text-xs font-extrabold tabular-nums",
                  variant === "in" && "text-[#15803D]",
                  variant === "out" && "text-[#BE123C]",
                  variant === "neutral" && "text-[#031F82]",
                )}
              >
                {variant === "in" ? "+" : variant === "out" ? "-" : ""}
                {formatMoney(entry.amount)}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function VaultLedgerView({ ledger, copy }: VaultLedgerViewProps) {
  const { formatMoney } = useCurrency();
  const [period, setPeriod] = useState<LedgerTimePeriod>("month");

  const filteredLedger = useMemo(
    () => filterLedgerByPeriod(ledger, period),
    [ledger, period],
  );
  const summary = useMemo(
    () => summarizeLedgerFlow(filteredLedger),
    [filteredLedger],
  );
  const barWidths = useMemo(() => ledgerFlowBarWidths(summary), [summary]);
  const { inflows, outflows, activity } = useMemo(
    () => partitionLedgerEntries(filteredLedger),
    [filteredLedger],
  );

  const hasEntries = filteredLedger.length > 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Ledger time period">
        {PERIOD_OPTIONS.map((option) => {
          const isActive = period === option;
          const label = copy[PERIOD_LABEL_KEYS[option]];
          return (
            <button
              key={option}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setPeriod(option)}
              className={cn(
                periodToggleClass,
                isActive ? periodToggleActiveClass : periodToggleIdleClass,
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-[#BDE9FB]/80 bg-gradient-to-br from-[#F0FBFF] to-white p-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#15803D]">
              {copy.moneyInLabel}
            </p>
            <p className="font-heading text-lg font-extrabold tabular-nums text-[#15803D]">
              +{formatMoney(summary.totalIn)}
            </p>
          </div>
          <div className="text-right">
            <p className="font-heading text-[10px] font-bold uppercase tracking-wide text-[#BE123C]">
              {copy.moneyOutLabel}
            </p>
            <p className="font-heading text-lg font-extrabold tabular-nums text-[#BE123C]">
              -{formatMoney(summary.totalOut)}
            </p>
          </div>
        </div>
        <div
          className="mt-3 flex h-2 overflow-hidden rounded-full bg-[#BDE9FB]/40"
          aria-hidden
        >
          <span
            className="h-full bg-[#22C55E] transition-[width] duration-300"
            style={{ width: `${barWidths.inPercent}%` }}
          />
          <span
            className="h-full bg-[#FB7185] transition-[width] duration-300"
            style={{ width: `${barWidths.outPercent}%` }}
          />
        </div>
      </div>

      {hasEntries ? (
        <div className="max-h-72 space-y-3 overflow-y-auto pr-0.5">
          <LedgerSection
            heading={copy.inflowsHeading}
            entries={inflows}
            copy={copy}
            variant="in"
          />
          <LedgerSection
            heading={copy.outflowsHeading}
            entries={outflows}
            copy={copy}
            variant="out"
          />
          <LedgerSection
            heading={copy.activityHeading}
            entries={activity}
            copy={copy}
            variant="neutral"
          />
        </div>
      ) : (
        <p className="rounded-lg bg-[#BDE9FB]/10 px-3 py-4 text-center font-sans text-xs text-[#1E3A5F]/70">
          {copy.emptyPeriod}
        </p>
      )}
    </div>
  );
}
