"use client";

import Image from "next/image";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { DashboardNavLink } from "@/components/dashboard/dashboard-nav-link";
import {
  DASHBOARD_DEFAULT_HREF,
  DASHBOARD_NAV_ITEMS,
} from "@/lib/dashboard/navigation";
import { withDashboardNavExtensions } from "@/lib/dashboard/dashboard-nav-extensions";
import { useTestingPremiumUnlocked } from "@/lib/dashboard/testing-premium";
import { zLayerStyle } from "@/lib/ui/layers";

const DESKTOP_NAV_QUERY = "(min-width: 768px)";

function subscribeToDesktopNav(callback: () => void) {
  const media = window.matchMedia(DESKTOP_NAV_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

function getDesktopNavSnapshot() {
  return window.matchMedia(DESKTOP_NAV_QUERY).matches;
}

function getDesktopNavServerSnapshot() {
  return false;
}

function useIsDesktopNav() {
  return useSyncExternalStore(
    subscribeToDesktopNav,
    getDesktopNavSnapshot,
    getDesktopNavServerSnapshot,
  );
}

export function DashboardNavigation() {
  const isDesktop = useIsDesktopNav();
  const advancedMoneyUnlocked = useTestingPremiumUnlocked();
  const navItems = withDashboardNavExtensions(DASHBOARD_NAV_ITEMS, {
    advancedMoneyUnlocked,
  });

  if (isDesktop) {
    return (
      <aside
        style={zLayerStyle("chrome")}
        className="fixed inset-y-0 left-0 flex w-64 flex-col border-r border-nga-mist bg-white"
      >
        <div className="flex flex-col items-center border-b border-nga-mist px-4 py-6">
          <Link
            href={DASHBOARD_DEFAULT_HREF}
            className="inline-flex items-center justify-center focus-visible:outline-offset-4"
            aria-label="NextGenAchievers Academy map"
          >
            <Image
              src="/nga-logo.png"
              alt="NextGenAchievers Logo"
              height={40}
              width={160}
              className="object-contain"
              unoptimized
            />
          </Link>
        </div>

        <nav
          className="flex flex-1 flex-col gap-2 overflow-y-auto px-3 py-6"
          aria-label="Main navigation"
        >
          {navItems.map((item) => (
            <DashboardNavLink key={item.id} item={item} variant="sidebar" />
          ))}
        </nav>
      </aside>
    );
  }

  return (
    <nav
      style={zLayerStyle("chrome")}
      data-dashboard-nav
      className="fixed bottom-0 left-0 right-0 flex border-t border-nga-mist bg-white"
      aria-label="Main navigation"
    >
      {navItems.map((item) => (
        <DashboardNavLink key={item.id} item={item} variant="bottom" />
      ))}
    </nav>
  );
}
