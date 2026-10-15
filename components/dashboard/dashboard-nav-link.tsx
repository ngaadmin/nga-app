"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

export function DashboardNavLink({
  item,
  variant,
  denseLabel = false,
}: DashboardNavLinkProps) {
  const pathname = usePathname();
  const isActive = item.matchesPath
    ? item.matchesPath(pathname)
    : isNavItemActive(pathname, item.href);
  const { Icon } = item;

  function handleClick(event: React.MouseEvent<HTMLAnchorElement>) {
    const alreadyOnHref = pathname === item.href;
    // Settings sub-pages stay highlighted, but the item still opens main Settings.
    if (alreadyOnHref || (isActive && item.id !== "settings")) {
      event.preventDefault();
    }
  }

  if (variant === "bottom") {
    return (
      <Link
        href={item.href}
        onClick={handleClick}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex min-w-0 flex-col items-center gap-[3px] px-0.5 pt-2 pb-1",
          TACTILE_PRESS,
        )}
      >
        <span
          className={cn(
            "flex h-[30px] w-[52px] items-center justify-center rounded-full",
            isActive ? "bg-nga-cta text-nga-primary" : "text-nga-slate",
          )}
        >
          <Icon className="size-6 shrink-0" />
        </span>
        <span
          className={cn(
            "whitespace-nowrap font-sans leading-[14px] tracking-[-0.01em]",
            denseLabel ? "text-[10px]" : "text-[11px]",
            isActive ? "font-bold text-nga-primary" : "font-semibold text-nga-slate",
          )}
        >
          {item.shortLabel ??
            (item.label.startsWith("The ")
              ? item.label.replace("The ", "")
              : item.label)}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={handleClick}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex min-w-0 items-center gap-3 rounded-nga-lg border-2 border-b-4 px-4 py-3 font-heading text-sm font-bold",
        TACTILE_PRESS,
        isActive
          ? "border-nga-secondary border-b-nga-secondary bg-nga-secondary/15 text-nga-primary"
          : "border-transparent border-b-transparent text-nga-slate hover:bg-nga-mist/60",
      )}
    >
      <Icon className="size-6 shrink-0" />
      <span className="min-w-0 leading-tight">{item.label}</span>
    </Link>
  );
}
