"use client";

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

  useEffect(() => {
    for (const src of srcs) {
      if (started.current.has(src)) continue;
      started.current.add(src);
      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = src === prioritySrc ? "high" : "low";
      image.src = src;
      void image.decode?.().catch(() => undefined);
    }
  }, [prioritySrc, srcs]);

  return null;
}
