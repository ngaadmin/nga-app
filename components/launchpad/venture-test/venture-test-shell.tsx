import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { VT } from "@/components/launchpad/venture-test/venture-test-colors";
import {
  AcademyTabIconA,
  CommunityTabIconA,
  LaunchpadTabIconA,
  SubscriptionTabIconA,
  VaultTabIconA,
} from "@/lib/dashboard/tab-icons-a";

/** Placeholder top-bar values for the test build (TBC). */
const PLACEHOLDER_STREAK = 3;
const PLACEHOLDER_COINS = 120;

type TabKey = "academy" | "launchpad" | "vault" | "community" | "subscription";

/** Same icon components the Academy sidebar and the app tab bar use. */
const TABS: readonly {
  key: TabKey;
  label: string;
  href: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { key: "academy", label: "Academy", href: "/dashboard/academy", Icon: AcademyTabIconA },
  { key: "launchpad", label: "Launchpad", href: "/dashboard/launchpad", Icon: LaunchpadTabIconA },
  { key: "vault", label: "Vault", href: "/dashboard/vault", Icon: VaultTabIconA },
  { key: "community", label: "Community", href: "/dashboard/community", Icon: CommunityTabIconA },
  { key: "subscription", label: "Subscription", href: "/dashboard/settings/subscription", Icon: SubscriptionTabIconA },
];

function TopBar() {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between px-4">
      <span className="flex size-[42px] items-center justify-center rounded-full bg-nga-panel" aria-label="Profile">
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="9" r="4" fill={VT.ink} />
          <path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7z" fill={VT.ink} />
        </svg>
      </span>
      <div className="flex font-heading text-[17px] font-bold text-nga-ink">
        <span className="ml-3.5 flex items-center gap-1.5" aria-label={`${PLACEHOLDER_STREAK} day streak`}>
          <span className="flex size-8 items-center justify-center rounded-full bg-nga-cta">
            <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true">
              <path d="M8 0c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 1 1 2 2 2 3 1-2 2-4 2-7z" fill={VT.ink} />
            </svg>
          </span>
          {PLACEHOLDER_STREAK}
        </span>
        <span className="ml-3.5 flex items-center gap-1.5" aria-label={`${PLACEHOLDER_COINS} coins`}>
          <span className="flex size-8 items-center justify-center rounded-full bg-nga-cta">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <circle cx="9" cy="9" r="7.5" fill="none" stroke={VT.ink} strokeWidth="2" />
              <text x="9" y="13" textAnchor="middle" fontWeight="800" fontSize="10" fill={VT.ink} style={{ fontFamily: "var(--font-heading)" }}>
                $
              </text>
            </svg>
          </span>
          {PLACEHOLDER_COINS}
        </span>
      </div>
    </header>
  );
}

/**
 * The fixed tab bar is 78px tall plus the device's bottom safe-area inset. The page
 * reserves exactly that much space under its content, so every screen's primary
 * button can scroll fully clear of the bar.
 */
export const TAB_BAR_CLASS = "h-[calc(78px+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)]";
export const TAB_BAR_CLEARANCE_CLASS = "pb-[calc(78px+env(safe-area-inset-bottom,0px))]";

function BottomBar() {
  return (
    <nav
      aria-label="Main navigation"
      className={`fixed inset-x-0 bottom-0 z-chrome mx-auto flex ${TAB_BAR_CLASS} w-full max-w-[430px] items-center justify-between bg-white px-1.5`}
      style={{ boxShadow: `0 -1px 0 ${VT.divider}` }}
    >
      {TABS.map((tab) => {
        const on = tab.key === "launchpad";
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={on ? "page" : undefined}
            className="flex w-[72px] flex-col items-center gap-1 whitespace-nowrap font-heading text-[10.5px] font-semibold text-nga-ink"
          >
            <span className={`flex h-8 w-[52px] items-center justify-center rounded-2xl ${on ? "bg-nga-cta" : ""}`}>
              <tab.Icon className="size-6" />
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * App-shell look-alike for the test build: white page, top bar, five tabs.
 * `focus` (task screens, AC2): like an Academy lesson, the top bar and tabs
 * step aside and the page is pinned to the viewport, so a task never scrolls
 * the page and its Next / Finish stays in view.
 */
export function VentureTestShell({ children, focus = false }: { children: ReactNode; focus?: boolean }) {
  if (focus) {
    return (
      <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-white text-nga-ink" data-focus-mode="">
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
    );
  }
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-white text-nga-ink">
      <TopBar />
      <main className={`flex min-h-0 flex-1 flex-col ${TAB_BAR_CLEARANCE_CLASS}`} data-tab-bar-clearance="">{children}</main>
      <BottomBar />
    </div>
  );
}
