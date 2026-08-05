"use client";

import { useState, type ReactNode } from "react";
import {
  STATUS_BANNER_ITEM_CLASS,
} from "@/components/dashboard/status-banner-layout";
import { ModalShell } from "@/components/ui/modal-shell";
import { cn } from "@/lib/utils/cn";

/** @deprecated Use STATUS_BANNER_ITEM_CLASS — kept for existing imports. */
export const STATUS_METRIC_PILL_CLASS = STATUS_BANNER_ITEM_CLASS;

type StatusMetricPillProps = {
  icon: ReactNode;
  value: number | string;
  unitLabel?: string;
  ariaLabel: string;
  title?: string;
  /** When true, the item is tappable and opens `info` (or calls onClick). */
  interactive?: boolean;
  onClick?: () => void;
  info?: {
    title: string;
    body: string;
  };
  className?: string;
};

export function StatusMetricPill({
  icon,
  value,
  unitLabel,
  ariaLabel,
  title,
  interactive = false,
  onClick,
  info,
  className,
}: StatusMetricPillProps) {
  const [infoOpen, setInfoOpen] = useState(false);
  const displayValue =
    typeof value === "number" ? value.toLocaleString() : value;

  const content = (
    <>
      {icon}
      <span className="tabular-nums">{displayValue}</span>
      {unitLabel ? <span className="truncate">{unitLabel}</span> : null}
    </>
  );

  const canOpen = interactive && (Boolean(onClick) || Boolean(info));
  const itemClass = cn(STATUS_BANNER_ITEM_CLASS, className);

  if (!canOpen) {
    return (
      <div className={itemClass} aria-label={ariaLabel} title={title}>
        {content}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (onClick) {
            onClick();
            return;
          }
          setInfoOpen(true);
        }}
        className={cn(
          itemClass,
          "transition-opacity hover:opacity-70 active:opacity-55",
        )}
        aria-label={ariaLabel}
        title={title}
      >
        {content}
      </button>

      {info ? (
        <ModalShell
          isOpen={infoOpen}
          onClose={() => setInfoOpen(false)}
          layer="toast"
          labelledBy="status-metric-info-title"
          backdropClassName="bg-[#031F82]/50"
          panelClassName="rounded-2xl border-0 bg-white p-5 shadow-md sm:p-6"
        >
          <h2
            id="status-metric-info-title"
            className="font-heading text-xl font-extrabold leading-tight text-[#031F82] sm:text-2xl"
          >
            {info.title}
          </h2>
          <p className="mt-3 font-sans text-sm leading-relaxed text-[#1E3A5F]">
            {info.body}
          </p>
          <button
            type="button"
            onClick={() => setInfoOpen(false)}
            className="mt-5 inline-flex h-touch min-h-touch w-full items-center justify-center rounded-nga-lg border-b-4 border-[#0288A3] bg-[#0CC1E0] px-6 font-heading text-sm font-bold uppercase tracking-wide text-[#031F82] shadow-md transition-all hover:brightness-[1.02] active:translate-y-[2px] active:border-b-2"
          >
            Got it
          </button>
        </ModalShell>
      ) : null}
    </>
  );
}
