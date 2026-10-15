"use client";

import { useLayoutEffect, useState, type ReactNode } from "react";
import { ClientPortal } from "@/components/ui/client-portal";
import { LAYER_CLASS, LAYER_ROOT_IDS, type LayerRootId } from "@/lib/ui/layers";
import { cn } from "@/lib/utils/cn";

type ModalLayer = "modal" | "toast";

type ModalShellProps = {
  isOpen: boolean;
  onClose?: () => void;
  layer?: ModalLayer;
  dismissOnBackdrop?: boolean;
  role?: "dialog" | "alertdialog";
  labelledBy?: string;
  describedBy?: string;
  align?: "bottom" | "center";
  backdropClassName?: string;
  panelClassName?: string;
  /** Card spans the backdrop inset instead of the default max-w-sm column. */
  stretch?: boolean;
  /**
   * Stop the backdrop above the mobile bottom nav so those links stay tappable.
   * The nav is outside the dialog, so it is not marked aria-modal.
   */
  clearBottomNav?: boolean;
  children: ReactNode;
};

const LAYER_TO_ROOT: Record<ModalLayer, LayerRootId> = {
  modal: LAYER_ROOT_IDS.modal,
  toast: LAYER_ROOT_IDS.toast,
};

export function ModalShell({
  isOpen,
  onClose,
  layer = "modal",
  dismissOnBackdrop = true,
  role = "dialog",
  labelledBy,
  describedBy,
  align = "bottom",
  backdropClassName,
  panelClassName,
  stretch = false,
  clearBottomNav = false,
  children,
}: ModalShellProps) {
  const [navClearance, setNavClearance] = useState(0);

  useLayoutEffect(() => {
    if (!isOpen || !clearBottomNav) return;

    const sync = () => {
      const nav = document.querySelector("[data-dashboard-nav]");
      const next =
        nav instanceof HTMLElement
          ? Math.ceil(nav.getBoundingClientRect().height)
          : 0;
      setNavClearance((current) => (current === next ? current : next));
    };

    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, [clearBottomNav, isOpen]);

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (dismissOnBackdrop) onClose?.();
  };

  return (
    <ClientPortal rootId={LAYER_TO_ROOT[layer]}>
      <div
        className={cn(
          "pointer-events-auto fixed inset-0 flex p-4",
          LAYER_CLASS.modal,
          align === "bottom"
            ? "items-end justify-center sm:items-center"
            : "items-center justify-center",
          backdropClassName ?? "bg-[#031F82]/50",
        )}
        role={role}
        aria-modal={role === "dialog" && !clearBottomNav ? true : undefined}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        data-hub-intro-backdrop={clearBottomNav ? "" : undefined}
        style={
          clearBottomNav && navClearance > 0
            ? { bottom: navClearance }
            : undefined
        }
        onClick={handleBackdropClick}
      >
        <div
          className={cn(stretch ? "w-full" : "w-full max-w-sm", panelClassName)}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </ClientPortal>
  );
}
