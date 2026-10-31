"use client";

import { createContext, useContext, type ReactNode } from "react";
import { academyLessonImageSrc } from "@/lib/academy/media/academy-media";

/**
 * Bucket base for the lesson on screen. Set only for lessons read from the
 * database (Module 1 today). Empty means the older bundled lessons, which
 * still paint their pictures from /public.
 */
const AcademyMediaBaseContext = createContext("");

export function AcademyMediaProvider({ base, children }: { base: string; children: ReactNode }) {
  return <AcademyMediaBaseContext.Provider value={base}>{children}</AcademyMediaBaseContext.Provider>;
}

export function useAcademyMediaBase(): string {
  return useContext(AcademyMediaBaseContext);
}

/** Lesson picture URL: the bucket object for a database lesson, else unchanged. */
export function useAcademyMediaSrc<T extends string | undefined>(src: T): T {
  return academyLessonImageSrc(src, useContext(AcademyMediaBaseContext));
}
