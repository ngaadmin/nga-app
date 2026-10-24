"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DASHBOARD_ACADEMY_PATH } from "@/lib/onboarding/guest-session";

/** Warm the Academy route from the home gate before a cohort is chosen. */
export function PrefetchAcademy() {
  const router = useRouter();

  useEffect(() => {
    router.prefetch(DASHBOARD_ACADEMY_PATH);
  }, [router]);

  return null;
}
