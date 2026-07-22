import type { ComponentType } from "react";
import {
  AcademyIcon,
  AchievementsIcon,
  EngineIcon,
  SettingsIcon,
  VaultIcon,
} from "@/lib/dashboard/icons";

export type DashboardPillar =
  | "academy"
  | "engine"
  | "vault"
  | "achievements"
  | "settings";

export type DashboardNavItem = {
  id: DashboardPillar;
  label: string;
  href: `/dashboard/${DashboardPillar}`;
  Icon: ComponentType<{ className?: string }>;
};

export const DASHBOARD_NAV_ITEMS: readonly DashboardNavItem[] = [
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
  {
    id: "achievements",
    label: "Achievements",
    href: "/dashboard/achievements",
    Icon: AchievementsIcon,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/dashboard/settings",
    Icon: SettingsIcon,
  },
] as const;

export const DASHBOARD_SETTINGS_HREF = "/dashboard/settings" as const;
export const VAULT_CASH_IN_HREF = "/dashboard/vault?cashIn=1" as const;
export const DASHBOARD_DEFAULT_HREF = "/dashboard/academy" as const;

export function isNavItemActive(
  pathname: string,
  href: DashboardNavItem["href"],
): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
