"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during server render and the first client render, true once React has
 * hydrated. Credential forms disable submit until then so a tap before
 * hydration cannot trigger a native browser submit.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
