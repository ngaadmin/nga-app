"use client";

import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Full-bleed banner chrome. Stats sit in a centered max-width row so they
 * line up with Academy / lesson content cards instead of viewport edges.
 */
export const STATUS_BANNER_SHELL_CLASS =
  "shrink-0 border-b border-nga-mist/50 bg-white/95 py-1.5 backdrop-blur-sm";

/** Matches dashboard `<main>` horizontal padding (`px-4 sm:px-6`). */
export const STATUS_BANNER_INSET_CLASS = "px-4 sm:px-6";

export const STATUS_BANNER_ROW_CLASS =
  "relative mx-auto grid h-9 w-full max-w-md grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3";

/**
 * Frameless inline stat / handle text — one size for every banner item.
 * Shared `leading-tight` keeps XP, hearts, and username on the same vertical centre
 * without clipping descenders (g/y/p).
 */
export const STATUS_BANNER_ITEM_CLASS =
  "inline-flex h-full min-w-0 items-center gap-1 font-heading text-xs font-bold leading-tight text-[#031F82]";

/** Uniform icon box aligned to banner text. */
export const STATUS_BANNER_ICON_CLASS = "size-3.5 shrink-0";

/** Round orange treatment for top-bar coins, streak, and skills cup icons. */
export const TOP_BAR_ROUND_ICON_CLASS =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FFA503] text-[#031F82] shadow-md";

export function TopBarRoundIcon({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn(TOP_BAR_ROUND_ICON_CLASS, className)} aria-hidden>
      {children}
    </span>
  );
}

type StatusBannerLayoutProps = {
  left?: ReactNode;
  center: ReactNode;
  right?: ReactNode;
  className?: string;
  rowClassName?: string;
  /**
   * Horizontal inset around the max-width row.
   * Defaults to dashboard main padding; lesson shells (already max-w-md) can tighten this.
   */
  insetClassName?: string;
  /** Gap between items in the left / right clusters. */
  clusterGapClassName?: string;
  "aria-label"?: string;
  style?: CSSProperties;
};

export function StatusBannerLayout({
  left,
  center,
  right,
  className,
  rowClassName,
  insetClassName = STATUS_BANNER_INSET_CLASS,
  clusterGapClassName = "gap-2",
  "aria-label": ariaLabel,
  style,
}: StatusBannerLayoutProps) {
  return (
    <div className={cn(STATUS_BANNER_SHELL_CLASS, className)} style={style}>
      <div className={insetClassName}>
        <div
          className={cn(STATUS_BANNER_ROW_CLASS, rowClassName)}
          aria-label={ariaLabel}
        >
          <div
            className={cn(
              "flex h-full min-w-0 items-center justify-start",
              clusterGapClassName,
            )}
          >
            {left}
          </div>

          <div className="flex h-full min-w-0 items-center justify-center">
            {center}
          </div>

          <div
            className={cn(
              "flex h-full min-w-0 items-center justify-end",
              clusterGapClassName,
            )}
          >
            {right}
          </div>
        </div>
      </div>
    </div>
  );
}
