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
  /**
   * Keep the backdrop over the whole screen (bottom nav dimmed too) but sit
   * the card above the bottom nav, so a bottom sheet never collides with it.
   */
  liftAboveBottomNav?: boolean;
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
  liftAboveBottomNav = false,
  children,
}: ModalShellProps) {
  const measureNav = clearBottomNav || liftAboveBottomNav;
  const [navClearance, setNavClearance] = useState(0);

  useLayoutEffect(() => {
    if (!isOpen || !measureNav) return;

    // Clear everything from the nav's top edge down. The nav can grow after
    // the first measure without a window resize: iOS fills in
    // env(safe-area-inset-bottom) late on a fresh load, fonts swap, a tab is
    // added. A stale height let the backdrop cover the top of every tab, so a
    // tap there only closed the intro. Re-measure whenever the nav changes.
    let nav: HTMLElement | null = null;
    let observer: ResizeObserver | null = null;
    const sync = () => {
      const found = document.querySelector("[data-dashboard-nav]");
      const current = found instanceof HTMLElement ? found : null;
      if (current !== nav) {
        observer?.disconnect();
        nav = current;
        if (nav && typeof ResizeObserver !== "undefined") {
          observer = new ResizeObserver(sync);
          observer.observe(nav, { box: "border-box" });
        }
      }
      // A full-screen dialog (e.g. the Profile panel) already covers the nav:
      // dim the whole screen (inset 0) so no bright strip is left at the bottom.
      const navCovered =
        clearBottomNav && document.querySelector('[aria-modal="true"]') !== null;
      const next = nav && !navCovered
        ? Math.max(
            0,
            Math.ceil(window.innerHeight - nav.getBoundingClientRect().top),
          )
        : 0;
      setNavClearance((value) => (value === next ? value : next));
    };

    sync();
    let mutationFrame = 0;
    const mutations =
      clearBottomNav && typeof MutationObserver !== "undefined"
        ? new MutationObserver(() => {
            window.cancelAnimationFrame(mutationFrame);
            mutationFrame = window.requestAnimationFrame(sync);
          })
        : null;
    mutations?.observe(document.body, { childList: true, subtree: true });
    const frame = window.requestAnimationFrame(sync);
    const settle = window.setTimeout(sync, 400);
    const viewport = window.visualViewport;
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    viewport?.addEventListener("resize", sync);
    void document.fonts?.ready.then(sync);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      viewport?.removeEventListener("resize", sync);
      observer?.disconnect();
      mutations?.disconnect();
      window.cancelAnimationFrame(mutationFrame);
    };
  }, [measureNav, isOpen, clearBottomNav]);

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
            : liftAboveBottomNav && navClearance > 0
              ? { paddingBottom: navClearance + 12 }
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
