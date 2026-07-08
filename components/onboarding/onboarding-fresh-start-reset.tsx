"use client";

import { useLayoutEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { clearAllAppSessionState } from "@/lib/onboarding/clear-app-session-state";

/**
 * Dev / QA helper: visit `/onboarding/start?reset=1` to wipe ghost session data
 * and land on the birth-year personalization gate as a new user.
 */
export function OnboardingFreshStartReset() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isReset = searchParams.get("reset") === "1";

  useLayoutEffect(() => {
    if (!isReset) return;
    clearAllAppSessionState();
    router.replace("/onboarding/start");
  }, [isReset, router]);

  return null;
}
