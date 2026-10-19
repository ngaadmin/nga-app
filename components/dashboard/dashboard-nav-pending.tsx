"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import {
  DashboardLessonOpening,
  DashboardTabLoading,
} from "@/components/dashboard/dashboard-tab-loading";

/**
 * Static tab payloads do not paint `loading.tsx` until the response arrives.
 * A tap therefore keeps the previous screen up for the whole wait. This
 * records the in-flight href so the shell can swap in the existing skeleton
 * without waiting on that response. Fast navigations stay under the delay
 * and never flash.
 */
const PENDING_SCREEN_DELAY_MS = 120;
const PENDING_SCREEN_MAX_MS = 4000;

type NavPendingActions = {
  start: (href: string) => void;
  stop: (href: string) => void;
};

const NavPendingActionsContext = createContext<NavPendingActions | null>(null);
const NavPendingHrefContext = createContext<string | null>(null);

export function DashboardNavPendingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;
  const originRef = useRef(pathname);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const start = useCallback((href: string) => {
    if (pathnameRef.current === href) return;
    originRef.current = pathnameRef.current;
    setPendingHref(href);
  }, []);

  const stop = useCallback((href: string) => {
    setPendingHref((current) => (current === href ? null : current));
  }, []);

  useEffect(() => {
    if (!pendingHref) return;
    if (pathname === pendingHref || pathname !== originRef.current) {
      setPendingHref(null);
      return;
    }
    const timer = window.setTimeout(() => setPendingHref(null), PENDING_SCREEN_MAX_MS);
    return () => window.clearTimeout(timer);
  }, [pathname, pendingHref]);

  const actions = useMemo(() => ({ start, stop }), [start, stop]);

  return (
    <NavPendingActionsContext.Provider value={actions}>
      <NavPendingHrefContext.Provider value={pendingHref}>
        {children}
      </NavPendingHrefContext.Provider>
    </NavPendingActionsContext.Provider>
  );
}

export function useDashboardNavPending(): NavPendingActions {
  const actions = useContext(NavPendingActionsContext);
  if (!actions) {
    return {
      start: () => {},
      stop: () => {},
    };
  }
  return actions;
}

/** Href of a tab or lesson the user has tapped and the router has not committed. */
export function useDashboardPendingHref(): string | null {
  return useContext(NavPendingHrefContext);
}

export function DashboardPendingScreen({
  children,
}: {
  children: React.ReactNode;
}) {
  const pendingHref = useContext(NavPendingHrefContext);
  const [shownHref, setShownHref] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingHref) {
      setShownHref(null);
      return;
    }
    const timer = window.setTimeout(
      () => setShownHref(pendingHref),
      PENDING_SCREEN_DELAY_MS,
    );
    return () => window.clearTimeout(timer);
  }, [pendingHref]);

  if (!shownHref) return children;

  return shownHref.includes("/dashboard/academy/lesson/") ? (
    <DashboardLessonOpening />
  ) : (
    <DashboardTabLoading />
  );
}
