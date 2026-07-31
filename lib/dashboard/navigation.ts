import type { ComponentType } from "react";
import {
  AcademyIcon,
  AchievementsIcon,
  LaunchpadIcon,
  SettingsIcon,
  VaultIcon,
} from "@/lib/dashboard/icons";

export type DashboardPillar =
  | "academy"
  | "launchpad"
  | "vault"
  | "achievements"
  | "settings";

/** Shared nav link shape — used by pillar items and temporary beta entries. */
export type DashboardNavLinkItem = {
  id: string;
  label: string;
  href: string;
  Icon: ComponentType<{ className?: string }>;
  /** Optional exact route matcher — use when sibling paths share a prefix. */
  matchesPath?: (pathname: string) => boolean;
};

export type DashboardNavItem = DashboardNavLinkItem & {
  id: DashboardPillar;
};

export const DASHBOARD_NAV_ITEMS: readonly DashboardNavItem[] = [
  {
    id: "academy",
    label: "Academy",
    href: "/dashboard/academy",
    Icon: AcademyIcon,
  },
  {
    id: "launchpad",
    label: "Launchpad",
    href: "/dashboard/launchpad",
    Icon: LaunchpadIcon,
  },
  {
    id: "vault",
    label: "Vault",
    href: "/dashboard/vault",
    Icon: VaultIcon,
    matchesPath: (pathname) =>
      pathname === "/dashboard/vault" || pathname.startsWith("/dashboard/vault/"),
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

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
