"use client";

import { useAcademyMediaBase } from "@/lib/academy/media/academy-media-context";
import { academyLessonImageSrc } from "@/lib/academy/media/academy-media";
import { useEffect, useRef } from "react";

/**
 * Fetch and decode lesson art before the screen that paints it is mounted.
 * The visible `<img>` still requests the same URL, which should already be decoded.
 */
export function LessonImagePreload({
  srcs,
  prioritySrc,
}: {
  srcs: readonly string[];
  prioritySrc?: string;
}) {
  const started = useRef(new Set<string>());
  const base = useAcademyMediaBase();

  useEffect(() => {
    for (const localSrc of srcs) {
      const src = academyLessonImageSrc(localSrc, base);
      if (started.current.has(src)) continue;
      started.current.add(src);
      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = localSrc === prioritySrc ? "high" : "low";
      image.src = src;
      void image.decode?.().catch(() => undefined);
    }
  }, [base, prioritySrc, srcs]);

  return null;
}
