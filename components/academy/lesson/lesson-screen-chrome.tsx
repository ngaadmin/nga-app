"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { LessonIllustration } from "@/lib/academy/lessons/types/declarative";
import { LessonIllustrationSlot } from "@/components/academy/lesson/lesson-ui";

type LessonScreenChromeContextValue = {
  illustration?: LessonIllustration;
};

const LessonScreenChromeContext =
  createContext<LessonScreenChromeContextValue | null>(null);

export function LessonScreenChromeProvider({
  illustration,
  children,
}: {
  illustration?: LessonIllustration;
  children: ReactNode;
}) {
  return (
    <LessonScreenChromeContext.Provider value={{ illustration }}>
      {children}
    </LessonScreenChromeContext.Provider>
  );
}

export function useLessonScreenIllustration(): LessonIllustration | undefined {
  return useContext(LessonScreenChromeContext)?.illustration;
}

/** Renders the shared illustration slot when the active screen defines one. */
export function LessonScreenIllustration() {
  const illustration = useLessonScreenIllustration();
  if (!illustration) return null;
  return <LessonIllustrationSlot {...illustration} />;
}
