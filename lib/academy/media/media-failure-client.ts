"use client";

import { reportAcademyMediaFailure } from "@/lib/academy/media/report-media-failure";

const reported = new Set<string>();

/** Fire-and-forget. Each URL is reported once per page load. */
export function reportAcademyMediaFailed(src: string, kind: "image" | "audio" = "image"): void {
  try {
    if (!src || reported.has(src)) return;
    reported.add(src);
    const path = typeof window === "undefined" ? "" : window.location.pathname;
    // Also visible in the browser console for QA.
    console.warn("academy_media_failed", kind, src);
    void reportAcademyMediaFailure({ src, kind, path }).catch(() => {});
  } catch {
    // Never block a lesson.
  }
}
