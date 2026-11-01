"use client";

import { useLayoutEffect } from "react";
import { isTopInsetRedundant } from "@/lib/ui/lesson-viewport";

const TOP_VAR = "--lesson-safe-top";

function readInsetTop(): number {
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:fixed;top:0;left:0;visibility:hidden;pointer-events:none;padding-top:env(safe-area-inset-top,0px)";
  document.body.appendChild(probe);
  const value = parseFloat(getComputedStyle(probe).paddingTop) || 0;
  probe.remove();
  return value;
}

function isStandalone(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
}

/**
 * Keeps the fixed lesson viewport flush with the visible screen: drops a
 * doubled top inset and keeps the document itself from scrolling, so what
 * the learner sees and where their finger lands stay in the same place.
 */
export function LessonViewportGuard() {
  useLayoutEffect(() => {
    const root = document.documentElement;

    const sync = () => {
      const redundant = isTopInsetRedundant({
        standalone: isStandalone(),
        screenHeight: window.screen.height,
        screenWidth: window.screen.width,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        insetTop: readInsetTop(),
      });
      if (redundant) root.style.setProperty(TOP_VAR, "0px");
      else root.style.removeProperty(TOP_VAR);
      if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
    };

    const onScroll = () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
    };

    sync();
    // Insets can arrive after first paint on iOS.
    const timers = [120, 400, 1200].map((ms) => window.setTimeout(sync, ms));
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.visualViewport?.addEventListener("resize", sync);

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      window.removeEventListener("scroll", onScroll);
      window.visualViewport?.removeEventListener("resize", sync);
      root.style.removeProperty(TOP_VAR);
    };
  }, []);

  return null;
}
