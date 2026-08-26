import type { ComponentType } from "react";
import {
  SHOW_LAUNCHPAD,
  isTestingVisibleNavId,
} from "@/lib/dashboard/feature-flags";
import {
  AcademyIcon,
  CommunityIcon,
  LaunchpadIcon,
  SettingsIcon,
  VaultIcon,
} from "@/lib/dashboard/icons";

export type DashboardPillar =
  | "academy"
  | "launchpad"
  | "community"
  | "vault"
  | "settings";

/** Shared nav link shape — used by pillar items and temporary beta entries. */
export type DashboardNavLinkItem = {
  id: string;
  label: string;
  href: string;
  Icon: ComponentType<{ className?: string }>;
  /** Compact label for the mobile bottom bar when `label` is long. */
  shortLabel?: string;
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
    label: "Business Launchpad",
    shortLabel: "Launchpad",
    href: "/dashboard/launchpad",
    Icon: LaunchpadIcon,
    matchesPath: (pathname) =>
      pathname === "/dashboard/launchpad" ||
      pathname.startsWith("/dashboard/launchpad/"),
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
    id: "community",
    label: "Community",
    href: "/dashboard/community",
    Icon: CommunityIcon,
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
export const DASHBOARD_COMMUNITY_HREF = "/dashboard/community" as const;

/**
 * Filters primary chrome nav for the active feature-flag surface.
 * Launchpad stays in `DASHBOARD_NAV_ITEMS`; it is only omitted from rendered
 * navigation while `SHOW_LAUNCHPAD` is false.
 */
export function filterDashboardNavForFeatureFlags<T extends DashboardNavLinkItem>(
  items: readonly T[],
): T[] {
  if (SHOW_LAUNCHPAD) {
    return [...items];
  }

  return items.filter((item) => isTestingVisibleNavId(item.id));
}

export function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
