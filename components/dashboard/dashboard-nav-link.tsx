"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import {
  useDashboardNavPending,
  useDashboardPendingHref,
} from "@/components/dashboard/dashboard-nav-pending";
import type { DashboardNavLinkItem } from "@/lib/dashboard/navigation";
import { isNavItemActive } from "@/lib/dashboard/navigation";
import { TACTILE_PRESS } from "@/lib/dashboard/styles";
import { cn } from "@/lib/utils/cn";

type DashboardNavLinkProps = {
  item: DashboardNavLinkItem;
  variant: "sidebar" | "bottom";
  /** Six bottom tabs need a smaller label so "Community" still fits. */
  denseLabel?: boolean;
};

type NavLinkFaceProps = {
  item: DashboardNavLinkItem;
  variant: "sidebar" | "bottom";
  denseLabel: boolean;
  isActive: boolean;
};

function NavLinkFace({
  item,
  variant,
  denseLabel,
  isActive,
}: NavLinkFaceProps) {
  const { pending } = useLinkStatus();
  const pendingHref = useDashboardPendingHref();
  const { start, stop } = useDashboardNavPending();
  // Move the active pill to the tapped tab immediately. Until the route
  // commits, pathname still matches the screen we left.
  const highlighted = pendingHref ? pendingHref === item.href : isActive;

  useEffect(() => {
    if (!pending) return;
    start(item.href);
    return () => stop(item.href);
  }, [item.href, pending, start, stop]);
  const { Icon } = item;
  const label =
    item.shortLabel ??
    (item.label.startsWith("The ") ? item.label.replace("The ", "") : item.label);

  if (variant === "bottom") {
    return (
      <span
        aria-busy={pending || undefined}
        className={cn(
          "flex w-full min-w-0 flex-col items-center gap-[3px] px-0.5 pt-2 pb-1",
          TACTILE_PRESS,
        )}
      >
        <span
          className={cn(
            "flex h-[30px] w-[52px] items-center justify-center rounded-full",
            highlighted ? "bg-nga-cta text-nga-primary" : "text-nga-slate",
          )}
        >
          <Icon className="size-6 shrink-0" />
        </span>
        <span
          className={cn(
            "whitespace-nowrap font-sans leading-[14px] tracking-[-0.01em]",
            denseLabel ? "text-[10px]" : "text-[11px]",
            highlighted ? "font-bold text-nga-primary" : "font-semibold text-nga-slate",
          )}
        >
          {label}
        </span>
      </span>
    );
  }

  return (
    <span
      aria-busy={pending || undefined}
      className={cn(
        "flex w-full min-w-0 items-center gap-3 rounded-nga-lg border-2 border-b-4 px-4 py-3 font-heading text-sm font-bold",
        TACTILE_PRESS,
        highlighted
          ? "border-nga-secondary border-b-nga-secondary bg-nga-secondary/15 text-nga-primary"
          : "border-transparent border-b-transparent text-nga-slate hover:bg-nga-mist/60",
      )}
    >
      <Icon className="size-6 shrink-0" />
      <span className="min-w-0 leading-tight">{item.label}</span>
    </span>
  );
}

export function DashboardNavLink({
  item,
  variant,
  denseLabel = false,
}: DashboardNavLinkProps) {
  const pathname = usePathname();
  const isActive = item.matchesPath
    ? item.matchesPath(pathname)
    : isNavItemActive(pathname, item.href);

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    const alreadyOnHref = pathname === item.href;
    // Settings sub-pages stay highlighted, but the item still opens main Settings.
    if (alreadyOnHref || (isActive && item.id !== "settings")) {
      event.preventDefault();
    }
  }

  return (
    <Link
      href={item.href}
      prefetch
      onClick={handleClick}
      aria-current={isActive ? "page" : undefined}
      className={variant === "bottom" ? "flex min-w-0" : "block w-full"}
    >
      <NavLinkFace
        item={item}
        variant={variant}
        denseLabel={denseLabel}
        isActive={isActive}
      />
    </Link>
  );
}
