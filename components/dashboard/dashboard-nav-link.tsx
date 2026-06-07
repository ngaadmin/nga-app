"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DashboardNavItem } from "@/lib/dashboard/navigation";
import { isNavItemActive } from "@/lib/dashboard/navigation";
import { TACTILE_PRESS } from "@/lib/dashboard/styles";
import { cn } from "@/lib/utils/cn";

type DashboardNavLinkProps = {
  item: DashboardNavItem;
  variant: "sidebar" | "bottom";
};

export function DashboardNavLink({ item, variant }: DashboardNavLinkProps) {
  const pathname = usePathname();
  const isActive = isNavItemActive(pathname, item.href);
  const { Icon } = item;

  if (variant === "bottom") {
    return (
      <Link
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-1 border-t-2 border-transparent px-2 py-2",
          TACTILE_PRESS,
          isActive
            ? "border-t-nga-secondary bg-nga-secondary/10 text-nga-primary"
            : "text-nga-slate",
        )}
      >
        <Icon className="size-6 shrink-0" />
        <span className="font-heading text-[10px] font-bold leading-tight">
          {item.label.replace("The ", "")}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
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
