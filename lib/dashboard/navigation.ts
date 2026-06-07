import type { ComponentType } from "react";
import {
  AcademyIcon,
  EngineIcon,
  HomeIcon,
  VaultIcon,
} from "@/lib/dashboard/icons";

export type DashboardPillar = "home" | "academy" | "engine" | "vault";

export type DashboardNavItem = {
  id: DashboardPillar;
  label: string;
  href: `/dashboard/${DashboardPillar}`;
  Icon: ComponentType<{ className?: string }>;
};

export const DASHBOARD_NAV_ITEMS: readonly DashboardNavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/dashboard/home",
    Icon: HomeIcon,
  },
  {
    id: "academy",
    label: "The Academy",
    href: "/dashboard/academy",
    Icon: AcademyIcon,
  },
  {
    id: "engine",
    label: "The Engine",
    href: "/dashboard/engine",
    Icon: EngineIcon,
  },
  {
    id: "vault",
    label: "The Vault",
    href: "/dashboard/vault",
    Icon: VaultIcon,
  },
] as const;

export const DASHBOARD_HOME_HREF = "/dashboard/home" as const;

export function isNavItemActive(
  pathname: string,
  href: DashboardNavItem["href"],
): boolean {
  if (
    href === DASHBOARD_HOME_HREF &&
    (pathname === "/dashboard" || pathname === DASHBOARD_HOME_HREF)
  ) {
    return true;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
