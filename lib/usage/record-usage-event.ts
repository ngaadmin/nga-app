"use client";

import { readDashboardWalletState } from "@/lib/dashboard/dashboard-wallet-storage";
import { readStoredDayStreak } from "@/lib/dashboard/streak-practice";
import { readUserSession } from "@/lib/onboarding/guest-session";
import { logUsageEvent } from "@/lib/usage/log-usage-event";
import { submitUsageEvent } from "@/lib/usage/submit-usage-event";
import type { UsageEventType } from "@/lib/usage/usage-events";

type UsageExtras = {
  lessonNumber?: number | null;
  metadata?: Record<string, unknown> | null;
};

/**
 * Read the current learner snapshot and send one usage event.
 * Fire-and-forget: this returns before the network call finishes.
 */
export function recordUsageEvent(
  eventType: UsageEventType,
  extras?: UsageExtras,
): void {
  try {
    logUsageEvent(
      {
        eventType,
        username: readUserSession()?.username ?? "",
        lessonNumber: extras?.lessonNumber ?? null,
        xpTotal: readXpTotal(),
        streakDays: readStreakDays(),
        metadata: extras?.metadata ?? null,
      },
      {
        insert: (row) => submitUsageEvent(row),
      },
    );
  } catch {
    // Tracking must never block a lesson, login, or page.
  }
}

function readXpTotal(): number | null {
  try {
    const wallet = readDashboardWalletState();
    if (!wallet) return null;
    if (wallet.lifetimePointsEarned > 0) return wallet.lifetimePointsEarned;
    return wallet.totalPoints;
  } catch {
    return null;
  }
}

function readStreakDays(): number | null {
  try {
    if (typeof window === "undefined") return null;
    return readStoredDayStreak();
  } catch {
    return null;
  }
}
