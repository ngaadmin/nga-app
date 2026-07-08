"use client";

import type { ReactNode } from "react";
import { ClientPortal } from "@/components/ui/client-portal";
import { LAYER_ROOT_IDS, type LayerRootId } from "@/lib/ui/layers";
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
  children,
}: ModalShellProps) {
  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (dismissOnBackdrop) onClose?.();
  };

  return (
    <ClientPortal rootId={LAYER_TO_ROOT[layer]}>
      <div
        className={cn(
          "pointer-events-auto fixed inset-0 flex bg-[#031F82]/50 p-4",
          align === "bottom"
            ? "items-end justify-center sm:items-center"
            : "items-center justify-center",
          backdropClassName,
        )}
        role={role}
        aria-modal={role === "dialog" ? true : undefined}
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        onClick={handleBackdropClick}
      >
        <div
          className={cn("w-full max-w-sm", panelClassName)}
          onClick={(event) => event.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </ClientPortal>
  );
}
