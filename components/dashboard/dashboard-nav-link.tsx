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
};

export function DashboardNavLink({ item, variant }: DashboardNavLinkProps) {
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
          "flex flex-1 flex-col items-center justify-center gap-1 px-2 py-2",
          TACTILE_PRESS,
          isActive ? "text-[#FFA503]" : "text-nga-slate",
        )}
      >
        <Icon className="size-6 shrink-0" />
        <span className="text-center font-heading text-[13px] font-bold leading-tight">
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
        "flex items-center gap-3 rounded-nga-lg border-2 border-b-4 px-4 py-3 font-heading text-sm font-bold",
        TACTILE_PRESS,
        isActive
          ? "border-nga-secondary border-b-nga-secondary bg-nga-secondary/15 text-nga-primary"
          : "border-transparent border-b-transparent text-nga-slate hover:bg-nga-mist/60",
      )}
    >
      <Icon className="size-6 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}
