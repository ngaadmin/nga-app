"use client";

import { createContext, useContext, type ReactNode } from "react";
import { LAUNCHPAD_SURFACE_COPY, type LaunchpadSurfaceCopy } from "@/lib/launchpad/content/surface-copy";

/** Bundled payload copy. VentureFlow replaces it with the loaded venture. */
const SurfaceCopyContext = createContext<LaunchpadSurfaceCopy>(LAUNCHPAD_SURFACE_COPY);

export function SurfaceCopyProvider({ value, children }: { value: LaunchpadSurfaceCopy; children: ReactNode }) {
  return <SurfaceCopyContext.Provider value={value}>{children}</SurfaceCopyContext.Provider>;
}

export function useSurfaceCopy(): LaunchpadSurfaceCopy {
  return useContext(SurfaceCopyContext);
}
