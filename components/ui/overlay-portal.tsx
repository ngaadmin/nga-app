"use client";

import type { ReactNode } from "react";
import { ClientPortal } from "@/components/ui/client-portal";
import { LAYER_ROOT_IDS } from "@/lib/ui/layers";
import { cn } from "@/lib/utils/cn";

type OverlayPortalProps = {
  children: ReactNode;
  className?: string;
};

/** Renders ephemeral UI (drag ghosts, confetti, inline alerts) into `#overlay-root`. */
export function OverlayPortal({ children, className }: OverlayPortalProps) {
  return (
    <ClientPortal rootId={LAYER_ROOT_IDS.overlay}>
      <div className={cn("pointer-events-none fixed inset-0", className)}>
        {children}
      </div>
    </ClientPortal>
  );
}
