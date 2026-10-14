"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import {
  applyCashUpdate,
  type CashUpdate,
} from "@/lib/academy/lessons/payload/cash-placeholder";

type LessonCashContextValue = {
  cash: number | null;
  commitCash: (update: CashUpdate) => void;
};

const LessonCashContext = createContext<LessonCashContextValue>({
  cash: null,
  commitCash: () => {},
});

/** Path cash for payload decision screens. Hard-coded lessons leave it unset. */
export function LessonCashProvider({ children }: { children: ReactNode }) {
  const cashRef = useRef<number | null>(null);
  const [cash, setCash] = useState<number | null>(null);

  const commitCash = useCallback((update: CashUpdate) => {
    const next = applyCashUpdate(cashRef.current, update);
    cashRef.current = next;
    setCash(next);
  }, []);

  return (
    <LessonCashContext.Provider value={{ cash, commitCash }}>
      {children}
    </LessonCashContext.Provider>
  );
}

export function useLessonCash(): LessonCashContextValue {
  return useContext(LessonCashContext);
}
