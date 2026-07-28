"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { LessonIllustration } from "@/lib/academy/lessons/types/declarative";
import {
  LessonIllustrationSlot,
  LessonIllustrationSlotReserve,
} from "@/components/academy/lesson/lesson-ui";

type LessonScreenChromeContextValue = {
  showIllustrationSlot: boolean;
  illustration?: LessonIllustration;
};

const LessonScreenChromeContext =
  createContext<LessonScreenChromeContextValue | null>(null);

export function LessonScreenChromeProvider({
  showIllustrationSlot,
  illustration,
  children,
}: {
  showIllustrationSlot: boolean;
  illustration?: LessonIllustration;
  children: ReactNode;
}) {
  return (
    <LessonScreenChromeContext.Provider
      value={{ showIllustrationSlot, illustration }}
    >
      {children}
    </LessonScreenChromeContext.Provider>
  );
}

export function useLessonScreenIllustration(): LessonIllustration | undefined {
  return useContext(LessonScreenChromeContext)?.illustration;
}

export function useLessonScreenIllustrationSlotEnabled(): boolean {
  return useContext(LessonScreenChromeContext)?.showIllustrationSlot === true;
}

/** Shared top illustration region — lighter screen types only. */
export function LessonScreenIllustration() {
  const context = useContext(LessonScreenChromeContext);
  if (!context?.showIllustrationSlot) return null;

  if (context.illustration) {
    return <LessonIllustrationSlot {...context.illustration} />;
  }

  return <LessonIllustrationSlotReserve />;
}
