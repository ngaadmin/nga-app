"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const LaunchpadFrameContext = createContext<{
  frame: boolean;
  setFrame: (frame: boolean) => void;
} | null>(null);

/** Lets the signed-in tower tell the dashboard shell to keep its own header and nav. */
export function LaunchpadFrameProvider({ children }: { children: ReactNode }) {
  const [frame, setFrame] = useState(false);
  return <LaunchpadFrameContext.Provider value={{ frame, setFrame }}>{children}</LaunchpadFrameContext.Provider>;
}

export function useLaunchpadFrame(): boolean {
  return useContext(LaunchpadFrameContext)?.frame ?? false;
}

export function useSetLaunchpadFrame(): (frame: boolean) => void {
  const ctx = useContext(LaunchpadFrameContext);
  return ctx?.setFrame ?? (() => {});
}
