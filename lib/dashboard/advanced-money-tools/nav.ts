import { TrendingUpIcon } from "@/lib/dashboard/icons";
import type { DashboardNavLinkItem } from "@/lib/dashboard/navigation";
import { advancedMoneyToolsCopy } from "@/lib/dashboard/advanced-money-tools/copy";

export const ADVANCED_MONEY_TOOLS_NAV_ITEM: DashboardNavLinkItem = {
  id: "advanced-money-tools",
  label: advancedMoneyToolsCopy.navLabel,
  shortLabel: "Advanced",
  href: "/dashboard/advanced-money-tools",
  Icon: TrendingUpIcon,
  matchesPath: (pathname) =>
    pathname === "/dashboard/advanced-money-tools" ||
    pathname.startsWith("/dashboard/advanced-money-tools/"),
};

export const ADVANCED_MONEY_TOOLS_HREF = ADVANCED_MONEY_TOOLS_NAV_ITEM.href;
