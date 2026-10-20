"use client";

import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { shuffleSeed } from "@/lib/academy/lessons/seeded-shuffle";
import { readUserSession } from "@/lib/onboarding/guest-session";

const LessonShuffleScopeContext = createContext(0);

/** Lesson id mixed into every play shuffle. */
export function LessonShuffleScope({
  milestoneId,
  children,
}: {
  milestoneId: number;
  children: ReactNode;
}) {
  return (
    <LessonShuffleScopeContext.Provider value={milestoneId}>
      {children}
    </LessonShuffleScopeContext.Provider>
  );
}

function createPlayNonce(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Seed for one play of a screen.
 * Null during server render and the first client render so those trees match.
 * The layout effect fills it from the lesson id, the screen parts, the guest
 * `createdAt` or user id, and a nonce that stays put for this mount.
 */
export function usePlaySeed(parts: readonly (string | number)[]): number | null {
  const milestoneId = useContext(LessonShuffleScopeContext);
  const [seed, setSeed] = useState<number | null>(null);
  const nonceRef = useRef<string | null>(null);
  const partsKey = parts.map((part) => String(part)).join("\0");

  useLayoutEffect(() => {
    if (nonceRef.current === null) nonceRef.current = createPlayNonce();
    const session = readUserSession();
    const identity = session?.supabaseUserId || session?.createdAt || "guest";
    setSeed(shuffleSeed(milestoneId, partsKey, identity, nonceRef.current));
  }, [milestoneId, partsKey]);

  return seed;
}
