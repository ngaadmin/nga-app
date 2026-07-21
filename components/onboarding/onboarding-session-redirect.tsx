"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DASHBOARD_ACADEMY_PATH,
  hasCompletedPersonalizationGate,
  readUserSession,
} from "@/lib/onboarding/ghost-session";

/** Sends completed ghost sessions straight to the Academy map. */
export function OnboardingSessionRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("reset") === "1") return;

    if (hasCompletedPersonalizationGate(readUserSession())) {
      router.replace(DASHBOARD_ACADEMY_PATH);
    }
  }, [router, searchParams]);

  return null;
}
