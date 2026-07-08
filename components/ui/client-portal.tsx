"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { LayerRootId } from "@/lib/ui/layers";

type ClientPortalProps = {
  rootId: LayerRootId;
  children: ReactNode;
};

export function ClientPortal({ rootId, children }: ClientPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const root = document.getElementById(rootId);
  if (!root) return null;

  return createPortal(children, root);
}
