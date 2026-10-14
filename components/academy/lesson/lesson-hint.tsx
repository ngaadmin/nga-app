"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

type LessonHintContextValue = {
  hint: string | null;
  setHint: (value: string | null) => void;
};

const LessonHintContext = createContext<LessonHintContextValue | null>(null);

export function LessonHintProvider({ children }: { children: ReactNode }) {
  const [hint, setHintState] = useState<string | null>(null);
  const setHint = useCallback((value: string | null) => {
    const next = value?.trim() ? value.trim() : null;
    setHintState((current) => (current === next ? current : next));
  }, []);
  const api = useMemo(() => ({ hint, setHint }), [hint, setHint]);

  return (
    <LessonHintContext.Provider value={api}>{children}</LessonHintContext.Provider>
  );
}

/** Publish the character hint. An empty message clears it. */
export function usePublishLessonHint(message: string | null | undefined) {
  const setHint = useContext(LessonHintContext)?.setHint;
  useEffect(() => {
    if (!setHint) return;
    setHint(message?.trim() ? message : null);
    return () => setHint(null);
  }, [message, setHint]);
}

/** Speech bubble over the character. It does not take layout space. */
export function LessonHintBubble() {
  const api = useContext(LessonHintContext);
  const hint = api?.hint ?? null;
  const [shown, setShown] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (hint) {
      setShown(hint);
      setVisible(false);
      const show = window.setTimeout(() => setVisible(true), 30);
      return () => window.clearTimeout(show);
    }
    setVisible(false);
    const hide = window.setTimeout(() => setShown(null), 280);
    return () => window.clearTimeout(hide);
  }, [hint]);

  if (!shown) return null;

  return (
    <p
      role="status"
      className={cn(
        "pointer-events-none absolute bottom-1 right-1 z-raised max-w-[14rem] rounded-2xl bg-white px-3 py-2 text-left font-sans text-[14px] font-semibold leading-snug text-[#031F82] shadow-[0_6px_16px_rgb(3_31_130_/_0.16)] transition-opacity duration-300",
        "before:absolute before:-bottom-1.5 before:left-5 before:size-3 before:rotate-45 before:bg-white",
        visible ? "opacity-100" : "opacity-0",
      )}
    >
      {shown}
    </p>
  );
}
