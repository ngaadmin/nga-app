"use client";

// TODO: remove after recordings
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { captureRecordingSuppressIntroQuery } from "@/lib/recording/suppress-intro-flag";

/** Captures ?recording=1 on any route, including sign-in before the dashboard. */
export function RecordingIntroQueryFlag() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    captureRecordingSuppressIntroQuery(searchParams.toString());
  }, [pathname, searchParams]);

  return null;
}
