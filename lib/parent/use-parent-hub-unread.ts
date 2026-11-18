"use client";

import { useEffect, useState } from "react";
import { PARENT_HUB_UNREAD_CHANGED_EVENT } from "@/lib/launchpad/parent-approval/config";
import { fetchParentHubSignals } from "@/lib/parent/hub-signals-client";
import { readParentUnreadOverride } from "@/lib/parent/parent-hub-unread";

/** How often the open app asks again, so a request that arrives while the parent is here shows up. */
const REFRESH_MS = 60_000;

/**
 * Unread Parent Hub items for the top-bar signals. Always 0 for non-parents.
 * The live source is the number of Launchpad approval requests still waiting
 * on this parent. Off production, `?parentUnread=N` overrides the count for
 * preview testing (ignored in production).
 *
 * Starts at 0 on the first render so the server HTML and the hydrated client
 * match, then reads the query and the server count on the client.
 */
export function useParentHubUnreadCount(isParent: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isParent) {
      setCount(0);
      return;
    }
    const override = readParentUnreadOverride(window.location.search);
    if (override != null) {
      setCount(override);
      return;
    }
    let cancelled = false;
    const refresh = () => {
      void fetchParentHubSignals()
        .then(({ unreadCount }) => {
          if (!cancelled) setCount(unreadCount);
        })
        .catch(() => {
          // Keep the last count; the next refresh tries again.
        });
    };
    refresh();
    const timer = window.setInterval(refresh, REFRESH_MS);
    window.addEventListener("focus", refresh);
    const onChanged = (event: Event) => {
      // A request was just answered here: drop the count now, then confirm.
      const delta = (event as CustomEvent<{ pendingDelta?: number } | undefined>).detail?.pendingDelta;
      if (typeof delta === "number" && delta !== 0) setCount((current) => Math.max(0, current + delta));
      refresh();
    };
    window.addEventListener(PARENT_HUB_UNREAD_CHANGED_EVENT, onChanged);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(PARENT_HUB_UNREAD_CHANGED_EVENT, onChanged);
    };
  }, [isParent]);

  return isParent ? count : 0;
}
