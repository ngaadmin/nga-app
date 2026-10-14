"use client";

import { createContext, useContext, type ReactNode } from "react";

const LessonHubProgressContext = createContext<ReadonlySet<string>>(new Set());

export function LessonHubProgressProvider({
  completed,
  children,
}: {
  completed: ReadonlySet<string>;
  children: ReactNode;
}) {
  return (
    <LessonHubProgressContext.Provider value={completed}>
      {children}
    </LessonHubProgressContext.Provider>
  );
}

export function useCompletedHubSkills(): ReadonlySet<string> {
  return useContext(LessonHubProgressContext);
}
