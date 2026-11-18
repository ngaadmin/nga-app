"use client";

import { useEffect, useState } from "react";
import { resolveParentHubUnreadCount } from "@/lib/parent/parent-hub-unread";

/**
 * Unread Parent Hub items for the top-bar signals. Always 0 for non-parents.
 * In production the live source is 0 (no messages table yet). Off production,
 * `?parentUnread=N` overrides the count for preview testing.
 *
 * Starts at 0 on the first render so the server HTML and the hydrated client
 * match, then reads the query on the client.
 */
export function useParentHubUnreadCount(isParent: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isParent) {
      setCount(0);
      return;
    }
    setCount(resolveParentHubUnreadCount({ search: window.location.search }));
  }, [isParent]);

  return isParent ? count : 0;
}
