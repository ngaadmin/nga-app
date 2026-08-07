"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  DASHBOARD_ACADEMY_PATH,
  readUserSession,
} from "@/lib/onboarding/guest-session";

/** Registered users skip signup - guest sessions may convert here. */
export function OnboardingSignUpRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isParentMasterFlow =
    searchParams.get("role") === "parent_master" &&
    Boolean((searchParams.get("token") ?? "").trim());

  useEffect(() => {
    // Parent master creation must stay on this screen until the form is submitted.
    if (isParentMasterFlow) return;

    const session = readUserSession();
    if (session?.accessMode === "registered") {
      router.replace(DASHBOARD_ACADEMY_PATH);
    }
  }, [isParentMasterFlow, router]);

  return null;
}
